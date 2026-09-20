const User = require('../models/User');

class AuthController {
  // Render login page
  getLogin(req, res) {
    res.render('auth/login', {
      title: 'Sign In | Lab Asset Management System',
      layout: 'layouts/auth',
      returnTo: req.query.returnTo || ''
    });
  }

  // Handle login POST
  async postLogin(req, res) {
    try {
      const { email, password, returnTo } = req.body;

      if (!email || !password) {
        req.flash('error_msg', 'Please enter both email and password.');
        return res.redirect('/auth/login');
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        req.flash('error_msg', 'Invalid email or password.');
        return res.redirect('/auth/login');
      }

      if (!user.isActive) {
        req.flash('error_msg', 'Your account has been deactivated. Please contact the administrator.');
        return res.redirect('/auth/login');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        req.flash('error_msg', 'Invalid email or password.');
        return res.redirect('/auth/login');
      }

      // Set session variables
      req.session.userId = user._id;
      req.session.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        department: user.department
      };

      req.flash('success_msg', `Welcome back, ${user.name}!`);

      const destination = returnTo && returnTo.startsWith('/') ? returnTo : '/dashboard';
      return res.redirect(destination);
    } catch (err) {
      console.error('[Login Error]:', err);
      req.flash('error_msg', 'An error occurred during sign in. Please try again.');
      return res.redirect('/auth/login');
    }
  }

  // Render register page
  getRegister(req, res) {
    res.render('auth/register', {
      title: 'Create Account | Lab Asset Management System',
      layout: 'layouts/auth'
    });
  }

  // Handle register POST
  async postRegister(req, res) {
    try {
      const { name, email, password, confirmPassword, userType, department, idNumber, phone } = req.body;

      // Validation
      if (!name || !email || !password || !confirmPassword) {
        req.flash('error_msg', 'Please fill in all required fields.');
        return res.redirect('/auth/register');
      }

      if (password.length < 6) {
        req.flash('error_msg', 'Password must be at least 6 characters long.');
        return res.redirect('/auth/register');
      }

      if (password !== confirmPassword) {
        req.flash('error_msg', 'Passwords do not match. Please verify.');
        return res.redirect('/auth/register');
      }

      // Restrict public registration to student or staff only
      const validRoles = ['student', 'staff'];
      const assignedRole = validRoles.includes(userType) ? userType : 'student';

      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        req.flash('error_msg', 'An account with this email address already exists.');
        return res.redirect('/auth/register');
      }

      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        role: assignedRole,
        userType: assignedRole,
        department: department ? department.trim() : 'General',
        idNumber: idNumber ? idNumber.trim() : '',
        phone: phone ? phone.trim() : '',
        isActive: true
      });

      await newUser.save();

      // Automatically log the new user in
      req.session.userId = newUser._id;
      req.session.user = {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        userType: newUser.userType,
        department: newUser.department
      };

      req.flash('success_msg', 'Account registered successfully! Welcome to LabTrack.');
      return res.redirect('/dashboard');
    } catch (err) {
      console.error('[Register Error]:', err);
      req.flash('error_msg', 'Registration failed: ' + (err.message || 'Please try again.'));
      return res.redirect('/auth/register');
    }
  }

  // Handle logout
  getLogout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('[Logout Error]:', err);
      }
      res.clearCookie('connect.sid');
      res.redirect('/auth/login?info=' + encodeURIComponent('You have been logged out successfully.'));
    });
  }

  // Profile view
  async getProfile(req, res) {
    const user = await User.findById(req.user._id).populate('assignedLabs');
    res.render('auth/profile', {
      title: 'My Profile | LabTrack',
      profileUser: user
    });
  }

  // Update profile
  async postProfile(req, res) {
    try {
      const { name, department, phone, idNumber } = req.body;
      const user = await User.findById(req.user._id);
      if (!user) {
        req.flash('error_msg', 'User not found.');
        return res.redirect('/auth/profile');
      }

      if (name) user.name = name.trim();
      if (department) user.department = department.trim();
      if (phone !== undefined) user.phone = phone.trim();
      if (idNumber !== undefined) user.idNumber = idNumber.trim();

      await user.save();

      // Update session user cache
      req.session.user.name = user.name;
      req.session.user.department = user.department;

      req.flash('success_msg', 'Profile updated successfully.');
      return res.redirect('/auth/profile');
    } catch (err) {
      req.flash('error_msg', 'Failed to update profile: ' + err.message);
      return res.redirect('/auth/profile');
    }
  }
}

module.exports = new AuthController();
