const MaintenanceLog = require('../models/MaintenanceLog');
const Asset = require('../models/Asset');

class MaintenanceController {
  // List all maintenance logs
  async getIndex(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const { status } = req.query;
      const query = {};

      if (status && status !== 'all') {
        query.status = status;
      }

      const [logs, totalCount, statusCounts] = await Promise.all([
        MaintenanceLog.find(query)
          .populate('asset')
          .populate('createdBy', 'name email')
          .sort({ serviceDate: -1 })
          .skip(skip)
          .limit(limit),
        MaintenanceLog.countDocuments(query),
        Promise.all([
          MaintenanceLog.countDocuments({ status: 'scheduled' }),
          MaintenanceLog.countDocuments({ status: 'in_progress' }),
          MaintenanceLog.countDocuments({ status: 'completed' })
        ])
      ]);

      const [scheduledCount, inProgressCount, completedCount] = statusCounts;
      const totalPages = Math.ceil(totalCount / limit) || 1;

      res.render('maintenance/index', {
        title: 'Maintenance & Service Logs | LabTrack',
        logs,
        activeStatus: status || 'all',
        counts: {
          all: totalCount,
          scheduled: scheduledCount,
          in_progress: inProgressCount,
          completed: completedCount
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          nextPage: page + 1,
          prevPage: page - 1
        }
      });
    } catch (err) {
      console.error('[Maintenance Index Error]:', err);
      req.flash('error_msg', 'Failed to load maintenance logs.');
      res.redirect('/dashboard');
    }
  }

  // Render maintenance creation form
  async getCreate(req, res) {
    try {
      const { assetId, fromReturn } = req.query;
      let selectedAsset = null;

      if (assetId) {
        selectedAsset = await Asset.findById(assetId);
      }

      const assets = await Asset.find({ isDeleted: false }).sort({ name: 1 });

      res.render('maintenance/create', {
        title: 'Schedule Equipment Maintenance | LabTrack',
        selectedAsset,
        fromReturn: fromReturn || null,
        assets
      });
    } catch (err) {
      req.flash('error_msg', 'Unable to load maintenance form.');
      res.redirect('/maintenance');
    }
  }

  // Handle Maintenance Creation POST
  async postCreate(req, res) {
    try {
      const { assetId, serviceDate, description, cost, technicianVendor, nextServiceDue, status, notes } = req.body;

      const asset = await Asset.findById(assetId);
      if (!asset) {
        req.flash('error_msg', 'Asset not found.');
        return res.redirect('/maintenance');
      }

      const log = new MaintenanceLog({
        asset: asset._id,
        serviceDate: serviceDate ? new Date(serviceDate) : new Date(),
        description: description.trim(),
        cost: cost ? parseFloat(cost) : 0,
        technicianVendor: technicianVendor.trim(),
        nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
        status: status || 'scheduled',
        notes: notes ? notes.trim() : '',
        createdBy: req.user._id
      });

      await log.save();

      // If scheduled or in progress and damaged items exist, move damaged to maintenance
      if (['scheduled', 'in_progress'].includes(log.status)) {
        if (asset.damagedQuantity > 0) {
          asset.maintenanceQuantity += asset.damagedQuantity;
          asset.damagedQuantity = 0;
        }
        if (asset.availableQuantity === 0) {
          asset.condition = 'under_maintenance';
        }
        await asset.save();
      }

      req.flash('success_msg', 'Maintenance record created successfully.');
      res.redirect('/maintenance');
    } catch (err) {
      console.error('[Maintenance Create Error]:', err);
      req.flash('error_msg', 'Failed to create maintenance log: ' + err.message);
      res.redirect('back');
    }
  }

  // Update maintenance status (e.g. mark completed)
  async postUpdateStatus(req, res) {
    try {
      const { status, resolutionNotes, restoreQuantity } = req.body;
      const log = await MaintenanceLog.findById(req.params.id).populate('asset');
      if (!log) {
        req.flash('error_msg', 'Maintenance record not found.');
        return res.redirect('/maintenance');
      }

      log.status = status;
      if (resolutionNotes) {
        log.notes = (log.notes ? log.notes + '\n' : '') + `[${new Date().toLocaleDateString()}] Resolution: ` + resolutionNotes.trim();
      }

      if (status === 'completed') {
        log.completedDate = new Date();

        // Restore asset inventory if specified
        const asset = await Asset.findById(log.asset._id);
        if (asset) {
          const qtyToRestore = parseInt(restoreQuantity, 10) || asset.maintenanceQuantity;
          if (qtyToRestore > 0) {
            asset.maintenanceQuantity = Math.max(0, asset.maintenanceQuantity - qtyToRestore);
            asset.availableQuantity += qtyToRestore;
            asset.condition = 'good';
            await asset.save();
          }
        }
      }

      await log.save();
      req.flash('success_msg', `Maintenance status updated to ${status.toUpperCase()}.`);
      res.redirect('/maintenance');
    } catch (err) {
      console.error('[Maintenance Status Update Error]:', err);
      req.flash('error_msg', 'Failed to update maintenance status.');
      res.redirect('back');
    }
  }
}

module.exports = new MaintenanceController();
