const Asset = require('../models/Asset');

class InventoryService {
  /**
   * Check if an asset has enough available quantity
   */
  async checkAvailability(assetId, requestedQuantity) {
    const asset = await Asset.findOne({ _id: assetId, isDeleted: false });
    if (!asset) {
      return { available: false, message: 'Asset not found or decommissioned.' };
    }

    if (asset.availableQuantity < requestedQuantity) {
      return {
        available: false,
        currentAvailable: asset.availableQuantity,
        message: `Only ${asset.availableQuantity} units available. Cannot fulfill request for ${requestedQuantity} units.`
      };
    }

    return { available: true, asset, currentAvailable: asset.availableQuantity };
  }

  /**
   * Atomically issue asset quantity
   * Prevents race condition over-issuing
   */
  async issueAsset(assetId, quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw new Error('Quantity must be a positive integer');
    }

    // Atomic find and update with condition that availableQuantity >= qty
    const updatedAsset = await Asset.findOneAndUpdate(
      {
        _id: assetId,
        isDeleted: false,
        availableQuantity: { $gte: qty }
      },
      {
        $inc: {
          availableQuantity: -qty,
          issuedQuantity: qty
        }
      },
      { new: true }
    );

    if (!updatedAsset) {
      // Fetch asset to give exact error reason
      const asset = await Asset.findById(assetId);
      if (!asset) {
        throw new Error('Asset not found.');
      }
      throw new Error(
        `Cannot issue ${qty} units. Current available stock is only ${asset.availableQuantity}.`
      );
    }

    // Update intelligent status
    await updatedAsset.save();
    return updatedAsset;
  }

  /**
   * Process asset return with condition grading (OK, Damaged, Lost)
   */
  async returnAsset(assetId, totalReturned, { condition = 'ok', okUnits = 0, damagedUnits = 0, lostUnits = 0 }) {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found.');
    }

    const returnedQty = parseInt(totalReturned, 10);
    if (isNaN(returnedQty) || returnedQty <= 0) {
      throw new Error('Return quantity must be greater than zero.');
    }

    if (returnedQty > asset.issuedQuantity) {
      throw new Error(`Cannot return ${returnedQty} units. Total currently issued is ${asset.issuedQuantity}.`);
    }

    let ok = parseInt(okUnits, 10) || 0;
    let damaged = parseInt(damagedUnits, 10) || 0;
    let lost = parseInt(lostUnits, 10) || 0;

    // If unit breakdown is not manually split, infer from overall condition
    if (ok === 0 && damaged === 0 && lost === 0) {
      if (condition === 'ok') ok = returnedQty;
      else if (condition === 'damaged') damaged = returnedQty;
      else if (condition === 'lost') lost = returnedQty;
      else ok = returnedQty;
    }

    if (ok + damaged + lost !== returnedQty) {
      throw new Error(`Sum of breakdown units (${ok} OK + ${damaged} Damaged + ${lost} Lost) does not match total returned (${returnedQty}).`);
    }

    // Update quantities
    asset.issuedQuantity = Math.max(0, asset.issuedQuantity - returnedQty);
    asset.availableQuantity += ok;
    asset.damagedQuantity += damaged;
    asset.lostQuantity += lost;

    if (lost > 0) {
      // When items are lost, total valid operational quantity reduces
      asset.totalQuantity = Math.max(0, asset.totalQuantity - lost);
    }

    if (damaged > 0 && asset.condition === 'good') {
      asset.condition = 'fair';
    }

    await asset.save();
    return asset;
  }
}

module.exports = new InventoryService();
