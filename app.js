const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const methodOverride = require('method-override');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');

const { setLocals } = require('./middleware/auth');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');

// Route imports
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const requestRoutes = require('./routes/requestRoutes');
const returnRoutes = require('./routes/returnRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Enable trust proxy for Render / Reverse Proxy HTTPS Secure Cookies
if (process.env.NODE_ENV === 'production' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1);
}

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
          'https://unpkg.com'
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
          'https://cdn.jsdelivr.net',
          'https://unpkg.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// HTTP Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Method Override for PUT & DELETE support via HTML forms
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View Engine Setup (EJS)
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session Configuration with MongoStore
const mongoUrl = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lab_asset_management';
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'labtrack_default_secret_key_change_in_prod',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl,
      collectionName: 'sessions',
      ttl: 24 * 60 * 60 // 1 day
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  })
);

// Connect Flash messages
app.use(flash());

// Global template variables middleware
app.use(setLocals);

// Route Declarations
app.use('/auth', authRoutes);
app.use('/assets', assetRoutes);
app.use('/requests', requestRoutes);
app.use('/returns', returnRoutes);
app.use('/maintenance', maintenanceRoutes);
app.use('/admin', adminRoutes);
app.use('/reports', reportRoutes);
app.use('/', indexRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
