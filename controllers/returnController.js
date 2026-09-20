const IssueRequest = require('../models/IssueRequest');
const requestService = require('../services/requestService');

class ReturnController {
  // Issue equipment (Admin / Lab In-charge)
  async postIssue(req, res) {
    try {
      const { issueNotes } = req.body;
      const request = await requestService.issueEquipment(req.params.id, req.user._id, issueNotes);

      req.flash('success_msg', `Equipment for request ${request.requestCode} successfully marked as ISSUED.`);
      res.redirect(`/requests/${request._id}`);
    } catch (err) {
      console.error('[Issue Equipment Error]:', err);
      req.flash('error_msg', 'Failed to issue equipment: ' + err.message);
      res.redirect('back');
    }
  }

  // Render return form
  async getReturnPage(req, res) {
    try {
      const request = await IssueRequest.findById(req.params.id)
        .populate('requester', 'name email idNumber department')
        .populate('asset')
        .populate('lab');

      if (!request) {
        req.flash('error_msg', 'Request not found.');
        return res.redirect('/requests');
      }

      if (request.status !== 'issued') {
        req.flash('error_msg', `Cannot return equipment. Request is currently '${request.status}', expected 'issued'.`);
        return res.redirect(`/requests/${request._id}`);
      }

      res.render('returns/process', {
        title: `Process Equipment Return | ${request.requestCode}`,
        request
      });
    } catch (err) {
      console.error('[Return Page Error]:', err);
      req.flash('error_msg', 'Error loading return interface.');
      res.redirect('/requests');
    }
  }

  // Handle return POST
  async postReturn(req, res) {
    try {
      const { condition, returnNotes, okUnits, damagedUnits, lostUnits } = req.body;

      const request = await requestService.recordReturn(req.params.id, req.user._id, {
        condition: condition || 'ok',
        returnNotes: returnNotes ? returnNotes.trim() : '',
        okUnits: okUnits ? parseInt(okUnits, 10) : 0,
        damagedUnits: damagedUnits ? parseInt(damagedUnits, 10) : 0,
        lostUnits: lostUnits ? parseInt(lostUnits, 10) : 0
      });

      let conditionMsg = 'Equipment returned in GOOD condition.';
      if (condition === 'damaged' || damagedUnits > 0) {
        conditionMsg = 'Equipment return recorded with DAMAGED units. Asset inventory updated.';
      } else if (condition === 'lost' || lostUnits > 0) {
        conditionMsg = 'Equipment return recorded with LOST units. Inventory adjusted.';
      }

      req.flash('success_msg', `Return processed successfully for ${request.requestCode}. ${conditionMsg}`);

      // If damaged, redirect to maintenance creation option or request show
      if (condition === 'damaged' || damagedUnits > 0) {
        res.redirect(`/maintenance/create?assetId=${request.asset}&fromReturn=${request._id}`);
      } else {
        res.redirect(`/requests/${request._id}`);
      }
    } catch (err) {
      console.error('[Process Return Error]:', err);
      req.flash('error_msg', 'Failed to process return: ' + err.message);
      res.redirect('back');
    }
  }
}

module.exports = new ReturnController();
