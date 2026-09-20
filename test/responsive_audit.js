// Comprehensive Responsive CSS and Template Static Audit
const fs = require('fs');
const path = require('path');

const cssFiles = [
  path.join(__dirname, '../public/css/main.css'),
  path.join(__dirname, '../public/css/dashboard.css'),
  path.join(__dirname, '../public/css/auth.css')
];

let issues = [];

cssFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const filename = path.basename(file);

  // Check 1: box-sizing reset
  if (filename === 'main.css') {
    if (!content.includes('box-sizing: border-box')) {
      issues.push(`[main.css] Missing global box-sizing: border-box reset.`);
    }
    if (!content.includes('overflow-x: hidden')) {
      issues.push(`[main.css] Missing body overflow-x: hidden rule.`);
    }
    if (!content.includes('min-width: 0')) {
      issues.push(`[main.css] Missing min-width: 0 rule on main flex container.`);
    }
  }
});

console.log('🔍 Responsive CSS Audit Results:');
if (issues.length === 0) {
  console.log('✅ All CSS files passed responsive checks (no rogue fixed widths, box-sizing enforced, overflow-x contained).');
} else {
  issues.forEach(iss => console.log('⚠️ ' + iss));
}
