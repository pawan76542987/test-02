const IssueRequest = require('../models/IssueRequest');
const Asset = require('../models/Asset');
const inventoryService = require('./inventoryService');

class RequestService {
  /**
   * Generate next sequential request code
   */
  async generateRequestCode() {
    const year = new Date().getFullYear();
    const count = await IssueRequest.countDocuments();
    const sequence = String(count + 1).padStart(4, '0');
    return `REQ-${year}-${sequence}`;
  }

  /**
   * Submit a new Issue Request
   */
  async createRequest({ requesterId, assetId, requestedQuantity, purpose, expectedReturnDate }) {
    const asset = await Asset.findOne({ _id: assetId, isDeleted: false });
    if (!asset) {
      throw new Error('Equipment not found or is no longer active.');
    }

    const qty = parseInt(requestedQuantity, 10);
    if (qty > asset.availableQuantity) {
      throw new Error(
        `Requested quantity (${qty}) exceeds currently available stock (${asset.availableQuantity}).`
      );
    }

    const requestCode = await this.generateRequestCode();

    const request = new IssueRequest({
      requestCode,
      requester: requesterId,
      asset: asset._id,
      lab: asset.lab,
      requestedQuantity: qty,
      purpose,
      expectedReturnDate: new Date(expectedReturnDate),
      status: 'pending'
    });

    await request.save();
    return request;
  }

  /**
   * Approve a pending request
   */
  async approveRequest(requestId, reviewerId, approvalNotes = '') {
    const request = await IssueRequest.findById(requestId).populate('asset');
    if (!request) {
      throw new Error('Request not found.');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot approve a request with status '${request.status}'.`);
    }

    // Verify current availability
    if (request.asset.availableQuantity < request.requestedQuantity) {
      throw new Error(
        `Cannot approve request. Available stock (${request.asset.availableQuantity}) is less than requested quantity (${request.requestedQuantity}).`
      );
    }

    request.status = 'approved';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.approvalNotes = approvalNotes;

    await request.save();
    return request;
  }

  /**
   * Reject a pending request
   */
  async rejectRequest(requestId, reviewerId, rejectionReason) {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new Error('Rejection reason is required.');
    }

    const request = await IssueRequest.findById(requestId);
    if (!request) {
      throw new Error('Request not found.');
    }

    if (request.status !== 'pending') {
      throw new Error(`Cannot reject a request with status '${request.status}'.`);
    }

    request.status = 'rejected';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date();
    request.rejectionReason = rejectionReason.trim();

    await request.save();
    return request;
  }

  /**
   * Issue equipment for an approved request
   */
  async issueEquipment(requestId, issuerId, issueNotes = '') {
    const request = await IssueRequest.findById(requestId);
    if (!request) {
      throw new Error('Request not found.');
    }

    if (request.status !== 'approved') {
      throw new Error(`Cannot issue equipment. Request status must be 'approved' (current status: '${request.status}').`);
    }

    // Atomically decrement available quantity and increment issued quantity
    await inventoryService.issueAsset(request.asset, request.requestedQuantity);

    request.status = 'issued';
    request.issuedBy = issuerId;
    request.issueDate = new Date();
    request.issueNotes = issueNotes;

    await request.save();
    return request;
  }

  /**
   * Record equipment return
   */
  async recordReturn(requestId, receiverId, { condition = 'ok', returnNotes = '', okUnits = 0, damagedUnits = 0, lostUnits = 0 }) {
    const request = await IssueRequest.findById(requestId);
    if (!request) {
      throw new Error('Request not found.');
    }

    if (request.status !== 'issued') {
      throw new Error(`Cannot return equipment. Request is currently '${request.status}', expected 'issued'.`);
    }

    const totalUnits = request.requestedQuantity;
    let ok = parseInt(okUnits, 10) || 0;
    let damaged = parseInt(damagedUnits, 10) || 0;
    let lost = parseInt(lostUnits, 10) || 0;

    if (ok === 0 && damaged === 0 && lost === 0) {
      if (condition === 'ok') ok = totalUnits;
      else if (condition === 'damaged') damaged = totalUnits;
      else if (condition === 'lost') lost = totalUnits;
      else ok = totalUnits;
    }

    // Process inventory return
    await inventoryService.returnAsset(request.asset, totalUnits, {
      condition,
      okUnits: ok,
      damagedUnits: damaged,
      lostUnits: lost
    });

    request.status = 'returned';
    request.returnedQuantity = totalUnits;
    request.actualReturnDate = new Date();
    request.receivedBy = receiverId;
    request.returnCondition = condition;
    request.damagedUnits = damaged;
    request.lostUnits = lost;
    request.returnNotes = returnNotes;

    await request.save();
    return request;
  }

  /**
   * Cancel a request
   */
  async cancelRequest(requestId, user) {
    const request = await IssueRequest.findById(requestId);
    if (!request) {
      throw new Error('Request not found.');
    }

    // Only pending or approved requests can be cancelled
    if (!['pending', 'approved'].includes(request.status)) {
      throw new Error(`Cannot cancel a request that is already '${request.status}'.`);
    }

    // Requesters can only cancel their own requests
    if (user.role !== 'admin' && user.role !== 'lab_incharge') {
      if (request.requester.toString() !== user._id.toString()) {
        throw new Error('You can only cancel your own requests.');
      }
    }

    request.status = 'cancelled';
    await request.save();
    return request;
  }
}

module.exports = new RequestService();
