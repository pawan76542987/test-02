const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    assetTag: {
      type: String,
      required: [true, 'Asset tag is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true
    },
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: [true, 'Lab location is required'],
      index: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    specifications: {
      type: String,
      trim: true,
      default: ''
    },
    modelNumber: {
      type: String,
      trim: true,
      default: ''
    },
    serialNumber: {
      type: String,
      trim: true,
      default: ''
    },
    manufacturer: {
      type: String,
      trim: true,
      default: ''
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Total quantity cannot be negative']
    },
    availableQuantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Available quantity cannot be negative']
    },
    issuedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Issued quantity cannot be negative']
    },
    damagedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Damaged quantity cannot be negative']
    },
    maintenanceQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Maintenance quantity cannot be negative']
    },
    lostQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Lost quantity cannot be negative']
    },
    condition: {
      type: String,
      enum: ['good', 'fair', 'damaged', 'under_maintenance', 'lost'],
      default: 'good'
    },
    status: {
      type: String,
      enum: [
        'available',
        'in_use',
        'partially_available',
        'out_of_stock',
        'under_maintenance',
        'decommissioned'
      ],
      default: 'available',
      index: true
    },
    purchaseDate: {
      type: Date,
      default: null
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Auto-derive status before saving if not decommissioned
assetSchema.pre('save', function (next) {
  if (this.status !== 'decommissioned') {
    if (this.totalQuantity === 0) {
      this.status = 'out_of_stock';
    } else if (this.availableQuantity === 0 && this.issuedQuantity > 0) {
      this.status = 'in_use';
    } else if (this.availableQuantity === 0 && (this.damagedQuantity > 0 || this.maintenanceQuantity > 0)) {
      this.status = 'under_maintenance';
    } else if (this.availableQuantity > 0 && this.issuedQuantity > 0) {
      this.status = 'partially_available';
    } else if (this.availableQuantity === this.totalQuantity) {
      this.status = 'available';
    } else {
      this.status = 'available';
    }
  }
  next();
});

module.exports = mongoose.model('Asset', assetSchema);
