// Accurate maths visuals drawn as SVG, rasterised to PNG with sharp.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const E3D = path.join(ROOT, "assets", "img");
const FIGS = path.join(ROOT, "assets", "figs");
const CACHE = path.join(ROOT, ".cache", "visuals");
fs.mkdirSync(CACHE, { recursive: true });

const C = {
  navy: "#17324D", teal: "#0F7C8C", mint: "#178F76", sky: "#2C74C9", indigo: "#5052C9", lav: "#7A5CC7",
  tealL: "#E0F2F4", mintL: "#DFF3EC", skyL: "#E3EEFA", indigoL: "#E8E8FA", lavL: "#EFE9FA", line: "#9FB1C5", grey: "#5B6B7F",
  gold: "#E9B949", goldD: "#B8862B", silver: "#C9D2DC", silverD: "#8E9AA8",
};
const ROWCOLS = [C.teal, C.sky, C.mint, C.indigo, C.lav, C.teal, C.sky];
const ROWTINTS = [C.tealL, C.skyL, C.mintL, C.indigoL, C.lavL, C.tealL, C.skyL];
const F = `font-family="Nunito Sans, sans-serif"`;
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function picData(key) {
  const f = path.join(E3D, key + ".png");
  if (!fs.existsSync(f)) return null;
  return "data:image/png;base64," + fs.readFileSync(f).toString("base64");
}

// stacked fraction or plain text, centred at x,y (y = middle)
function num(x, y, s, size = 30, col = C.navy, bold = true) {
  s = String(s);
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  const m2 = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/); // mixed number
  const w = bold ? 700 : 400;
  if (m2) {
    return `<text x="${x - size * 0.45}" y="${y + size * 0.35}" ${F} font-size="${size * 1.05}" font-weight="${w}" fill="${col}" text-anchor="middle">${m2[1]}</text>` + num(x + size * 0.35, y, `${m2[2]}/${m2[3]}`, size, col, bold);
  }
  if (!m) return `<text x="${x}" y="${y + size * 0.35}" ${F} font-size="${size}" font-weight="${w}" fill="${col}" text-anchor="middle">${esc(s)}</text>`;
  const fs2 = size * 0.82, bw = Math.max(m[1].length, m[2].length) * fs2 * 0.62 + 8;
  return `<text x="${x}" y="${y - 4}" ${F} font-size="${fs2}" font-weight="${w}" fill="${col}" text-anchor="middle">${m[1]}</text>
  <line x1="${x - bw / 2}" y1="${y + 2}" x2="${x + bw / 2}" y2="${y + 2}" stroke="${col}" stroke-width="${Math.max(2, size / 12)}" stroke-linecap="round"/>
  <text x="${x}" y="${y + fs2 + 4}" ${F} font-size="${fs2}" font-weight="${w}" fill="${col}" text-anchor="middle">${m[2]}</text>`;
}
const txt = (x, y, s, size = 24, col = C.navy, w = 700, anchor = "middle") => `<text x="${x}" y="${y}" ${F} font-size="${size}" font-weight="${w}" fill="${col}" text-anchor="${anchor}">${esc(s)}</text>`;

const K = {};

K.fractionStrip = v => {
  const n = v.parts || 1, sh = v.shaded || 0, W = 1000, H = 170, x0 = 20, y0 = 20, bw = W - 40, bh = 130;
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = x0 + (bw / n) * i;
    s += `<rect x="${x}" y="${y0}" width="${bw / n}" height="${bh}" fill="${i < sh ? C.teal : "#fff"}" stroke="${C.navy}" stroke-width="4"/>`;
    if (v.labels !== false) s += num(x + bw / n / 2, y0 + bh / 2, n === 1 ? "1" : `1/${n}`, Math.min(56, bw / n / 2.0), i < sh ? "#fff" : C.navy);
  }
  s += `<rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="none" stroke="${C.navy}" stroke-width="6" rx="6"/>`;
  return { w: W, h: H, body: s };
};

K.fractionWall = v => {
  const rows = v.rows || [1, 2, 4, 8], W = 1000, rh = 95, gap = 12, x0 = 20, bw = W - 40;
  let s = "";
  rows.forEach((n, r) => {
    const y = 20 + r * (rh + gap);
    for (let i = 0; i < n; i++) {
      const x = x0 + (bw / n) * i;
      s += `<rect x="${x}" y="${y}" width="${bw / n}" height="${rh}" fill="${ROWTINTS[r % 7]}" stroke="${ROWCOLS[r % 7]}" stroke-width="4"/>`;
      s += num(x + bw / n / 2, y + rh / 2, n === 1 ? "1" : `1/${n}`, Math.min(54, bw / n / 1.9), ROWCOLS[r % 7]);
    }
  });
  return { w: W, h: 40 + rows.length * (rh + gap) - gap, body: s };
};

K.numberLine = v => {
  const W = 1100, H = 270, x0 = 60, x1 = W - 70, y = 120;
  const t = v.ticks || 4;
  const labels = v.labels || [];
  const hl = new Set(v.highlight || []);
  let s = `<line x1="${x0 - 20}" y1="${y}" x2="${x1 + 40}" y2="${y}" stroke="${C.navy}" stroke-width="5" stroke-linecap="round"/>
  <path d="M${x1 + 50},${y} l-20,-12 l0,24 z" fill="${C.navy}"/>`;
  for (let i = 0; i <= t; i++) {
    const x = x0 + ((x1 - x0) / t) * i;
    const major = i === 0 || i === t;
    s += `<line x1="${x}" y1="${y - (major ? 28 : 20)}" x2="${x}" y2="${y + (major ? 28 : 20)}" stroke="${C.navy}" stroke-width="${major ? 5 : 4}"/>`;
    if (hl.has(i)) s += `<circle cx="${x}" cy="${y}" r="17" fill="${C.mint}" stroke="#fff" stroke-width="4"/>`;
    const lab = labels[i];
    if (lab !== undefined && lab !== "") s += num(x, y + 80, lab, t > 12 ? 30 : t > 8 ? 38 : 50, hl.has(i) ? C.mint : C.navy);
  }
  (v.jumps || []).forEach(j => {
    const xa = x0 + ((x1 - x0) / t) * j.from, xb = x0 + ((x1 - x0) / t) * j.to, mx = (xa + xb) / 2;
    s += `<path d="M${xa},${y - 30} Q${mx},${y - 95} ${xb},${y - 30}" fill="none" stroke="${C.sky}" stroke-width="4"/><path d="M${xb},${y - 30} l-14,-14 l18,-2 z" fill="${C.sky}"/>`;
    if (j.label) s += num(mx, y - 100, j.label, 30, C.sky);
  });
  return { w: W, h: H, body: s };
};

K.collection = v => {
  const n = v.count || 12, g = v.groups || 1, per = Math.ceil(n / g), sg = v.shadedGroups || 0;
  const cols = Math.min(g, 4), rows = Math.ceil(g / cols);
  const gw = 230, gh = Math.ceil(per / 3) * 62 + 30, W = cols * (gw + 24) + 24, H = rows * (gh + 24) + 24;
  let s = "", k = 0;
  for (let gi = 0; gi < g; gi++) {
    const gx = 24 + (gi % cols) * (gw + 24), gy = 24 + Math.floor(gi / cols) * (gh + 24);
    s += `<rect x="${gx}" y="${gy}" width="${gw}" height="${gh}" rx="26" fill="${gi < sg ? C.mintL : "#fff"}" stroke="${gi < sg ? C.mint : C.line}" stroke-width="4"/>`;
    for (let i = 0; i < per && k < n; i++, k++) {
      const cx = gx + 45 + (i % 3) * 70, cy = gy + 45 + Math.floor(i / 3) * 62;
      s += `<circle cx="${cx}" cy="${cy}" r="24" fill="${gi < sg ? C.mint : C.sky}" stroke="#fff" stroke-width="3"/>`;
    }
  }
  return { w: W, h: H, body: s };
};

const colLetter = i => String.fromCharCode(65 + i);
function cellXY(ref) { const m = String(ref).toUpperCase().match(/^([A-Z])(\d+)$/); return m ? { c: m[1].charCodeAt(0) - 65, r: +m[2] - 1 } : null; }
K.grid = v => {
  const R = v.rows || 5, Cn = v.cols || 5, cs = Math.min(150, Math.floor(900 / Math.max(R, Cn))), x0 = 70, y0 = 70;
  const W = x0 + Cn * cs + 30, H = y0 + R * cs + 30;
  let s = "";
  for (let r = 0; r < R; r++) for (let c = 0; c < Cn; c++)
    s += `<rect x="${x0 + c * cs}" y="${y0 + r * cs}" width="${cs}" height="${cs}" fill="${(r + c) % 2 ? "#F4F9FB" : "#fff"}" stroke="${C.line}" stroke-width="3"/>`;
  for (let c = 0; c < Cn; c++) s += txt(x0 + c * cs + cs / 2, y0 - 22, colLetter(c), 34, C.teal);
  for (let r = 0; r < R; r++) s += txt(x0 - 32, y0 + r * cs + cs / 2 + 12, String(r + 1), 34, C.teal);
  s += `<rect x="${x0}" y="${y0}" width="${Cn * cs}" height="${R * cs}" fill="none" stroke="${C.navy}" stroke-width="5" rx="4"/>`;
  if (v.path && v.path.length > 1) {
    const pts = v.path.map(cellXY).filter(Boolean).map(p => `${x0 + p.c * cs + cs / 2},${y0 + p.r * cs + cs / 2}`);
    s += `<polyline points="${pts.join(" ")}" fill="none" stroke="${C.lav}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 18"/>`;
    const last = pts[pts.length - 1].split(",");
    s += `<circle cx="${last[0]}" cy="${last[1]}" r="14" fill="${C.lav}"/>`;
  }
  (v.items || []).forEach(it => {
    const p = cellXY(it.cell); if (!p) return;
    const x = x0 + p.c * cs, y = y0 + p.r * cs;
    const d = it.pic && picData(it.pic);
    const ps = it.label ? cs * 0.62 : cs * 0.78;
    if (d) s += `<image href="${d}" x="${x + (cs - ps) / 2}" y="${y + (it.label ? 6 : (cs - ps) / 2)}" width="${ps}" height="${ps}"/>`;
    if (it.label) s += txt(x + cs / 2, y + cs - 10, it.label, Math.min(26, cs / 5.2), C.navy, 700);
  });
  return { w: W, h: H, body: s };
};

K.compass = v => {
  const W = 700, H = 700, cx = 350, cy = 350;
  const eight = (v.points || 8) === 8;
  let s = `<circle cx="${cx}" cy="${cy}" r="250" fill="${C.skyL}" stroke="${C.sky}" stroke-width="6"/>`;
  const star = (ang, len, wid, col) => {
    const a = (ang - 90) * Math.PI / 180, p = a + Math.PI / 2;
    const tx = cx + Math.cos(a) * len, ty = cy + Math.sin(a) * len;
    return `<polygon points="${tx},${ty} ${cx + Math.cos(p) * wid},${cy + Math.sin(p) * wid} ${cx - Math.cos(p) * wid},${cy - Math.sin(p) * wid}" fill="${col}"/>`;
  };
  if (eight) [45, 135, 225, 315].forEach(a => s += star(a, 170, 28, C.lav));
  [0, 90, 180, 270].forEach(a => s += star(a, 235, 40, a === 0 ? C.indigo : C.navy));
  s += `<circle cx="${cx}" cy="${cy}" r="22" fill="#fff" stroke="${C.navy}" stroke-width="6"/>`;
  const lab = [["N", 0], ["E", 90], ["S", 180], ["W", 270]].concat(eight ? [["NE", 45], ["SE", 135], ["SW", 225], ["NW", 315]] : []);
  lab.forEach(([t, a]) => {
    const r = t.length === 1 ? 300 : 215, rad = (a - 90) * Math.PI / 180;
    s += txt(cx + Math.cos(rad) * r, cy + Math.sin(rad) * r + 14, t, t.length === 1 ? 46 : 32, t === "N" ? C.indigo : C.navy);
  });
  return { w: W, h: H, body: s };
};

function angleType(d) { return d < 90 ? "acute" : d === 90 ? "right angle" : d < 180 ? "obtuse" : d === 180 ? "straight" : "reflex"; }
function angleSvg(deg, label, ox, oy, L, col) {
  const a = -deg * Math.PI / 180;
  const x2 = ox + Math.cos(a) * L, y2 = oy + Math.sin(a) * L;
  let s = `<line x1="${ox}" y1="${oy}" x2="${ox + L}" y2="${oy}" stroke="${C.navy}" stroke-width="8" stroke-linecap="round"/>
  <line x1="${ox}" y1="${oy}" x2="${x2}" y2="${y2}" stroke="${C.navy}" stroke-width="8" stroke-linecap="round"/>`;
  if (deg === 90) s += `<path d="M${ox + 50},${oy} L${ox + 50},${oy - 50} L${ox},${oy - 50}" fill="none" stroke="${col}" stroke-width="6"/>`;
  else {
    const r = 70, ax = ox + Math.cos(a) * r, ay = oy + Math.sin(a) * r;
    s += `<path d="M${ox + r},${oy} A${r},${r} 0 ${deg > 180 ? 1 : 0} 0 ${ax},${ay}" fill="none" stroke="${col}" stroke-width="6"/>`;
  }
  s += `<circle cx="${ox}" cy="${oy}" r="9" fill="${C.navy}"/>`;
  if (label) s += txt(ox + L / 2 - 10, oy + 64, label, 38, col);
  return s;
}
K.angle = v => {
  const deg = v.deg || 90, W = 640, H = 420;
  const ox = deg > 90 ? 340 : 110;
  return { w: W, h: H, body: angleSvg(deg, v.label === undefined ? angleType(deg) : v.label, ox, 320, 260, C.mint) };
};
K.angleSet = v => {
  const as = v.angles || [45, 90, 135], pw = 420, W = pw * as.length, H = 420;
  let s = "";
  as.forEach((d, i) => {
    const col = d < 90 ? C.sky : d === 90 ? C.mint : C.indigo;
    s += angleSvg(d, angleType(d), i * pw + (d > 90 ? 230 : 60), 300, 190, col);
  });
  return { w: W, h: H, body: s };
};

K.array = v => {
  const r = v.rows || 3, c = v.cols || 4, g = 80, W = c * g + 60, H = r * g + 60;
  let s = "";
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) s += `<circle cx="${30 + g / 2 + j * g}" cy="${30 + g / 2 + i * g}" r="${g * 0.33}" fill="${C.sky}"/>`;
  return { w: W, h: H, body: s };
};

K.pvChart = v => {
  const cols = v.cols || ["Hundreds", "Tens", "Ones"], digits = v.digits || [];
  const cw = Math.max(170, Math.min(240, 1100 / cols.length)), W = cols.length * cw + 40, H = 340;
  const colOf = n => /tenth|hundredth|thousandth/i.test(n) ? C.lav : [C.indigo, C.sky, C.teal, C.mint, C.mint][(cols.filter(c => !/th$/i.test(c)).length - 1 - cols.indexOf(n) + 5) % 5];
  let s = "";
  cols.forEach((n, i) => {
    const x = 20 + i * cw, col = colOf(n);
    s += `<rect x="${x + 4}" y="20" width="${cw - 8}" height="80" rx="18" fill="${col}"/>`;
    s += txt(x + cw / 2, 72, n, n.length > 9 ? 24 : 30, "#fff");
    s += `<rect x="${x + 4}" y="112" width="${cw - 8}" height="190" rx="18" fill="#fff" stroke="${col}" stroke-width="5"/>`;
    if (digits[i] !== undefined && digits[i] !== "") s += txt(x + cw / 2, 245, digits[i], 110, C.navy);
    const dec = cols.findIndex(c => /tenth/i.test(c));
    if (dec > 0 && i === dec - 1) s += `<circle cx="${x + cw}" cy="318" r="11" fill="${C.navy}"/>`;
  });
  return { w: W, h: H, body: s };
};

K.decimalGrid = v => {
  const sh = v.shaded || 0, cs = 52, x0 = 20, y0 = 20, W = 10 * cs + 40, H = 10 * cs + 40;
  let s = "";
  for (let c = 0; c < 10; c++) for (let r = 0; r < 10; r++) {
    const idx = c * 10 + r;
    s += `<rect x="${x0 + c * cs}" y="${y0 + r * cs}" width="${cs}" height="${cs}" fill="${idx < sh ? C.teal : "#fff"}" stroke="${C.line}" stroke-width="2"/>`;
  }
  for (let c = 0; c <= 10; c++) s += `<line x1="${x0 + c * cs}" y1="${y0}" x2="${x0 + c * cs}" y2="${y0 + 10 * cs}" stroke="${C.navy}" stroke-width="${c % 10 === 0 ? 6 : 3.5}"/>`;
  s += `<rect x="${x0}" y="${y0}" width="${10 * cs}" height="${10 * cs}" fill="none" stroke="${C.navy}" stroke-width="6"/>`;
  return { w: W, h: H, body: s };
};

K.mab = v => {
  const h = v.hundreds || 0, t = v.tens || 0, o = v.ones || 0, u = 22;
  let s = "", x = 20;
  const cube = (x, y, col) => `<rect x="${x}" y="${y}" width="${u}" height="${u}" fill="${col}" stroke="#0B5A66" stroke-width="2"/>`;
  for (let i = 0; i < h; i++) { for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) s += cube(x + c * u, 20 + r * u, "#F4C76A"); s += `<rect x="${x}" y="20" width="${10 * u}" height="${10 * u}" fill="none" stroke="#8A5A12" stroke-width="4"/>`; x += 10 * u + 30; }
  for (let i = 0; i < t; i++) { for (let r = 0; r < 10; r++) s += cube(x, 20 + r * u, "#7FC7D2"); s += `<rect x="${x}" y="20" width="${u}" height="${10 * u}" fill="none" stroke="#0B5A66" stroke-width="4"/>`; x += u + 16; }
  if (t) x += 14;
  for (let i = 0; i < o; i++) { s += cube(x + (i % 3) * (u + 10), 20 + 10 * u - u - Math.floor(i / 3) * (u + 10), "#9AD6B9"); }
  if (o) x += 3 * (u + 10);
  return { w: Math.max(x + 20, 200), h: 10 * u + 40, body: s };
};

K.jug = v => {
  const cap = v.capacity || 1000, fill = Math.min(v.fill || 0, cap), step = v.step || cap / 10, unit = v.unit || "mL";
  const W = 560, H = 720, x0 = 150, top = 90, bot = 650, w = 280;
  const yFor = val => bot - (val / cap) * (bot - top - 40);
  let s = `<path d="M${x0},${top} L${x0 + w},${top} L${x0 + w},${bot - 20} Q${x0 + w},${bot} ${x0 + w - 20},${bot} L${x0 + 20},${bot} Q${x0},${bot} ${x0},${bot - 20} Z" fill="#F7FBFE" stroke="${C.navy}" stroke-width="7"/>`;
  s += `<path d="M${x0 + w},${top + 60} q110,10 90,130 q-10,80 -90,90" fill="none" stroke="${C.navy}" stroke-width="10"/>`;
  if (fill > 0) s += `<path d="M${x0 + 6},${yFor(fill)} L${x0 + w - 6},${yFor(fill)} L${x0 + w - 6},${bot - 20} Q${x0 + w - 6},${bot - 6} ${x0 + w - 20},${bot - 6} L${x0 + 20},${bot - 6} Q${x0 + 6},${bot - 6} ${x0 + 6},${bot - 20} Z" fill="#8FD3E8" opacity="0.85"/>`;
  for (let val = step; val <= cap + 0.001; val += step) {
    const y = yFor(val), big = Math.abs(val % (step * 2)) < 0.001 || val === cap;
    s += `<line x1="${x0}" y1="${y}" x2="${x0 + (big ? 60 : 36)}" y2="${y}" stroke="${C.navy}" stroke-width="4"/>`;
    if (big || cap / step <= 5) s += txt(x0 - 14, y + 9, (unit === "L" ? +val.toFixed(2) : Math.round(val)) + (val === cap ? " " + unit : ""), 26, C.navy, 700, "end");
  }
  return { w: W, h: H, body: s };
};

K.cubes = v => {
  const l = v.l || 3, wd = v.w || 2, hh = v.h || 2, u = 60, dx = u * 0.55, dy = u * 0.32;
  let s = "";
  const W = 60 + l * u + wd * dx + 40, H = 60 + hh * u + wd * dy + 40;
  const ox = 30, oy = H - 30 - wd * dy;
  const face = (pts, fillc) => `<polygon points="${pts.map(p => p.join(",")).join(" ")}" fill="${fillc}" stroke="#0B5A66" stroke-width="2.5" stroke-linejoin="round"/>`;
  for (let z = wd - 1; z >= 0; z--) for (let y = 0; y < hh; y++) for (let x = 0; x < l; x++) {
    const bx = ox + x * u + z * dx, by = oy - y * u - z * dy;
    s += face([[bx, by], [bx + u, by], [bx + u, by - u], [bx, by - u]], "#7FC7D2");
    s += face([[bx, by - u], [bx + u, by - u], [bx + u + dx, by - u - dy], [bx + dx, by - u - dy]], "#B8E3EA");
    s += face([[bx + u, by], [bx + u + dx, by - dy], [bx + u + dx, by - u - dy], [bx + u, by - u]], "#4FA9B6");
  }
  return { w: W, h: H, body: s };
};

K.money = v => {
  const items = v.items || [];
  let s = "", x = 20;
  const H = 230;
  items.forEach(a => {
    if (a >= 5) {
      const col = { 5: "#C67AB4", 10: "#4C8FD6", 20: "#E07B5F", 50: "#E8C24A", 100: "#58B37C" }[a] || C.sky;
      s += `<rect x="${x}" y="40" width="300" height="150" rx="16" fill="${col}" stroke="#fff" stroke-width="6"/><rect x="${x + 14}" y="54" width="272" height="122" rx="10" fill="none" stroke="#ffffff99" stroke-width="3"/>`;
      s += txt(x + 150, 135, "$" + a, 64, "#fff");
      x += 320;
    } else {
      const gold = a >= 1, r = { 0.05: 46, 0.1: 56, 0.2: 66, 0.5: 70, 1: 62, 2: 52 }[a] || 56;
      const cy = 115;
      if (a === 0.5) {
        const pts = []; for (let k = 0; k < 12; k++) { const t = k / 12 * Math.PI * 2; pts.push(`${x + 75 + Math.cos(t) * r},${cy + Math.sin(t) * r}`); }
        s += `<polygon points="${pts.join(" ")}" fill="${C.silver}" stroke="${C.silverD}" stroke-width="5"/>`;
      } else s += `<circle cx="${x + 75}" cy="${cy}" r="${r}" fill="${gold ? C.gold : C.silver}" stroke="${gold ? C.goldD : C.silverD}" stroke-width="5"/>`;
      s += txt(x + 75, cy + 12, a >= 1 ? "$" + a : Math.round(a * 100) + "c", a >= 1 ? 36 : 32, gold ? "#6B4A0E" : "#33414F");
      x += 165;
    }
  });
  return { w: Math.max(x + 10, 200), h: H, body: s };
};

K.barModel = v => {
  const parts = v.parts || ["?", "?"], W = 1000, H = 260, x0 = 20, bw = 960;
  const nums = parts.map(p => parseFloat(p));
  const allNum = nums.every(n => !isNaN(n)) && !isNaN(parseFloat(v.whole));
  let s = `<rect x="${x0}" y="20" width="${bw}" height="90" rx="14" fill="${C.tealL}" stroke="${C.teal}" stroke-width="5"/>` + txt(W / 2, 80, v.whole, 42, C.teal);
  let x = x0;
  const total = allNum ? parseFloat(v.whole) : parts.length;
  parts.forEach((p, i) => {
    const pw = allNum ? bw * (nums[i] / total) : bw / parts.length;
    const known = !isNaN(parseFloat(p));
    s += `<rect x="${x}" y="140" width="${pw}" height="90" rx="14" fill="${known ? C.skyL : C.lavL}" stroke="${known ? C.sky : C.lav}" stroke-width="5"/>` + txt(x + pw / 2, 200, p, 40, known ? C.sky : C.lav);
    x += pw;
  });
  return { w: W, h: H, body: s };
};

K.algorithm = v => {
  const a = v.a, b = v.b, op = v.op || "+", res = op === "+" ? a + b : a - b;
  const n = Math.max(String(a).length, String(b).length, String(Math.abs(res)).length);
  const heads = ["Ones", "Tens", "Hundreds", "Thousands", "T Th"].slice(0, n).reverse().map(h => h[0] === "T" && h !== "Tens" && h !== "T Th" ? "Th" : h === "T Th" ? "TTh" : h[0]);
  const cw = 110, W = 120 + n * cw + 40, H = 470, x0 = 120;
  let s = "";
  heads.forEach((h, i) => { s += `<rect x="${x0 + i * cw + 8}" y="16" width="${cw - 16}" height="56" rx="14" fill="${[C.indigo, C.sky, C.teal, C.mint, C.lav][(n - 1 - i) % 5]}"/>` + txt(x0 + i * cw + cw / 2, 56, h, 30, "#fff"); });
  const row = (val, y, col) => String(val).padStart(n, " ").split("").forEach((d, i) => { if (d !== " ") s += txt(x0 + i * cw + cw / 2, y, d, 76, col); });
  row(a, 165, C.navy); row(b, 265, C.navy);
  s += txt(70, 265, op === "+" ? "+" : "−", 76, C.navy);
  s += `<line x1="40" y1="300" x2="${x0 + n * cw}" y2="300" stroke="${C.navy}" stroke-width="7" stroke-linecap="round"/>`;
  s += `<line x1="40" y1="410" x2="${x0 + n * cw}" y2="410" stroke="${C.navy}" stroke-width="7" stroke-linecap="round"/>`;
  if (v.show === "answer") row(res, 385, C.mint);
  return { w: W, h: H, body: s };
};

K.roundLine = v => {
  const from = v.from, to = v.to, val = v.value, W = 1100, H = 250, x0 = 70, x1 = W - 70, y = 120;
  const span = to - from, half = from + span / 2;
  const xFor = n => x0 + ((n - from) / span) * (x1 - x0);
  let s = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${C.navy}" stroke-width="5"/>`;
  const step = span / 10;
  for (let i = 0; i <= 10; i++) {
    const n = from + i * step, x = xFor(n), major = i === 0 || i === 10 || i === 5;
    s += `<line x1="${x}" y1="${y - (major ? 30 : 16)}" x2="${x}" y2="${y + (major ? 30 : 16)}" stroke="${i === 5 ? C.lav : C.navy}" stroke-width="${major ? 5 : 3}"/>`;
    if (major) s += txt(x, y + 72, String(+n.toFixed(2)), 32, i === 5 ? C.lav : C.navy);
  }
  s += txt(xFor(half), y - 46, "halfway", 22, C.lav, 700);
  if (val !== undefined) {
    const x = xFor(val);
    s += `<circle cx="${x}" cy="${y}" r="16" fill="${C.mint}" stroke="#fff" stroke-width="4"/>` + txt(x, y - 46 - (Math.abs(x - xFor(half)) < 80 ? 34 : 0), String(val), 30, C.mint);
  }
  return { w: W, h: H, body: s };
};

K.figure = v => {
  const f = path.join(FIGS, v.file);
  return { file: f };
};

async function render(v, opts = {}) {
  if (!v || !K[v.kind]) throw new Error("unknown visual " + (v && v.kind));
  const r = K[v.kind](v);
  if (r.file) {
    const meta = await sharp(r.file).metadata();
    return { path: r.file, ar: meta.width / meta.height };
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${r.w}" height="${r.h}" viewBox="0 0 ${r.w} ${r.h}">${opts.bg ? `<rect width="100%" height="100%" fill="${opts.bg}"/>` : ""}${r.body}</svg>`;
  const hash = crypto.createHash("md5").update(svg).digest("hex").slice(0, 16);
  const out = path.join(CACHE, hash + ".png");
  if (!fs.existsSync(out)) await sharp(Buffer.from(svg), { density: 144 }).png().toFile(out);
  return { path: out, ar: r.w / r.h, svg };
}

module.exports = { render, K, picData };
