const mongoose = require('mongoose');

// Middleware to validate Mongo ObjectId in URL params
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      req.flash('error_msg', `Invalid ID format provided.`);
      return res.redirect('back');
    }
    next();
  };
};

// Validate request creation input
const validateIssueRequest = (req, res, next) => {
  const { assetId, requestedQuantity, purpose, expectedReturnDate } = req.body;
  const errors = [];

  if (!assetId || !mongoose.Types.ObjectId.isValid(assetId)) {
    errors.push('Please select a valid equipment item.');
  }

  const qty = parseInt(requestedQuantity, 10);
  if (isNaN(qty) || qty <= 0) {
    errors.push('Requested quantity must be a positive integer greater than zero.');
  }

  if (!purpose || purpose.trim().length === 0) {
    errors.push('Purpose for request is required.');
  } else if (purpose.trim().length > 500) {
    errors.push('Purpose cannot exceed 500 characters.');
  }

  if (!expectedReturnDate) {
    errors.push('Expected return date is required.');
  } else {
    const returnDate = new Date(expectedReturnDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(returnDate.getTime())) {
      errors.push('Invalid return date format.');
    } else if (returnDate < today) {
      errors.push('Expected return date must be today or in the future.');
    }
  }

  if (errors.length > 0) {
    req.flash('error_msg', errors.join(' '));
    return res.redirect('back');
  }

  next();
};

// Validate Asset creation/edit input
const validateAssetInput = (req, res, next) => {
  const { assetTag, name, category, lab, totalQuantity, condition } = req.body;
  const errors = [];

  if (!assetTag || assetTag.trim().length === 0) {
    errors.push('Asset Tag is required.');
  }
  if (!name || name.trim().length === 0) {
    errors.push('Equipment Name is required.');
  }
  if (!category || !mongoose.Types.ObjectId.isValid(category)) {
    errors.push('Please select a valid Category.');
  }
  if (!lab || !mongoose.Types.ObjectId.isValid(lab)) {
    errors.push('Please select a valid Lab.');
  }

  const total = parseInt(totalQuantity, 10);
  if (isNaN(total) || total < 0) {
    errors.push('Total quantity must be a non-negative number.');
  }

  const validConditions = ['good', 'fair', 'damaged', 'under_maintenance', 'lost'];
  if (condition && !validConditions.includes(condition)) {
    errors.push('Invalid condition specified.');
  }

  if (errors.length > 0) {
    req.flash('error_msg', errors.join(' '));
    return res.redirect('back');
  }

  next();
};

module.exports = {
  validateObjectId,
  validateIssueRequest,
  validateAssetInput
};
