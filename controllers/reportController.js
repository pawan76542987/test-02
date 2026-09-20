const reportService = require('../services/reportService');
const Category = require('../models/Category');
const Lab = require('../models/Lab');

class ReportController {
  // Render main reports view
  async getReports(req, res) {
    try {
      const { startDate, endDate, category, lab, status } = req.query;

      const [reportData, categories, labs] = await Promise.all([
        reportService.getReportData({
          startDate,
          endDate,
          categoryId: category !== 'all' ? category : null,
          labId: lab !== 'all' ? lab : null,
          status: status !== 'all' ? status : null
        }),
        Category.find({ isActive: true }).sort({ name: 1 }),
        Lab.find({ isActive: true }).sort({ name: 1 })
      ]);

      res.render('reports/index', {
        title: 'System Analytics & Reports | LabTrack',
        reportData,
        categories,
        labs,
        filters: { startDate, endDate, category, lab, status }
      });
    } catch (err) {
      console.error('[Reports Error]:', err);
      req.flash('error_msg', 'Failed to generate report.');
      res.redirect('/dashboard');
    }
  }

  // Export Assets to CSV
  async exportAssetsCsv(req, res) {
    try {
      const { category, lab } = req.query;
      const reportData = await reportService.getReportData({
        categoryId: category !== 'all' ? category : null,
        labId: lab !== 'all' ? lab : null
      });

      const headers = [
        { label: 'Asset Tag', getValue: (a) => a.assetTag },
        { label: 'Equipment Name', getValue: (a) => a.name },
        { label: 'Category', getValue: (a) => a.category?.name || 'N/A' },
        { label: 'Lab Location', getValue: (a) => a.lab?.name || 'N/A' },
        { label: 'Total Quantity', getValue: (a) => a.totalQuantity },
        { label: 'Available Quantity', getValue: (a) => a.availableQuantity },
        { label: 'Issued Quantity', getValue: (a) => a.issuedQuantity },
        { label: 'Damaged Quantity', getValue: (a) => a.damagedQuantity },
        { label: 'Maintenance Quantity', getValue: (a) => a.maintenanceQuantity },
        { label: 'Lost Quantity', getValue: (a) => a.lostQuantity },
        { label: 'Condition', getValue: (a) => a.condition },
        { label: 'Status', getValue: (a) => a.status },
        { label: 'Unit Cost (INR)', getValue: (a) => a.cost || 0 }
      ];

      const csv = reportService.exportToCsv(reportData.assets, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="labtrack_assets_${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      console.error('[CSV Export Error]:', err);
      req.flash('error_msg', 'Failed to export assets CSV.');
      res.redirect('/reports');
    }
  }

  // Export Issue Requests / Transactions to CSV
  async exportRequestsCsv(req, res) {
    try {
      const { startDate, endDate, status } = req.query;
      const reportData = await reportService.getReportData({
        startDate,
        endDate,
        status: status !== 'all' ? status : null
      });

      const headers = [
        { label: 'Request Code', getValue: (r) => r.requestCode },
        { label: 'Requester Name', getValue: (r) => r.requester?.name || 'N/A' },
        { label: 'Requester Email', getValue: (r) => r.requester?.email || 'N/A' },
        { label: 'Requester ID', getValue: (r) => r.requester?.idNumber || 'N/A' },
        { label: 'Equipment Tag', getValue: (r) => r.asset?.assetTag || 'N/A' },
        { label: 'Equipment Name', getValue: (r) => r.asset?.name || 'N/A' },
        { label: 'Lab', getValue: (r) => r.lab?.name || 'N/A' },
        { label: 'Requested Quantity', getValue: (r) => r.requestedQuantity },
        { label: 'Purpose', getValue: (r) => r.purpose },
        { label: 'Status', getValue: (r) => r.status.toUpperCase() },
        { label: 'Request Date', getValue: (r) => r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '' },
        { label: 'Expected Return', getValue: (r) => r.expectedReturnDate ? new Date(r.expectedReturnDate).toISOString().split('T')[0] : '' },
        { label: 'Actual Return', getValue: (r) => r.actualReturnDate ? new Date(r.actualReturnDate).toISOString().split('T')[0] : '' },
        { label: 'Return Condition', getValue: (r) => r.returnCondition || 'N/A' },
        { label: 'Damaged Units', getValue: (r) => r.damagedUnits || 0 },
        { label: 'Lost Units', getValue: (r) => r.lostUnits || 0 }
      ];

      const csv = reportService.exportToCsv(reportData.requests, headers);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="labtrack_transactions_${Date.now()}.csv"`);
      res.status(200).send(csv);
    } catch (err) {
      console.error('[CSV Export Error]:', err);
      req.flash('error_msg', 'Failed to export requests CSV.');
      res.redirect('/reports');
    }
  }
}

module.exports = new ReportController();
