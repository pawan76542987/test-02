const User = require('../models/User');
const Category = require('../models/Category');
const Lab = require('../models/Lab');
const Asset = require('../models/Asset');
const IssueRequest = require('../models/IssueRequest');

class AdminController {
  // ===================== USER MANAGEMENT =====================

  // List all users
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip = (page - 1) * limit;

      const { role, q, status } = req.query;
      const query = {};

      if (role && role !== 'all') {
        query.role = role;
      }

      if (status && status !== 'all') {
        query.isActive = status === 'active';
      }

      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        query.$or = [
          { name: regex },
          { email: regex },
          { idNumber: regex },
          { department: regex }
        ];
      }

      const [users, totalCount] = await Promise.all([
        User.find(query)
          .populate('assignedLabs', 'name code')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        User.countDocuments(query)
      ]);

      const totalPages = Math.ceil(totalCount / limit) || 1;

      res.render('admin/users/index', {
        title: 'User Management | LabTrack',
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
          nextPage: page + 1,
          prevPage: page - 1
        },
        filters: { role, q, status }
      });
    } catch (err) {
      console.error('[Admin Users Error]:', err);
      req.flash('error_msg', 'Failed to load user management: ' + err.message);
      res.redirect('/dashboard');
    }
  }

  // Render Create Privileged User Form
  async getCreateUser(req, res) {
    try {
      const labs = await Lab.find({ isActive: true }).sort({ name: 1 });
      res.render('admin/users/create', {
        title: 'Create Staff / In-charge Account | LabTrack',
        labs
      });
    } catch (err) {
      req.flash('error_msg', 'Error loading user creation form.');
      res.redirect('/admin/users');
    }
  }

  // Handle Create User POST
  async postCreateUser(req, res) {
    try {
      const { name, email, password, role, userType, department, idNumber, phone, assignedLabs } = req.body;

      if (!name || !email || !password || !role) {
        req.flash('error_msg', 'Name, email, password and role are required.');
        return res.redirect('back');
      }

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        req.flash('error_msg', `A user with email '${email}' already exists.`);
        return res.redirect('back');
      }

      const user = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role,
        userType: userType || (role === 'admin' ? 'admin' : role === 'lab_incharge' ? 'lab_staff' : 'staff'),
        department: department ? department.trim() : 'Laboratory Management',
        idNumber: idNumber ? idNumber.trim() : '',
        phone: phone ? phone.trim() : '',
        assignedLabs: assignedLabs ? (Array.isArray(assignedLabs) ? assignedLabs : [assignedLabs]) : [],
        isActive: true
      });

      await user.save();

      // If assigned labs were chosen for lab_incharge, update the Lab records
      if (role === 'lab_incharge' && user.assignedLabs.length > 0) {
        await Lab.updateMany(
          { _id: { $in: user.assignedLabs } },
          { incharge: user._id }
        );
      }

      req.flash('success_msg', `User account for '${user.name}' (${user.role}) created successfully.`);
      res.redirect('/admin/users');
    } catch (err) {
      console.error('[Create User Error]:', err);
      req.flash('error_msg', 'Failed to create user: ' + err.message);
      res.redirect('back');
    }
  }

  // Toggle user active status
  async postToggleUserStatus(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        req.flash('error_msg', 'User not found.');
        return res.redirect('/admin/users');
      }

      // Prevent deactivating own account
      if (user._id.toString() === req.user._id.toString()) {
        req.flash('error_msg', 'You cannot deactivate your own administrative account.');
        return res.redirect('/admin/users');
      }

      user.isActive = !user.isActive;
      await user.save();

      req.flash(
        'success_msg',
        `User '${user.name}' is now ${user.isActive ? 'ACTIVATED' : 'DEACTIVATED'}.`
      );
      res.redirect('/admin/users');
    } catch (err) {
      console.error('[Toggle User Error]:', err);
      req.flash('error_msg', 'Failed to update user status.');
      res.redirect('/admin/users');
    }
  }

  // View user activity and history
  async getUserHistory(req, res) {
    try {
      const user = await User.findById(req.params.id).populate('assignedLabs');
      if (!user) {
        req.flash('error_msg', 'User not found.');
        return res.redirect('/admin/users');
      }

      const requests = await IssueRequest.find({ requester: user._id })
        .populate('asset')
        .populate('lab')
        .sort({ createdAt: -1 });

      res.render('admin/users/history', {
        title: `Activity History: ${user.name} | LabTrack`,
        targetUser: user,
        requests
      });
    } catch (err) {
      req.flash('error_msg', 'Error retrieving user history.');
      res.redirect('/admin/users');
    }
  }

  // ===================== CATEGORY MANAGEMENT =====================

  // List all categories
  async getCategories(req, res) {
    try {
      const categories = await Category.find().sort({ name: 1 });

      // Count assets per category
      const assetCounts = await Asset.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$category', count: { $sum: 1 }, units: { $sum: '$totalQuantity' } } }
      ]);

      const countMap = {};
      assetCounts.forEach(c => {
        if (c._id) countMap[c._id.toString()] = { count: c.count, units: c.units };
      });

      res.render('admin/categories/index', {
        title: 'Equipment Categories | LabTrack',
        categories,
        countMap
      });
    } catch (err) {
      console.error('[Category Error]:', err);
      req.flash('error_msg', 'Failed to load categories.');
      res.redirect('/dashboard');
    }
  }

  // Create Category POST
  async postCreateCategory(req, res) {
    try {
      const { name, code, description, icon } = req.body;

      if (!name || !code) {
        req.flash('error_msg', 'Category Name and Code are required.');
        return res.redirect('/admin/categories');
      }

      const existing = await Category.findOne({
        $or: [{ name: name.trim() }, { code: code.toUpperCase().trim() }]
      });

      if (existing) {
        req.flash('error_msg', 'A category with this Name or Code already exists.');
        return res.redirect('/admin/categories');
      }

      const category = new Category({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        description: description ? description.trim() : '',
        icon: icon || 'box'
      });

      await category.save();
      req.flash('success_msg', `Category '${category.name}' created successfully.`);
      res.redirect('/admin/categories');
    } catch (err) {
      req.flash('error_msg', 'Failed to create category: ' + err.message);
      res.redirect('/admin/categories');
    }
  }

  // Edit Category POST
  async postEditCategory(req, res) {
    try {
      const { name, description, icon, isActive } = req.body;
      const category = await Category.findById(req.params.id);
      if (!category) {
        req.flash('error_msg', 'Category not found.');
        return res.redirect('/admin/categories');
      }

      if (name) category.name = name.trim();
      if (description !== undefined) category.description = description.trim();
      if (icon) category.icon = icon;
      category.isActive = isActive === 'on' || isActive === 'true';

      await category.save();
      req.flash('success_msg', `Category '${category.name}' updated successfully.`);
      res.redirect('/admin/categories');
    } catch (err) {
      req.flash('error_msg', 'Failed to update category: ' + err.message);
      res.redirect('/admin/categories');
    }
  }

  // Delete Category (Safeguarded against active assets)
  async postDeleteCategory(req, res) {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        req.flash('error_msg', 'Category not found.');
        return res.redirect('/admin/categories');
      }

      // Check if any non-deleted assets are linked
      const assetCount = await Asset.countDocuments({ category: category._id, isDeleted: false });
      if (assetCount > 0) {
        req.flash(
          'error_msg',
          `Cannot delete '${category.name}'. There are ${assetCount} active equipment assets assigned to this category.`
        );
        return res.redirect('/admin/categories');
      }

      await Category.findByIdAndDelete(category._id);
      req.flash('success_msg', `Category '${category.name}' removed successfully.`);
      res.redirect('/admin/categories');
    } catch (err) {
      req.flash('error_msg', 'Failed to delete category.');
      res.redirect('/admin/categories');
    }
  }

  // ===================== LAB MANAGEMENT =====================

  // List all labs
  async getLabs(req, res) {
    try {
      const [labs, inchargeUsers] = await Promise.all([
        Lab.find().populate('incharge', 'name email phone').sort({ name: 1 }),
        User.find({ role: { $in: ['lab_incharge', 'admin'] }, isActive: true }).sort({ name: 1 })
      ]);

      // Count assets per lab
      const assetCounts = await Asset.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: '$lab',
            count: { $sum: 1 },
            units: { $sum: '$totalQuantity' },
            issued: { $sum: '$issuedQuantity' }
          }
        }
      ]);

      const countMap = {};
      assetCounts.forEach(l => {
        if (l._id) countMap[l._id.toString()] = { count: l.count, units: l.units, issued: l.issued };
      });

      res.render('admin/labs/index', {
        title: 'Laboratories & Locations | LabTrack',
        labs,
        inchargeUsers,
        countMap
      });
    } catch (err) {
      console.error('[Labs Error]:', err);
      req.flash('error_msg', 'Failed to load labs.');
      res.redirect('/dashboard');
    }
  }

  // Create Lab POST
  async postCreateLab(req, res) {
    try {
      const { name, code, building, floor, roomNumber, description, incharge } = req.body;

      if (!name || !code || !building || !roomNumber) {
        req.flash('error_msg', 'Name, code, building and room number are required.');
        return res.redirect('/admin/labs');
      }

      const existing = await Lab.findOne({ code: code.toUpperCase().trim() });
      if (existing) {
        req.flash('error_msg', `A lab with code '${code.toUpperCase()}' already exists.`);
        return res.redirect('/admin/labs');
      }

      const lab = new Lab({
        name: name.trim(),
        code: code.toUpperCase().trim(),
        building: building.trim(),
        floor: floor ? floor.trim() : 'Ground Floor',
        roomNumber: roomNumber.trim(),
        description: description ? description.trim() : '',
        incharge: incharge || null
      });

      await lab.save();

      // If incharge selected, update incharge assignedLabs
      if (incharge) {
        await User.findByIdAndUpdate(incharge, { $addToSet: { assignedLabs: lab._id } });
      }

      req.flash('success_msg', `Laboratory '${lab.name}' (${lab.code}) registered successfully.`);
      res.redirect('/admin/labs');
    } catch (err) {
      req.flash('error_msg', 'Failed to create lab: ' + err.message);
      res.redirect('/admin/labs');
    }
  }

  // Edit Lab POST
  async postEditLab(req, res) {
    try {
      const { name, building, floor, roomNumber, description, incharge, isActive } = req.body;
      const lab = await Lab.findById(req.params.id);
      if (!lab) {
        req.flash('error_msg', 'Lab not found.');
        return res.redirect('/admin/labs');
      }

      const previousIncharge = lab.incharge;

      if (name) lab.name = name.trim();
      if (building) lab.building = building.trim();
      if (floor) lab.floor = floor.trim();
      if (roomNumber) lab.roomNumber = roomNumber.trim();
      if (description !== undefined) lab.description = description.trim();
      lab.incharge = incharge || null;
      lab.isActive = isActive === 'on' || isActive === 'true';

      await lab.save();

      // Update incharge references
      if (previousIncharge && previousIncharge.toString() !== incharge) {
        await User.findByIdAndUpdate(previousIncharge, { $pull: { assignedLabs: lab._id } });
      }
      if (incharge) {
        await User.findByIdAndUpdate(incharge, { $addToSet: { assignedLabs: lab._id } });
      }

      req.flash('success_msg', `Lab '${lab.name}' updated successfully.`);
      res.redirect('/admin/labs');
    } catch (err) {
      req.flash('error_msg', 'Failed to update lab: ' + err.message);
      res.redirect('/admin/labs');
    }
  }

  // Delete Lab (Safeguarded against active assets)
  async postDeleteLab(req, res) {
    try {
      const lab = await Lab.findById(req.params.id);
      if (!lab) {
        req.flash('error_msg', 'Lab not found.');
        return res.redirect('/admin/labs');
      }

      // Check if any non-deleted assets are linked
      const assetCount = await Asset.countDocuments({ lab: lab._id, isDeleted: false });
      if (assetCount > 0) {
        req.flash(
          'error_msg',
          `Cannot delete '${lab.name}'. There are ${assetCount} active equipment assets assigned to this laboratory.`
        );
        return res.redirect('/admin/labs');
      }

      await Lab.findByIdAndDelete(lab._id);
      await User.updateMany({ assignedLabs: lab._id }, { $pull: { assignedLabs: lab._id } });

      req.flash('success_msg', `Laboratory '${lab.name}' removed successfully.`);
      res.redirect('/admin/labs');
    } catch (err) {
      req.flash('error_msg', 'Failed to delete laboratory.');
      res.redirect('/admin/labs');
    }
  }
}

module.exports = new AdminController();
