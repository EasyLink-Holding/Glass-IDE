#!/usr/bin/env node
/**
 * Bump patch version while staying in 0.0.x.
 * Updates:
 *  - root package.json
 *  - frontend/package.json (if exists)
 *  - src-tauri/Cargo.toml
 *  - src-tauri/tauri.conf.json
 */
const fs = require('node:fs');
const path = require('node:path');

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function nextPatch(version) {
  const [maj, min, patch] = version.split('.').map(Number);
  if (maj !== 0 || min !== 0) {
    throw new Error('Version must remain 0.0.x');
  }
  return `0.0.${patch + 1}`;
}

const repoRoot = path.resolve(__dirname, '..');
const changes = [];

// Root package.json
const rootPkgPath = path.join(repoRoot, 'package.json');
const rootPkg = readJSON(rootPkgPath);
const newVersion = nextPatch(rootPkg.version);
rootPkg.version = newVersion;
writeJSON(rootPkgPath, rootPkg);
changes.push(rootPkgPath);

// Frontend package.json
const frontendPkgPath = path.join(repoRoot, 'frontend', 'package.json');
if (fs.existsSync(frontendPkgPath)) {
  const frontendPkg = readJSON(frontendPkgPath);
  frontendPkg.version = newVersion;
  writeJSON(frontendPkgPath, frontendPkg);
  changes.push(frontendPkgPath);
}

// Cargo.toml
const cargoPath = path.join(repoRoot, 'src-tauri', 'Cargo.toml');
if (fs.existsSync(cargoPath)) {
  let cargoContent = fs.readFileSync(cargoPath, 'utf8');
  cargoContent = cargoContent.replace(
    /version\s*=\s*"[0-9]+\.[0-9]+\.[0-9]+"/,
    `version = "${newVersion}"`
  );
  fs.writeFileSync(cargoPath, cargoContent);
  changes.push(cargoPath);
}

// tauri.conf.json
const tauriConfPath = path.join(repoRoot, 'src-tauri', 'tauri.conf.json');
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = readJSON(tauriConfPath);
  tauriConf.version = newVersion;
  writeJSON(tauriConfPath, tauriConf);
  changes.push(tauriConfPath);
}

console.log(`Version bumped to ${newVersion}`);
console.log('Files updated:', changes.map((p) => path.relative(repoRoot, p)).join(', '));
