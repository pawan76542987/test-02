const IssueRequest = require('../models/IssueRequest');
const Asset = require('../models/Asset');
const requestService = require('../services/requestService');

class RequestController {
  // Request List with status tabs, search & pagination
  async getIndex(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const { status, q } = req.query;
      const query = {};

      // Role based restrictions
      if (req.user.role === 'student' || req.user.role === 'staff') {
        query.requester = req.user._id;
      } else if (req.user.role === 'lab_incharge' && req.user.assignedLabs && req.user.assignedLabs.length > 0) {
        query.lab = { $in: req.user.assignedLabs.map(l => l._id || l) };
      }

      // Status filtering
      const now = new Date();
      if (status && status !== 'all') {
        if (status === 'overdue') {
          query.status = 'issued';
          query.expectedReturnDate = { $lt: now };
        } else {
          query.status = status;
        }
      }

      // Keyword search (requestCode, purpose)
      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        query.$or = [
          { requestCode: regex },
          { purpose: regex }
        ];
      }

      const [requests, totalCount, statusCounts] = await Promise.all([
        IssueRequest.find(query)
          .populate('requester', 'name email idNumber department phone')
          .populate('asset', 'name assetTag availableQuantity issuedQuantity')
          .populate('lab', 'name code building roomNumber')
          .populate('reviewedBy', 'name')
          .populate('issuedBy', 'name')
          .populate('receivedBy', 'name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        IssueRequest.countDocuments(query),
        Promise.all([
          IssueRequest.countDocuments({ ...(req.user.role === 'student' || req.user.role === 'staff' ? { requester: req.user._id } : {}), status: 'pending' }),
          IssueRequest.countDocuments({ ...(req.user.role === 'student' || req.user.role === 'staff' ? { requester: req.user._id } : {}), status: 'approved' }),
          IssueRequest.countDocuments({ ...(req.user.role === 'student' || req.user.role === 'staff' ? { requester: req.user._id } : {}), status: 'issued' }),
          IssueRequest.countDocuments({ ...(req.user.role === 'student' || req.user.role === 'staff' ? { requester: req.user._id } : {}), status: 'returned' }),
          IssueRequest.countDocuments({ ...(req.user.role === 'student' || req.user.role === 'staff' ? { requester: req.user._id } : {}), status: 'issued', expectedReturnDate: { $lt: now } }),
          IssueRequest.countDocuments({ ...(req.user.role === 'student' || req.user.role === 'staff' ? { requester: req.user._id } : {}), status: 'rejected' })
        ])
      ]);

      const [pendingCount, approvedCount, issuedCount, returnedCount, overdueCount, rejectedCount] = statusCounts;
      const totalPages = Math.ceil(totalCount / limit) || 1;

      res.render('requests/index', {
        title: 'Equipment Issue Requests | LabTrack',
        requests,
        activeStatus: status || 'all',
        counts: {
          all: totalCount,
          pending: pendingCount,
          approved: approvedCount,
          issued: issuedCount,
          returned: returnedCount,
          overdue: overdueCount,
          rejected: rejectedCount
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          nextPage: page + 1,
          prevPage: page - 1
        },
        searchQuery: q || ''
      });
    } catch (err) {
      console.error('[Request Index Error]:', err);
      req.flash('error_msg', 'Failed to load requests.');
      res.redirect('/dashboard');
    }
  }

  // Render New Request form
  async getNew(req, res) {
    try {
      const assetId = req.query.assetId;
      let selectedAsset = null;

      if (assetId) {
        selectedAsset = await Asset.findOne({ _id: assetId, isDeleted: false })
          .populate('category')
          .populate('lab');
      }

      const availableAssets = await Asset.find({ isDeleted: false, availableQuantity: { $gt: 0 } })
        .populate('lab', 'name code')
        .sort({ name: 1 });

      res.render('requests/new', {
        title: 'Submit Equipment Request | LabTrack',
        selectedAsset,
        availableAssets
      });
    } catch (err) {
      console.error('[Request New Error]:', err);
      req.flash('error_msg', 'Failed to load request form.');
      res.redirect('/assets');
    }
  }

  // Handle Request Submission POST
  async postCreate(req, res) {
    try {
      const { assetId, requestedQuantity, purpose, expectedReturnDate } = req.body;

      const request = await requestService.createRequest({
        requesterId: req.user._id,
        assetId,
        requestedQuantity,
        purpose,
        expectedReturnDate
      });

      req.flash(
        'success_msg',
        `Request ${request.requestCode} submitted successfully! Awaiting Lab In-charge review.`
      );
      res.redirect(`/requests/${request._id}`);
    } catch (err) {
      console.error('[Request Create Error]:', err);
      req.flash('error_msg', err.message || 'Failed to submit request.');
      res.redirect('back');
    }
  }

  // View Single Request Details
  async getShow(req, res) {
    try {
      const request = await IssueRequest.findById(req.params.id)
        .populate('requester', 'name email idNumber department phone role userType')
        .populate({
          path: 'asset',
          populate: [
            { path: 'category', select: 'name code icon' },
            { path: 'lab', select: 'name code building roomNumber' }
          ]
        })
        .populate('lab', 'name code building roomNumber incharge')
        .populate('reviewedBy', 'name email role')
        .populate('issuedBy', 'name email role')
        .populate('receivedBy', 'name email role');

      if (!request) {
        req.flash('error_msg', 'Request record not found.');
        return res.redirect('/requests');
      }

      // Security check: normal users can only view their own requests
      if (req.user.role === 'student' || req.user.role === 'staff') {
        if (request.requester._id.toString() !== req.user._id.toString()) {
          req.flash('error_msg', 'Access denied. You do not have permission to view this request.');
          return res.redirect('/requests');
        }
      }

      res.render('requests/show', {
        title: `Request ${request.requestCode} | LabTrack`,
        request
      });
    } catch (err) {
      console.error('[Request Show Error]:', err);
      req.flash('error_msg', 'Error retrieving request details.');
      res.redirect('/requests');
    }
  }

  // Approve Request POST (Admin / Lab In-charge)
  async postApprove(req, res) {
    try {
      const { approvalNotes } = req.body;
      const request = await requestService.approveRequest(req.params.id, req.user._id, approvalNotes);

      req.flash('success_msg', `Request ${request.requestCode} has been approved.`);
      res.redirect(`/requests/${request._id}`);
    } catch (err) {
      console.error('[Request Approve Error]:', err);
      req.flash('error_msg', 'Approval failed: ' + err.message);
      res.redirect('back');
    }
  }

  // Reject Request POST (Admin / Lab In-charge)
  async postReject(req, res) {
    try {
      const { rejectionReason } = req.body;
      const request = await requestService.rejectRequest(req.params.id, req.user._id, rejectionReason);

      req.flash('success_msg', `Request ${request.requestCode} has been rejected.`);
      res.redirect(`/requests/${request._id}`);
    } catch (err) {
      console.error('[Request Reject Error]:', err);
      req.flash('error_msg', 'Rejection failed: ' + err.message);
      res.redirect('back');
    }
  }

  // Cancel Request POST
  async postCancel(req, res) {
    try {
      const request = await requestService.cancelRequest(req.params.id, req.user);
      req.flash('success_msg', `Request ${request.requestCode} has been cancelled.`);
      res.redirect(`/requests/${request._id}`);
    } catch (err) {
      console.error('[Request Cancel Error]:', err);
      req.flash('error_msg', 'Cancellation failed: ' + err.message);
      res.redirect('back');
    }
  }
}

module.exports = new RequestController();
