// Rebuilds demo/bundle-configurator.mvp.html from demo/index.html and the files it loads,
// inlining each one in load order behind a /* === path === */ marker. The single file is
// what gets shared, so run this whenever the runtime, a config or the harness changes.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const demo = path.join(root, 'demo'), out = path.join(demo, 'bundle-configurator.mvp.html');
const idx = fs.readFileSync(path.join(demo, 'index.html'), 'utf8');
const head = fs.readFileSync(out, 'utf8').split('\n')[0];             // keep the fixed head line
const read = h => fs.readFileSync(path.join(demo, h), 'utf8').replace(/\s+$/, '');
const mark = h => '/* === ' + path.relative(root, path.join(demo, h)) + ' === */';
const css = [...idx.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => mark(m[1]) + '\n' + read(m[1]));
const js = [...idx.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => mark(m[1]) + '\n' + read(m[1]));
const body = idx.slice(idx.indexOf('<body>') + 6, idx.indexOf('<script src=')).replace(/^\s+/, '');
const title = idx.match(/<title>.*<\/title>/)[0];
fs.writeFileSync(out, head + '\n' + title + '\n<style>\n' + css.join('\n\n') + '\n</style>\n' + body + '<script>\n' + js.join('\n\n') + '\n</script>\n</body></html>\n');
console.log('wrote', path.relative(root, out), fs.statSync(out).size, 'bytes,', css.length, 'css +', js.length, 'js files');
