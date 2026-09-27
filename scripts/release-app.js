// Stamps a new app version everywhere it appears, commits and tags it.
//   npm run release:app -- 0.9.5
// Updates: the version shown in the app (shopify-app/app/components/SetupRail.jsx, VERSION,
// used by the overview's header, plan and help cards), CLAUDE.md ("app X") and LISTING.md
// ("version X"). Then runs the syntax check, commits "Release app X" and creates the
// annotated tag app-X. It does not push: `git push origin main` deploys (Netlify builds
// every push to main). The engine keeps its own version (package.json, 1.x).
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const root = path.join(__dirname, '..');
const run = (cmd) => execSync(cmd, { cwd: root, stdio: 'pipe' }).toString().trim();
const fail = (msg) => { console.error('release:app: ' + msg); process.exit(1); };

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) fail('give a version like 0.9.5');
if (run('git branch --show-current') !== 'main') fail('release from main (the reviewed, live branch)');
if (run('git status --porcelain')) fail('commit or stash your changes first');
if (run('git tag -l app-' + version)) fail('tag app-' + version + ' already exists');

const edits = [
  ['shopify-app/app/components/SetupRail.jsx', /export const VERSION = "[^"]*";/, `export const VERSION = "${version}";`],
  ['CLAUDE.md', /(Current version: engine v[\d.]+, app )[\d.]+(\.)/, `$1${version}$2`],
  ['shopify-app/LISTING.md', /\(version [\d.]+\)/, `(version ${version})`],
];
for (const [file, re, to] of edits) {
  const p = path.join(root, file), s = fs.readFileSync(p, 'utf8');
  if (!re.test(s)) fail(`could not find the version in ${file}`);
  fs.writeFileSync(p, s.replace(re, to));
  console.log('updated', file);
}

run('npm run check');
run('git add -A');
run(`git commit -q -m "Release app ${version}"`);
run(`git tag -a app-${version} -m "App ${version}"`);
console.log(`committed and tagged app-${version}. Deploy with: git push origin main`);
