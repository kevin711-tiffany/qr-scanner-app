import fs from 'node:fs';

const level = process.argv[2] ?? 'patch';
if (!['patch', 'minor', 'major'].includes(level)) {
  console.error('Usage: node scripts/bump-version.mjs [patch|minor|major]');
  process.exit(1);
}

const readJson = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const writeJson = (path, value) => fs.writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);

const pkg = readJson('package.json');
const app = readJson('app.json');
const current = pkg.version.split('.').map(Number);
if (current.length !== 3 || current.some(Number.isNaN)) throw new Error(`Invalid version: ${pkg.version}`);

let [major, minor, patch] = current;
if (level === 'major') [major, minor, patch] = [major + 1, 0, 0];
if (level === 'minor') [major, minor, patch] = [major, minor + 1, 0];
if (level === 'patch') patch += 1;

const version = `${major}.${minor}.${patch}`;
const nativeBuild = Number(app.expo.android.versionCode ?? 0) + 1;
const releaseDate = new Date().toISOString().slice(0, 10);

pkg.version = version;
app.expo.version = version;
app.expo.android.versionCode = nativeBuild;
app.expo.ios.buildNumber = String(nativeBuild);

writeJson('package.json', pkg);
writeJson('app.json', app);

const versionInfoPath = 'constants/version-info.ts';
if (fs.existsSync(versionInfoPath)) {
  let source = fs.readFileSync(versionInfoPath, 'utf8');
  source = source
    .replace(/version: '[^']+'/, `version: '${version}'`)
    .replace(/releaseDate: '[^']+'/, `releaseDate: '${releaseDate}'`)
    .replace(/androidVersionCode: \d+/, `androidVersionCode: ${nativeBuild}`)
    .replace(/iosBuildNumber: '[^']+'/, `iosBuildNumber: '${nativeBuild}'`);
  fs.writeFileSync(versionInfoPath, source);
}

const versionMarkdown = `# Version Information\n\n- App：${app.expo.name}\n- Version：${version}\n- Release Date：${releaseDate}\n- Android versionCode：${nativeBuild}\n- iOS buildNumber：${nativeBuild}\n\n## Version ${version} highlights\n\n- 請在發版前補上本版更新內容。\n`;
fs.writeFileSync('VERSION.md', versionMarkdown);

console.log(`Version updated to ${version}; Android/iOS build number: ${nativeBuild}`);
console.log(`VERSION.md and constants/version-info.ts updated; release date: ${releaseDate}`);
