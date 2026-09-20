const Asset = require('../models/Asset');
const Category = require('../models/Category');
const Lab = require('../models/Lab');
const IssueRequest = require('../models/IssueRequest');
const MaintenanceLog = require('../models/MaintenanceLog');

class AssetController {
  // Equipment Catalog / List with search, multi-filter & pagination
  async getIndex(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 12;
      const skip = (page - 1) * limit;

      const { q, category, lab, condition, availability, sort } = req.query;

      const query = { isDeleted: false };

      // Search keyword filter
      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        query.$or = [
          { name: regex },
          { assetTag: regex },
          { description: regex },
          { modelNumber: regex },
          { manufacturer: regex }
        ];
      }

      // Filter by Category
      if (category && category !== 'all') {
        query.category = category;
      }

      // Filter by Lab
      if (lab && lab !== 'all') {
        query.lab = lab;
      }

      // Filter by Condition
      if (condition && condition !== 'all') {
        query.condition = condition;
      }

      // Filter by Availability
      if (availability) {
        if (availability === 'in_stock') {
          query.availableQuantity = { $gt: 0 };
        } else if (availability === 'out_of_stock') {
          query.availableQuantity = 0;
        }
      }

      // Sorting
      let sortOption = { createdAt: -1 };
      if (sort === 'name_asc') sortOption = { name: 1 };
      else if (sort === 'name_desc') sortOption = { name: -1 };
      else if (sort === 'qty_desc') sortOption = { availableQuantity: -1 };
      else if (sort === 'tag_asc') sortOption = { assetTag: 1 };

      const [assets, totalCount, categories, labs] = await Promise.all([
        Asset.find(query)
          .populate('category', 'name code icon')
          .populate('lab', 'name code building roomNumber')
          .sort(sortOption)
          .skip(skip)
          .limit(limit),
        Asset.countDocuments(query),
        Category.find({ isActive: true }).sort({ name: 1 }),
        Lab.find({ isActive: true }).sort({ name: 1 })
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      res.render('assets/index', {
        title: 'Equipment & Asset Catalog | LabTrack',
        assets,
        categories,
        labs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          nextPage: page + 1,
          prevPage: page - 1
        },
        filters: { q, category, lab, condition, availability, sort }
      });
    } catch (err) {
      console.error('[Asset Catalog Error]:', err);
      req.flash('error_msg', 'Failed to load equipment catalog: ' + err.message);
      res.redirect('/dashboard');
    }
  }

  // Equipment Detail View
  async getShow(req, res) {
    try {
      const asset = await Asset.findOne({ _id: req.params.id, isDeleted: false })
        .populate('category')
        .populate({
          path: 'lab',
          populate: { path: 'incharge', select: 'name email phone' }
        });

      if (!asset) {
        req.flash('error_msg', 'Equipment record not found.');
        return res.redirect('/assets');
      }

      // Fetch recent issue history and active requests for this asset
      const [activeIssues, requestHistory, maintenanceLogs] = await Promise.all([
        IssueRequest.find({ asset: asset._id, status: 'issued' })
          .populate('requester', 'name email idNumber department')
          .sort({ issueDate: -1 }),
        IssueRequest.find({ asset: asset._id })
          .populate('requester', 'name email idNumber')
          .sort({ createdAt: -1 })
          .limit(10),
        MaintenanceLog.find({ asset: asset._id })
          .populate('createdBy', 'name')
          .sort({ serviceDate: -1 })
      ]);

      res.render('assets/show', {
        title: `${asset.name} (${asset.assetTag}) | LabTrack`,
        asset,
        activeIssues,
        requestHistory,
        maintenanceLogs
      });
    } catch (err) {
      console.error('[Asset Show Error]:', err);
      req.flash('error_msg', 'Error retrieving asset details.');
      res.redirect('/assets');
    }
  }

  // Render Create Asset Form (Admin / Lab In-charge)
  async getCreate(req, res) {
    try {
      const [categories, labs] = await Promise.all([
        Category.find({ isActive: true }).sort({ name: 1 }),
        Lab.find({ isActive: true }).sort({ name: 1 })
      ]);

      res.render('assets/create', {
        title: 'Add New Lab Equipment | LabTrack',
        categories,
        labs
      });
    } catch (err) {
      req.flash('error_msg', 'Unable to load asset creation form.');
      res.redirect('/assets');
    }
  }

  // Handle Create Asset POST
  async postCreate(req, res) {
    try {
      const {
        assetTag,
        name,
        category,
        lab,
        description,
        specifications,
        modelNumber,
        serialNumber,
        manufacturer,
        totalQuantity,
        condition,
        purchaseDate,
        cost
      } = req.body;

      const existingTag = await Asset.findOne({ assetTag: assetTag.toUpperCase().trim() });
      if (existingTag) {
        req.flash('error_msg', `Asset Tag '${assetTag.toUpperCase()}' is already in use.`);
        return res.redirect('back');
      }

      const totalQty = parseInt(totalQuantity, 10);
      const asset = new Asset({
        assetTag: assetTag.toUpperCase().trim(),
        name: name.trim(),
        category,
        lab,
        description: description ? description.trim() : '',
        specifications: specifications ? specifications.trim() : '',
        modelNumber: modelNumber ? modelNumber.trim() : '',
        serialNumber: serialNumber ? serialNumber.trim() : '',
        manufacturer: manufacturer ? manufacturer.trim() : '',
        totalQuantity: totalQty,
        availableQuantity: totalQty, // initially all available
        issuedQuantity: 0,
        damagedQuantity: 0,
        maintenanceQuantity: 0,
        lostQuantity: 0,
        condition: condition || 'good',
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        cost: cost ? parseFloat(cost) : 0
      });

      await asset.save();
      req.flash('success_msg', `Equipment '${asset.name}' (${asset.assetTag}) registered successfully.`);
      res.redirect(`/assets/${asset._id}`);
    } catch (err) {
      console.error('[Asset Create Error]:', err);
      req.flash('error_msg', 'Failed to create asset: ' + err.message);
      res.redirect('back');
    }
  }

  // Render Edit Asset Form
  async getEdit(req, res) {
    try {
      const [asset, categories, labs] = await Promise.all([
        Asset.findOne({ _id: req.params.id, isDeleted: false }),
        Category.find({ isActive: true }).sort({ name: 1 }),
        Lab.find({ isActive: true }).sort({ name: 1 })
      ]);

      if (!asset) {
        req.flash('error_msg', 'Asset not found.');
        return res.redirect('/assets');
      }

      res.render('assets/edit', {
        title: `Edit ${asset.name} | LabTrack`,
        asset,
        categories,
        labs
      });
    } catch (err) {
      req.flash('error_msg', 'Error loading asset edit form.');
      res.redirect('/assets');
    }
  }

  // Handle Edit Asset POST
  async postEdit(req, res) {
    try {
      const {
        name,
        category,
        lab,
        description,
        specifications,
        modelNumber,
        serialNumber,
        manufacturer,
        totalQuantity,
        condition,
        status,
        purchaseDate,
        cost
      } = req.body;

      const asset = await Asset.findOne({ _id: req.params.id, isDeleted: false });
      if (!asset) {
        req.flash('error_msg', 'Asset not found.');
        return res.redirect('/assets');
      }

      const newTotal = parseInt(totalQuantity, 10);
      const activeUsed = asset.issuedQuantity + asset.damagedQuantity + asset.maintenanceQuantity + asset.lostQuantity;

      if (newTotal < activeUsed) {
        req.flash(
          'error_msg',
          `Cannot reduce total quantity to ${newTotal}. At least ${activeUsed} units are currently in use, damaged, under maintenance, or lost.`
        );
        return res.redirect('back');
      }

      // Calculate new available quantity preserving in-use invariant
      asset.totalQuantity = newTotal;
      asset.availableQuantity = newTotal - activeUsed;

      if (name) asset.name = name.trim();
      if (category) asset.category = category;
      if (lab) asset.lab = lab;
      if (description !== undefined) asset.description = description.trim();
      if (specifications !== undefined) asset.specifications = specifications.trim();
      if (modelNumber !== undefined) asset.modelNumber = modelNumber.trim();
      if (serialNumber !== undefined) asset.serialNumber = serialNumber.trim();
      if (manufacturer !== undefined) asset.manufacturer = manufacturer.trim();
      if (condition) asset.condition = condition;
      if (status) asset.status = status;
      if (purchaseDate) asset.purchaseDate = new Date(purchaseDate);
      if (cost !== undefined) asset.cost = parseFloat(cost) || 0;

      await asset.save();
      req.flash('success_msg', `Asset '${asset.name}' updated successfully.`);
      res.redirect(`/assets/${asset._id}`);
    } catch (err) {
      console.error('[Asset Edit Error]:', err);
      req.flash('error_msg', 'Failed to update asset: ' + err.message);
      res.redirect('back');
    }
  }

  // Handle Delete Asset (Protected Soft Deletion)
  async postDelete(req, res) {
    try {
      const asset = await Asset.findById(req.params.id);
      if (!asset) {
        req.flash('error_msg', 'Asset not found.');
        return res.redirect('/assets');
      }

      // Check if any active units are currently issued
      if (asset.issuedQuantity > 0) {
        req.flash(
          'error_msg',
          `Cannot delete '${asset.name}'. ${asset.issuedQuantity} units are currently issued to users. Record returns before deleting.`
        );
        return res.redirect('back');
      }

      // Check if pending requests exist for this asset
      const pendingCount = await IssueRequest.countDocuments({
        asset: asset._id,
        status: { $in: ['pending', 'approved'] }
      });

      if (pendingCount > 0) {
        req.flash(
          'error_msg',
          `Cannot delete '${asset.name}'. There are ${pendingCount} active/pending requests associated with it.`
        );
        return res.redirect('back');
      }

      // Soft delete
      asset.isDeleted = true;
      asset.status = 'decommissioned';
      await asset.save();

      req.flash('success_msg', `Asset '${asset.name}' (${asset.assetTag}) has been deleted.`);
      res.redirect('/assets');
    } catch (err) {
      console.error('[Asset Delete Error]:', err);
      req.flash('error_msg', 'Failed to delete asset: ' + err.message);
      res.redirect('/assets');
    }
  }
}

module.exports = new AssetController();
