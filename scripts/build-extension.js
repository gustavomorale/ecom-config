// Copies runtime assets from src/ into the theme app extension's assets/ folder.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'shopify-app/extensions/bundle-configurator/assets');
fs.mkdirSync(out, { recursive: true });
const cp = (from, to) => fs.copyFileSync(path.join(root, from), path.join(out, to));
cp('src/configurator.js', 'configurator.js');
cp('src/theme-inherit.js', 'theme-inherit.js');
cp('src/configurator.css', 'configurator.css');
cp('src/themes/glass.css', 'glass.css');
fs.writeFileSync(path.join(out, 'scenes.js'),
  ['src/scenes/summary.js', 'src/scenes/house.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join('\n'));
console.log('extension assets written to', out);

// The admin previews the real widget, so it gets the same files under /widget/.
const pub = path.join(root, 'shopify-app/public/widget');
fs.mkdirSync(pub, { recursive: true });
for (const f of fs.readdirSync(out)) fs.copyFileSync(path.join(out, f), path.join(pub, f));
console.log('admin preview assets written to', pub);
