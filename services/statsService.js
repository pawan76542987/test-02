const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');
const User = require('../models/User');
const Lab = require('../models/Lab');
const Category = require('../models/Category');
const MaintenanceLog = require('../models/MaintenanceLog');

class StatsService {
  /**
   * Fetch complete real MongoDB aggregated statistics for Admin Dashboard
   */
  async getAdminStats() {
    const now = new Date();

    // Aggregated asset quantities
    const [assetTotals] = await Asset.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalUnits: { $sum: '$totalQuantity' },
          availableUnits: { $sum: '$availableQuantity' },
          issuedUnits: { $sum: '$issuedQuantity' },
          damagedUnits: { $sum: '$damagedQuantity' },
          maintenanceUnits: { $sum: '$maintenanceQuantity' },
          lostUnits: { $sum: '$lostQuantity' },
          totalValue: { $sum: '$cost' }
        }
      }
    ]) || [{}];

    // Request counts by status
    const [pendingCount, approvedCount, issuedCount, returnedCount, overdueCount, userCount, labCount, categoryCount, maintenanceCount] = await Promise.all([
      IssueRequest.countDocuments({ status: 'pending' }),
      IssueRequest.countDocuments({ status: 'approved' }),
      IssueRequest.countDocuments({ status: 'issued' }),
      IssueRequest.countDocuments({ status: 'returned' }),
      IssueRequest.countDocuments({ status: 'issued', expectedReturnDate: { $lt: now } }),
      User.countDocuments({ isActive: true }),
      Lab.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      MaintenanceLog.countDocuments({ status: { $in: ['scheduled', 'in_progress'] } })
    ]);

    // Category distribution for charts
    const categoryStats = await Asset.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalUnits: { $sum: '$totalQuantity' },
          issuedUnits: { $sum: '$issuedQuantity' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      },
      { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$categoryInfo.name', 'Uncategorized'] },
          count: 1,
          totalUnits: 1,
          issuedUnits: 1
        }
      }
    ]);

    // Lab distribution for charts
    const labStats = await Asset.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$lab',
          count: { $sum: 1 },
          totalUnits: { $sum: '$totalQuantity' },
          issuedUnits: { $sum: '$issuedQuantity' }
        }
      },
      {
        $lookup: {
          from: 'labs',
          localField: '_id',
          foreignField: '_id',
          as: 'labInfo'
        }
      },
      { $unwind: { path: '$labInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ['$labInfo.name', 'Unassigned Lab'] },
          count: 1,
          totalUnits: 1,
          issuedUnits: 1
        }
      }
    ]);

    // Recent requests
    const recentRequests = await IssueRequest.find()
      .populate('requester', 'name email idNumber')
      .populate('asset', 'name assetTag')
      .populate('lab', 'name code')
      .sort({ createdAt: -1 })
      .limit(6);

    // Recent returns
    const recentReturns = await IssueRequest.find({ status: 'returned' })
      .populate('requester', 'name email')
      .populate('asset', 'name assetTag')
      .populate('receivedBy', 'name')
      .sort({ actualReturnDate: -1 })
      .limit(5);

    // Overdue items list
    const overdueList = await IssueRequest.find({
      status: 'issued',
      expectedReturnDate: { $lt: now }
    })
      .populate('requester', 'name email department phone')
      .populate('asset', 'name assetTag')
      .populate('lab', 'name')
      .sort({ expectedReturnDate: 1 })
      .limit(5);

    return {
      totalAssets: assetTotals?.totalAssets || 0,
      totalUnits: assetTotals?.totalUnits || 0,
      availableUnits: assetTotals?.availableUnits || 0,
      issuedUnits: assetTotals?.issuedUnits || 0,
      damagedUnits: assetTotals?.damagedUnits || 0,
      maintenanceUnits: assetTotals?.maintenanceUnits || 0,
      lostUnits: assetTotals?.lostUnits || 0,
      totalValue: assetTotals?.totalValue || 0,
      pendingCount,
      approvedCount,
      issuedCount,
      returnedCount,
      overdueCount,
      userCount,
      labCount,
      categoryCount,
      maintenanceCount,
      categoryStats,
      labStats,
      recentRequests,
      recentReturns,
      overdueList
    };
  }

  /**
   * Fetch statistics for Lab In-charge Dashboard
   */
  async getLabInchargeStats(user) {
    const now = new Date();
    let labFilter = {};

    if (user.assignedLabs && user.assignedLabs.length > 0) {
      labFilter = { lab: { $in: user.assignedLabs.map(l => l._id || l) } };
    }

    const [assetTotals] = await Asset.aggregate([
      { $match: { isDeleted: false, ...labFilter } },
      {
        $group: {
          _id: null,
          totalAssets: { $sum: 1 },
          totalUnits: { $sum: '$totalQuantity' },
          availableUnits: { $sum: '$availableQuantity' },
          issuedUnits: { $sum: '$issuedQuantity' },
          damagedUnits: { $sum: '$damagedQuantity' }
        }
      }
    ]) || [{}];

    const requestFilter = labFilter.lab ? { lab: labFilter.lab } : {};

    const [pendingCount, approvedCount, issuedCount, overdueCount, recentRequests, overdueItems] = await Promise.all([
      IssueRequest.countDocuments({ status: 'pending', ...requestFilter }),
      IssueRequest.countDocuments({ status: 'approved', ...requestFilter }),
      IssueRequest.countDocuments({ status: 'issued', ...requestFilter }),
      IssueRequest.countDocuments({ status: 'issued', expectedReturnDate: { $lt: now }, ...requestFilter }),
      IssueRequest.find(requestFilter)
        .populate('requester', 'name email idNumber')
        .populate('asset', 'name assetTag')
        .populate('lab', 'name code')
        .sort({ createdAt: -1 })
        .limit(8),
      IssueRequest.find({ status: 'issued', expectedReturnDate: { $lt: now }, ...requestFilter })
        .populate('requester', 'name email department phone')
        .populate('asset', 'name assetTag')
        .populate('lab', 'name')
        .sort({ expectedReturnDate: 1 })
        .limit(6)
    ]);

    return {
      totalAssets: assetTotals?.totalAssets || 0,
      totalUnits: assetTotals?.totalUnits || 0,
      availableUnits: assetTotals?.availableUnits || 0,
      issuedUnits: assetTotals?.issuedUnits || 0,
      damagedUnits: assetTotals?.damagedUnits || 0,
      pendingCount,
      approvedCount,
      issuedCount,
      overdueCount,
      recentRequests,
      overdueItems
    };
  }

  /**
   * Fetch statistics for Requester Dashboard
   */
  async getRequesterStats(userId) {
    const now = new Date();

    const [pendingCount, approvedCount, issuedCount, returnedCount, overdueCount, activeRequests, recentHistory] = await Promise.all([
      IssueRequest.countDocuments({ requester: userId, status: 'pending' }),
      IssueRequest.countDocuments({ requester: userId, status: 'approved' }),
      IssueRequest.countDocuments({ requester: userId, status: 'issued' }),
      IssueRequest.countDocuments({ requester: userId, status: 'returned' }),
      IssueRequest.countDocuments({ requester: userId, status: 'issued', expectedReturnDate: { $lt: now } }),
      IssueRequest.find({ requester: userId, status: { $in: ['pending', 'approved', 'issued'] } })
        .populate('asset')
        .populate('lab')
        .sort({ createdAt: -1 }),
      IssueRequest.find({ requester: userId })
        .populate('asset')
        .populate('lab')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    return {
      pendingCount,
      approvedCount,
      issuedCount,
      returnedCount,
      overdueCount,
      activeRequests,
      recentHistory
    };
  }
}

module.exports = new StatsService();
