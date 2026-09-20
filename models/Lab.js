const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lab name is required'],
      trim: true,
      maxlength: [120, 'Lab name cannot exceed 120 characters']
    },
    code: {
      type: String,
      required: [true, 'Lab code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true
    },
    floor: {
      type: String,
      trim: true,
      default: 'Ground Floor'
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    incharge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Lab', labSchema);
