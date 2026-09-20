const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset is required'],
      index: true
    },
    serviceDate: {
      type: Date,
      required: [true, 'Service date is required'],
      default: Date.now
    },
    description: {
      type: String,
      required: [true, 'Description of maintenance is required'],
      trim: true
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    },
    technicianVendor: {
      type: String,
      required: [true, 'Technician or Vendor name is required'],
      trim: true
    },
    nextServiceDue: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    completedDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
