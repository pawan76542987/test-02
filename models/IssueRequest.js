const mongoose = require('mongoose');

const issueRequestSchema = new mongoose.Schema(
  {
    requestCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
      index: true
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
      index: true
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: [true, 'Lab is required'],
      index: true
    },
    requestedQuantity: {
      type: Number,
      required: [true, 'Requested quantity is required'],
      min: [1, 'Requested quantity must be at least 1']
    },
    purpose: {
      type: String,
      required: [true, 'Purpose for request is required'],
      trim: true,
      maxlength: [500, 'Purpose cannot exceed 500 characters']
    },
    expectedReturnDate: {
      type: Date,
      required: [true, 'Expected return date is required'],
      index: true
    },
    requestDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'issued', 'returned', 'cancelled'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    approvalNotes: {
      type: String,
      trim: true,
      default: ''
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    issueDate: {
      type: Date,
      default: null
    },
    issueNotes: {
      type: String,
      trim: true,
      default: ''
    },
    returnedQuantity: {
      type: Number,
      default: 0
    },
    actualReturnDate: {
      type: Date,
      default: null
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    returnCondition: {
      type: String,
      enum: ['ok', 'damaged', 'lost', null],
      default: null
    },
    damagedUnits: {
      type: Number,
      default: 0
    },
    lostUnits: {
      type: Number,
      default: 0
    },
    returnNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for dynamic overdue calculation
issueRequestSchema.virtual('isOverdue').get(function () {
  if (this.status === 'issued' && this.expectedReturnDate) {
    return new Date() > new Date(this.expectedReturnDate);
  }
  return false;
});

// Virtual for days overdue
issueRequestSchema.virtual('daysOverdue').get(function () {
  if (this.status === 'issued' && this.expectedReturnDate) {
    const diffTime = new Date() - new Date(this.expectedReturnDate);
    if (diffTime > 0) {
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
  return 0;
});

module.exports = mongoose.model('IssueRequest', issueRequestSchema);
