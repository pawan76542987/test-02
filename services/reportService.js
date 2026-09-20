const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');
const MaintenanceLog = require('../models/MaintenanceLog');

class ReportService {
  /**
   * Fetch filtered report metrics
   */
  async getReportData({ startDate, endDate, categoryId, labId, status }) {
    const assetQuery = { isDeleted: false };
    const requestQuery = {};

    if (categoryId) {
      assetQuery.category = categoryId;
      // Also filter requests for this category
      const assetsInCat = await Asset.find({ category: categoryId }).select('_id');
      requestQuery.asset = { $in: assetsInCat.map(a => a._id) };
    }

    if (labId) {
      assetQuery.lab = labId;
      requestQuery.lab = labId;
    }

    if (status) {
      requestQuery.status = status;
    }

    if (startDate || endDate) {
      requestQuery.createdAt = {};
      if (startDate) requestQuery.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        requestQuery.createdAt.$lte = end;
      }
    }

    const [assets, requests, maintenanceLogs] = await Promise.all([
      Asset.find(assetQuery).populate('category', 'name').populate('lab', 'name code'),
      IssueRequest.find(requestQuery)
        .populate('requester', 'name email idNumber')
        .populate('asset', 'name assetTag')
        .populate('lab', 'name code')
        .populate('issuedBy', 'name')
        .populate('receivedBy', 'name')
        .sort({ createdAt: -1 }),
      MaintenanceLog.find().populate('asset', 'name assetTag').populate('createdBy', 'name')
    ]);

    const totalIssuedUnits = requests
      .filter(r => r.status === 'issued')
      .reduce((sum, r) => sum + r.requestedQuantity, 0);

    const totalDamagedUnits = requests.reduce((sum, r) => sum + (r.damagedUnits || 0), 0);
    const totalLostUnits = requests.reduce((sum, r) => sum + (r.lostUnits || 0), 0);
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + (m.cost || 0), 0);

    return {
      assets,
      requests,
      maintenanceLogs,
      summary: {
        totalAssetsCount: assets.length,
        totalRequestsCount: requests.length,
        totalIssuedUnits,
        totalDamagedUnits,
        totalLostUnits,
        totalMaintenanceCost
      }
    };
  }

  /**
   * Convert JSON array to CSV string
   */
  exportToCsv(rows, headers) {
    if (!rows || !rows.length) return '';
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(h => escapeCsv(h.label)).join(',');
    const dataLines = rows.map(row => {
      return headers.map(h => escapeCsv(h.getValue(row))).join(',');
    });

    return [headerLine, ...dataLines].join('\n');
  }
}

module.exports = new ReportService();
