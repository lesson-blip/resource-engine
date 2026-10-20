// "Cosy classroom" decoration kit: paper backgrounds, washi tape, polaroid photos, sticky notes,
// lined exercise-book paper and hand-drawn doodles (rough.js). Every helper returns a PNG path.
// Images carry their own rotation, so the slide only ever places an upright bounding box.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const K = require("./kit.js");
const rough = require("roughjs/bundled/rough.cjs.js");

const PX = 150; // pixels per inch
const OUT = path.join(K.CACHE, "cosy");
fs.mkdirSync(OUT, { recursive: true });
const hex = c => (c.startsWith("#") ? c : "#" + c);
const key = (...a) => path.join(OUT, a.join("_").replace(/[^\w.-]+/g, "") + ".png");

// rotate a PNG buffer about its centre with a transparent background, return {path, w, h} in inches
async function rotated(buf, deg, f, palette = true) {
  // flat artwork (tape, notes, frames) compresses well as palette PNG; photos keep full colour
  const r = await sharp(buf).rotate(deg, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png(palette ? { palette: true, quality: 92, effort: 8 } : {}).toBuffer();
  fs.writeFileSync(f, r);
  const m = await sharp(r).metadata();
  return { path: f, w: m.width / PX, h: m.height / PX };
}

// grain noise tile, generated once
let NOISE;
async function noise(W, H) {
  if (NOISE && NOISE.W === W) return NOISE.buf;
  const raw = Buffer.alloc(W * H * 4);
  let s = 12345; const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = 0; i < W * H; i++) { const v = Math.round(rnd() * 255); raw[i * 4] = v; raw[i * 4 + 1] = v; raw[i * 4 + 2] = v; raw[i * 4 + 3] = 14; }
  const buf = await sharp(raw, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  NOISE = { W, buf };
  return buf;
}

// Paper background: warm off-white tinted by the theme, faint graph-paper grid, grain, soft corner washes.
async function paper(theme, kind = "content") {
  const PLUS = process.env.DECK_STYLE === "cosyplus";
  const t = K.THEMES[theme], f = key("paper3", theme, kind, PLUS ? "plus" : "").replace(/\.png$/, ".jpg");
  if (fs.existsSync(f)) return f;
  const W = 1920, H = 1080, g = 36; // 0.25 in squares at 144 px/in
  const gridCol = (t.pattern && t.pattern.colour) || t.bg.a;
  const grid = kind === "content"
    ? `<pattern id="g" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><path d="M ${g} 0 L 0 0 0 ${g}" fill="none" stroke="${gridCol}" stroke-opacity="${PLUS ? 0.9 : 0.55}" stroke-width="${PLUS ? 1.6 : 1.2}"/></pattern><rect width="${W}" height="${H}" fill="url(#g)"/>`
    : `<pattern id="d" width="${g}" height="${g}" patternUnits="userSpaceOnUse"><circle cx="${g / 2}" cy="${g / 2}" r="${PLUS ? 2.8 : 2.2}" fill="${gridCol}" fill-opacity="${PLUS ? 0.95 : 0.7}"/></pattern><rect width="${W}" height="${H}" fill="url(#d)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <radialGradient id="a" cx="1" cy="0" r="0.7"><stop offset="0" stop-color="${t.bg.a}" stop-opacity="0.75"/><stop offset="1" stop-color="${t.bg.a}" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="0" cy="1" r="0.7"><stop offset="0" stop-color="${t.bg.b}" stop-opacity="0.75"/><stop offset="1" stop-color="${t.bg.b}" stop-opacity="0"/></radialGradient></defs>
    <rect width="${W}" height="${H}" fill="#FBF8F2"/><rect width="${W}" height="${H}" fill="${t.bg.base}" fill-opacity="0.55"/>
    <rect width="${W}" height="${H}" fill="url(#a)"/><rect width="${W}" height="${H}" fill="url(#b)"/>${grid}</svg>`;
  await sharp(Buffer.from(svg)).composite([{ input: await noise(W, H), tile: true }]).jpeg({ quality: 86, chromaSubsampling: "4:4:4" }).toFile(f);
  return f;
}

// Washi tape strip with torn ends and a faint stripe.
async function washi(colour, w = 1.3, h = 0.36, deg = -6) {
  const f = key("washi", colour, w, h, deg);
  const W = Math.round(w * PX), H = Math.round(h * PX), z = Math.round(H / 6);
  let left = "", right = "";
  for (let y = 0, i = 0; y <= H; y += z, i++) { left += `${i % 2 ? z * 0.6 : 0},${y} `; right = `${W - (i % 2 ? 0 : z * 0.6)},${y} ` + right; }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <pattern id="s" width="${H / 3}" height="${H / 3}" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="${H / 6}" height="${H / 3}" fill="#FFFFFF" fill-opacity="0.22"/></pattern>
    <clipPath id="c"><polygon points="${left}${right}"/></clipPath></defs>
    <g clip-path="url(#c)"><rect width="${W}" height="${H}" fill="${hex(colour)}" fill-opacity="0.72"/><rect width="${W}" height="${H}" fill="url(#s)"/></g></svg>`;
  return rotated(await sharp(Buffer.from(svg)).png().toBuffer(), deg, f);
}

// Polaroid: photo in a white frame (deeper at the bottom), soft shadow, slight tilt. w,h = photo area in inches.
async function polaroid(photoKey, w, h, deg = -2.5, caption = "") {
  const f = key("pola", photoKey, w, h, deg, caption.length);
  const pad = Math.round(0.14 * PX), bot = Math.round((caption ? 0.55 : 0.42) * PX), sh = Math.round(0.12 * PX);
  const PW = Math.round(w * PX), PH = Math.round(h * PX), FW = PW + 2 * pad, FH = PH + pad + bot;
  const img = await sharp(path.join(K.ASSETS, "photos", photoKey + ".jpg")).resize(PW, PH, { fit: "cover", position: "attention" }).toBuffer();
  const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="${FW + 2 * sh}" height="${FH + 2 * sh}"><defs><filter id="b"><feGaussianBlur stdDeviation="${sh / 2.5}"/></filter></defs>
    <rect x="${sh + 3}" y="${sh + 6}" width="${FW}" height="${FH}" rx="4" fill="#3A3A50" fill-opacity="0.28" filter="url(#b)"/>
    <rect x="${sh}" y="${sh}" width="${FW}" height="${FH}" rx="4" fill="#FFFFFF"/>
    ${caption ? `<text x="${sh + FW / 2}" y="${sh + pad + PH + bot * 0.62}" font-family="Edu NSW ACT Foundation" font-size="${Math.round(0.24 * PX)}" fill="#3A4256" text-anchor="middle">${caption}</text>` : ""}</svg>`;
  const buf = await sharp(Buffer.from(frame)).composite([{ input: img, left: sh + pad, top: sh + pad }]).png().toBuffer();
  return rotated(buf, deg, f, false);
}

// Sticky note: square-ish paper with a slight gradient and a curled-corner shadow. Text goes on top as a clear text box.
async function sticky(colour, w, h, deg = 1.5) {
  const f = key("sticky", colour, w, h, deg);
  const W = Math.round(w * PX), H = Math.round(h * PX), sh = Math.round(0.1 * PX);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W + 2 * sh}" height="${H + 2 * sh}"><defs>
    <filter id="b"><feGaussianBlur stdDeviation="${sh / 2.2}"/></filter>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hex(colour)}"/><stop offset="1" stop-color="${hex(colour)}" stop-opacity="0.88"/></linearGradient></defs>
    <path d="M ${sh + 8} ${sh + 10} L ${sh + W - 4} ${sh + 10} L ${sh + W - 2} ${sh + H + 2} Q ${sh + W * 0.6} ${sh + H - 10} ${sh + 6} ${sh + H + 4} Z" fill="#3A3A50" fill-opacity="0.25" filter="url(#b)"/>
    <rect x="${sh}" y="${sh}" width="${W}" height="${H}" fill="url(#g)"/>
    <rect x="${sh}" y="${sh}" width="${W}" height="${Math.round(H * 0.12)}" fill="#000" fill-opacity="0.035"/></svg>`;
  return rotated(await sharp(Buffer.from(svg)).png().toBuffer(), deg, f);
}

// Lined exercise-book paper: blue rules at a fixed pitch, red margin line, punched holes.
async function lined(w, h, pitchIn, firstIn, marginIn = 0.75) {
  const f = key("lined", w, h, pitchIn, firstIn, marginIn);
  if (fs.existsSync(f)) return f;
  const W = Math.round(w * PX), H = Math.round(h * PX), sh = Math.round(0.08 * PX);
  let rules = "";
  for (let y = firstIn; y < h - 0.1; y += pitchIn) rules += `<line x1="0" x2="${W}" y1="${y * PX}" y2="${y * PX}" stroke="#9DB8E0" stroke-width="2"/>`;
  const holes = [0.22, 0.5, 0.78].map(p => `<circle cx="${0.22 * PX}" cy="${h * p * PX}" r="${0.07 * PX}" fill="#E9E4DA"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W + sh}" height="${H + sh}"><defs><filter id="b"><feGaussianBlur stdDeviation="${sh / 2}"/></filter></defs>
    <rect x="${sh / 2 + 2}" y="${sh / 2 + 4}" width="${W}" height="${H}" rx="8" fill="#3A3A50" fill-opacity="0.18" filter="url(#b)"/>
    <svg x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="8" fill="#FFFEFA"/>${rules}
    <line x1="${marginIn * PX}" x2="${marginIn * PX}" y1="0" y2="${H}" stroke="#E58C8C" stroke-width="2.5"/>${holes}</svg></svg>`;
  await sharp(Buffer.from(svg)).png().toFile(f);
  return f;
}

// Hand-drawn doodles with rough.js. kind: underline | star | arrow | circle | sparkle | swirl
function roughSvg(drawables, W, H) {
  const g = rough.generator();
  const paths = drawables(g).flatMap(d => g.toPaths(d));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${paths.map(p => `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="${p.fill || "none"}" stroke-linecap="round" stroke-linejoin="round"/>`).join("")}</svg>`;
}
async function doodle(kind, colour, w, h, seed = 3) {
  const f = key("doodle", kind, colour, w, h, seed);
  if (fs.existsSync(f)) { const m = await sharp(f).metadata(); return { path: f, w: m.width / PX, h: m.height / PX }; }
  const W = Math.round(w * PX), H = Math.round(h * PX), c = hex(colour);
  const o = { stroke: c, strokeWidth: Math.max(3, Math.round(0.035 * PX)), roughness: 1.6, bowing: 1.4, seed };
  const svg = roughSvg(g => {
    if (kind === "underline") return [g.curve([[6, H * 0.55], [W * 0.3, H * 0.35], [W * 0.65, H * 0.6], [W - 6, H * 0.4]], o), g.curve([[W * 0.12, H * 0.8], [W * 0.5, H * 0.62], [W * 0.88, H * 0.75]], Object.assign({}, o, { seed: seed + 1 }))];
    if (kind === "circle") return [g.ellipse(W / 2, H / 2, W * 0.92, H * 0.86, o)];
    if (kind === "arrow") return [g.curve([[8, H * 0.2], [W * 0.45, H * 0.15], [W * 0.75, H * 0.55], [W - 12, H * 0.8]], o), g.linearPath([[W - 46, H * 0.8 - 10], [W - 12, H * 0.8], [W - 34, H * 0.8 - 40]], o)];
    if (kind === "star") { const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.46, r = R * 0.45, pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]); } return [g.polygon(pts, Object.assign({}, o, { fill: c, fillStyle: "hachure", hachureGap: 7, fillWeight: 2 }))]; }
    if (kind === "sparkle") { const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.46; return [g.line(cx, cy - R, cx, cy + R, o), g.line(cx - R, cy, cx + R, cy, o), g.line(cx - R * 0.55, cy - R * 0.55, cx + R * 0.55, cy + R * 0.55, Object.assign({}, o, { strokeWidth: o.strokeWidth * 0.7 })), g.line(cx - R * 0.55, cy + R * 0.55, cx + R * 0.55, cy - R * 0.55, Object.assign({}, o, { strokeWidth: o.strokeWidth * 0.7 }))]; }
    if (kind === "swirl") { const pts = []; for (let i = 0; i < 40; i++) { const a = i * 0.45, rr = 4 + i * Math.min(W, H) / 90; pts.push([W / 2 + rr * Math.cos(a), H / 2 + rr * Math.sin(a)]); } return [g.curve(pts, o)]; }
    return [];
  }, W, H);
  await sharp(Buffer.from(svg)).png().toFile(f);
  return { path: f, w, h };
}

module.exports = { paper, washi, polaroid, sticky, lined, doodle, PX };

// A page image (worksheet thumbnail) on white paper with a shadow and a tilt, ready for washi tape on top.
async function paperShot(file, maxW, maxH, deg = 2) {
  const m0 = await sharp(file).metadata(), ar = m0.width / m0.height;
  let w = maxW, h = w / ar; if (h > maxH) { h = maxH; w = h * ar; }
  const f = key("shot", path.basename(file), w.toFixed(2), h.toFixed(2), deg);
  const pad = Math.round(0.06 * PX), sh = Math.round(0.1 * PX), PW = Math.round(w * PX), PH = Math.round(h * PX);
  const img = await sharp(file).resize(PW, PH, { fit: "fill" }).toBuffer();
  const frame = `<svg xmlns="http://www.w3.org/2000/svg" width="${PW + 2 * pad + 2 * sh}" height="${PH + 2 * pad + 2 * sh}"><defs><filter id="b"><feGaussianBlur stdDeviation="${sh / 2.5}"/></filter></defs>
    <rect x="${sh + 3}" y="${sh + 6}" width="${PW + 2 * pad}" height="${PH + 2 * pad}" rx="3" fill="#3A3A50" fill-opacity="0.25" filter="url(#b)"/>
    <rect x="${sh}" y="${sh}" width="${PW + 2 * pad}" height="${PH + 2 * pad}" rx="3" fill="#FFFFFF"/></svg>`;
  const buf = await sharp(Buffer.from(frame)).composite([{ input: img, left: sh + pad, top: sh + pad }]).png().toBuffer();
  return rotated(buf, deg, f);
}
module.exports.paperShot = paperShot;

// Hand-drawn stroke through points (inches), as SVG path markup for embedding in a larger drawing at `px` per inch.
function roughCurveSvg(pointsIn, colour, strokeIn, px, seed = 4) {
  const g = rough.generator();
  const d = g.curve(pointsIn.map(([x, y]) => [x * px, y * px]), { stroke: hex(colour), strokeWidth: strokeIn * px, roughness: 1.2, bowing: 0.8, seed });
  return g.toPaths(d).map(p => `<path d="${p.d}" stroke="${p.stroke}" stroke-width="${p.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
}
module.exports.roughCurveSvg = roughCurveSvg;

// Flatten a transparent picture onto the slide's paper so it can be stored as a small JPEG.
// x, y in inches on a 13.333 x 7.5 in slide; kind = the paper used by that slide's master.
async function onPaper(img, theme, kind, x, y) {
  const f = img.path.replace(/\.png$/, `_on_${theme}_${kind}_${x.toFixed(2)}_${y.toFixed(2)}.jpg`);
  if (!fs.existsSync(f)) {
    const bg = await paper(theme, kind), m = await sharp(img.path).metadata();
    const S = 1920 / 13.333, left = Math.round(x * S), top = Math.round(y * S), w = Math.round(img.w * S), h = Math.round(img.h * S);
    const crop = await sharp(bg).extract({ left: Math.max(0, left), top: Math.max(0, top), width: Math.min(w, 1920 - Math.max(0, left)), height: Math.min(h, 1080 - Math.max(0, top)) }).resize(m.width, m.height, { fit: "fill" }).toBuffer();
    await sharp(crop).composite([{ input: img.path }]).jpeg({ quality: 84 }).toFile(f);
  }
  return { path: f, w: img.w, h: img.h };
}
module.exports.onPaper = onPaper;
