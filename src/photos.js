// Real photos from Pexels (Pexels Licence: free for commercial use, including inside products you sell; no credit required but we credit anyway).
// usage:
//   node src/photos.js search "<query>" [count]   -> contact sheet in .cache/photos/ with ids, for choosing
//   node src/photos.js fetch units/<id>.json        -> downloads every unit.photos entry into assets/photos/ and records credits
// unit.photos: { "<key>": { "pexels": <id>, "note": "why it shows the maths" } }
// behind a proxy, re-run with Node's built-in proxy support switched on
if (process.env.HTTPS_PROXY && !process.env.NODE_USE_ENV_PROXY) {
  const r = require("child_process").spawnSync(process.execPath, process.argv.slice(1), { stdio: "inherit", env: Object.assign({}, process.env, { NODE_USE_ENV_PROXY: "1" }) });
  process.exit(r.status);
}
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const ROOT = path.join(__dirname, "..");
const DIR = path.join(ROOT, "assets", "photos");
const CACHE = path.join(ROOT, ".cache", "photos");
fs.mkdirSync(DIR, { recursive: true }); fs.mkdirSync(CACHE, { recursive: true });
const env = Object.fromEntries((fs.existsSync(path.join(ROOT, ".env")) ? fs.readFileSync(path.join(ROOT, ".env"), "utf8") : "").split("\n").filter(l => l.includes("=")).map(l => [l.split("=")[0].trim(), l.slice(l.indexOf("=") + 1).trim()]));
const KEY = process.env.PEXELS_API_KEY || env.PEXELS_API_KEY;
const CRED = path.join(DIR, "credits.json");

async function api(u) {
  if (!KEY) throw new Error("No PEXELS_API_KEY in .env");
  const r = await fetch("https://api.pexels.com/v1/" + u, { headers: { Authorization: KEY } });
  if (!r.ok) throw new Error(`Pexels ${r.status} for ${u}`);
  return r.json();
}
async function get(url) { const r = await fetch(url); if (!r.ok) throw new Error(`download ${r.status}`); return Buffer.from(await r.arrayBuffer()); }

async function search(q, n = 15, page = 1) {
  const d = await api(`search?query=${encodeURIComponent(q)}&per_page=${n}&page=${page}`);
  const tiles = [];
  for (const p of d.photos) {
    const im = await sharp(await get(p.src.medium)).resize(300, 220, { fit: "cover" }).toBuffer();
    const lab = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="300" height="26"><rect width="300" height="26" fill="#000"/><text x="6" y="18" font-family="sans-serif" font-size="15" fill="#fff">${p.id}</text></svg>`);
    tiles.push(await sharp({ create: { width: 300, height: 246, channels: 3, background: "#fff" } }).composite([{ input: im, top: 0, left: 0 }, { input: lab, top: 220, left: 0 }]).png().toBuffer());
  }
  const cols = 5, rows = Math.ceil(tiles.length / cols);
  const out = path.join(CACHE, `search_${q.replace(/[^a-z0-9]+/gi, "_")}_${page}.jpg`);
  await sharp({ create: { width: cols * 305, height: rows * 251, channels: 3, background: "#fff" } })
    .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * 305, top: Math.floor(i / cols) * 251 }))).jpeg({ quality: 80 }).toFile(out);
  d.photos.forEach(p => console.log(p.id, "|", p.alt, "|", p.photographer));
  console.log(out);
}

async function fetchUnit(file) {
  const U = JSON.parse(fs.readFileSync(file, "utf8"));
  const cred = fs.existsSync(CRED) ? JSON.parse(fs.readFileSync(CRED, "utf8")) : {};
  for (const [key, ph] of Object.entries(U.photos || {})) {
    const f = path.join(DIR, key + ".jpg");
    if (fs.existsSync(f) && cred[key] && cred[key].id === ph.pexels) continue;
    const p = await api(`photos/${ph.pexels}`);
    await sharp(await get(p.src.large2x)).resize(2000, 2000, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 86 }).toFile(f);
    cred[key] = { id: p.id, photographer: p.photographer, photographer_url: p.photographer_url, url: p.url, alt: p.alt, licence: "Pexels License (https://www.pexels.com/license/)" };
    console.log("got", key, p.id, p.photographer);
  }
  // people: cut out of their background for slide corners
  const PDIR = path.join(DIR, "people"); fs.mkdirSync(PDIR, { recursive: true });
  for (const [key, ph] of Object.entries(U.people || {})) {
    const f = path.join(PDIR, key + ".png");
    if (fs.existsSync(f) && cred["people/" + key] && cred["people/" + key].id === ph.pexels) continue;
    const p = await api(`photos/${ph.pexels}`);
    const jf = path.join(CACHE, `person_${key}.jpg`);
    fs.writeFileSync(jf, await get(p.src.large2x));
    const r = require("child_process").spawnSync("python3", [path.join(__dirname, "cutout.py"), jf, f], { encoding: "utf8" });
    if (r.status) { console.error(r.stderr); continue; }
    cred["people/" + key] = { id: p.id, photographer: p.photographer, photographer_url: p.photographer_url, url: p.url, alt: p.alt, licence: "Pexels License (https://www.pexels.com/license/)" };
    console.log("person", key, p.id, p.photographer);
  }
  fs.writeFileSync(CRED, JSON.stringify(cred, null, 1));
  const miss = Object.keys(U.photos || {}).filter(k => !fs.existsSync(path.join(DIR, k + ".jpg")));
  console.log(path.basename(file), "photos:", Object.keys(U.photos || {}).length, "missing:", miss.join(", ") || "none");
}

const [cmd, a, b, c] = process.argv.slice(2);
(cmd === "search" ? search(a, +b || 15, +c || 1) : fetchUnit(a)).catch(e => { console.error(e.message); process.exit(1); });
