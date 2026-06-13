#!/usr/bin/env node
/**
 * fetch_data.js — Download Systek staff data and photos
 * for offline / fully-static hosting.
 *
 * Usage:  node fetch_data.js
 *
 * Requires: Node.js 18+ (uses built-in fetch)
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SANITY_PROJECT = 's9j0sgbs';
const SANITY_DATASET = 'production';
const API_URL =
  `https://${SANITY_PROJECT}.api.sanity.io/v2026-01-08/data/query/${SANITY_DATASET}` +
  `?query=*%5B_type%20%3D%3D%20%22staff%22%5D`;
const CDN_BASE = `https://cdn.sanity.io/images/${SANITY_PROJECT}/${SANITY_DATASET}`;
const OUT_DIR = path.join(__dirname, 'data');
const IMAGES_DIR = path.join(OUT_DIR, 'images');

fs.mkdirSync(IMAGES_DIR, { recursive: true });

// ---- helpers ------------------------------------------------

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve('skip'); return; }
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve('ok'); });
    }).on('error', err => {
      file.close();
      try { fs.unlinkSync(dest); } catch {}
      reject(err);
    });
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function buildImageUrl(ref, hotspot) {
  // ref format: image-HASH-WIDTHxHEIGHT-FORMAT
  const parts = ref.split('-');
  const hash = parts[1];
  const dims = parts[2];
  const fmt  = parts[3] || 'jpg';
  let url = `${CDN_BASE}/${hash}-${dims}.${fmt}?w=600&h=750&fit=crop&auto=format&q=80`;
  if (hotspot?.x != null && hotspot?.y != null) {
    url += `&fp-x=${hotspot.x.toFixed(4)}&fp-y=${hotspot.y.toFixed(4)}`;
  }
  return url;
}

// ---- main ---------------------------------------------------

async function main() {
  console.log('Fetching staff data from Sanity...');
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const json = await res.json();
  const staff = json.result;

  // Write raw data (game.js loads this as fallback)
  fs.writeFileSync(path.join(OUT_DIR, 'staff.json'), JSON.stringify(json, null, 2));
  console.log(`  → ${staff.length} staff records saved to data/staff.json`);

  // Download photos
  console.log('Downloading photos...');
  const withImage = staff.filter(s => s.name && s.image?.asset?._ref);
  let ok = 0, skipped = 0, failed = 0;

  for (const s of withImage) {
    const ref = s.image.asset._ref;
    const url = buildImageUrl(ref, s.image.hotspot);
    const dest = path.join(IMAGES_DIR, `${s._id}.jpg`);

    try {
      const result = await downloadFile(url, dest);
      if (result === 'skip') { process.stdout.write('s'); skipped++; }
      else { process.stdout.write('.'); ok++; }
    } catch (e) {
      process.stdout.write('!');
      failed++;
    }
    await sleep(60); // be polite to CDN
  }

  console.log(`\n\nDone!`);
  console.log(`  Downloaded: ${ok}  Skipped: ${skipped}  Failed: ${failed}`);
  console.log(`  Files: data/staff.json + data/images/<id>.jpg`);
  console.log('\nServe the name-game/ folder with any static file server.');
  console.log('The game will automatically load local images.');

  // Write a manifest so game.js can map _id → local image path
  const manifest = {};
  withImage.forEach(s => {
    const dest = path.join(IMAGES_DIR, `${s._id}.jpg`);
    if (fs.existsSync(dest)) {
      manifest[s._id] = `data/images/${s._id}.jpg`;
    }
  });
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('  Manifest: data/manifest.json');
}

main().catch(err => { console.error('\nError:', err.message); process.exit(1); });
