// Shared helpers: paths, themes, text measuring, images.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "assets");
const IMGDIR = path.join(ASSETS, "img");
const CACHE = path.join(ROOT, ".cache");
fs.mkdirSync(CACHE, { recursive: true });

// ---------- themes ----------
// Every theme maps the same five role colours, so content never names a hex value.
// Each theme: role colours carry white bold text of 16 pt or more (WCAG large text, checked >= 3:1; most are >= 4.5:1), tints are box fills.
// Roles: teal = unit colour, sky = I do, mint = We do, lav = You do, indigo = extra.
// pattern: background texture on every slide. deco: corner decoration on lesson title slides only,
// kept inside the top corners (x < 2.6 in or x > 10.7 in, y < 2 in), which those slides never use.
const THEMES = {
  ocean: {
    name: "Ocean", blurb: "Cool blues and teal", text: "17324D", muted: "5B6B7F", card: "FFFFFF",
    roles: { teal: "0F7C8C", mint: "17806B", sky: "2C6FBF", indigo: "4F51C2", lav: "7457C0" },
    tints: { teal: "E0F2F4", mint: "DFF3EC", sky: "E3EEFA", indigo: "E8E8FA", lav: "EFE9FA" },
    bg: { base: "#F4F7FB", a: "#CFEFF2", b: "#E4DCFA" }, pattern: null, deco: { kind: "pics", pics: ["spiral_shell", "water_wave"] },
  },
  pastel: {
    name: "Soft Pastel", blurb: "Lilac, blush, mint and butter", text: "433A58", muted: "6E6680", card: "FFFFFF",
    roles: { teal: "7A63B8", mint: "3B7F62", sky: "4F76B0", indigo: "6A58A8", lav: "B4537A" },
    tints: { teal: "EEE8F8", mint: "E2F3EA", sky: "E5EDF8", indigo: "F8F0D2", lav: "FBE6EE" },
    bg: { base: "#FFF9F6", a: "#F3E3F6", b: "#FBE9D6" }, pattern: { kind: "dots", colour: "#F1D7E0" }, deco: { kind: "pics", pics: ["tulip", "blossom"] },
  },
  gumleaf: {
    name: "Gum Leaf", blurb: "Eucalyptus, sage and wattle", text: "2E4640", muted: "5F6F69", card: "FFFFFF",
    roles: { teal: "4A7A6B", mint: "5B7845", sky: "4A6F8C", indigo: "3F5E55", lav: "94604F" },
    tints: { teal: "E4EEE8", mint: "ECF1E2", sky: "E4ECF1", indigo: "FAF0D2", lav: "F5E7E0" },
    bg: { base: "#F7F5EF", a: "#DFEADF", b: "#F4EACF" }, pattern: null, deco: { kind: "pics", pics: ["koala", "herb"] },
  },
  boho: {
    name: "Boho Neutral", blurb: "Terracotta, sage and oat", text: "4A3A2F", muted: "75665A", card: "FFFFFF",
    roles: { teal: "A55F47", mint: "617A55", sky: "557482", indigo: "7E6148", lav: "9C5A62" },
    tints: { teal: "F6E6DB", mint: "EAEFE3", sky: "E4ECEF", indigo: "F7EDD5", lav: "F5E4E4" },
    bg: { base: "#FBF7F1", a: "#F2E2D3", b: "#E5EBDD" }, pattern: null, deco: { kind: "arcs", colours: ["#EBCF96", "#C9D3BA", "#E6BFA6"] },
  },
  creamgold: {
    name: "Cream and Gold", blurb: "Clean cream with gold detail", text: "2C2A30", muted: "6A655C", card: "FFFFFF",
    roles: { teal: "A57E2C", mint: "4F6E5A", sky: "45607E", indigo: "36394D", lav: "855E66" },
    tints: { teal: "F4EBD6", mint: "E8EFE9", sky: "E7ECF2", indigo: "ECEBF0", lav: "F3E8EA" },
    bg: { base: "#FBF8F1", a: "#F3E9D2", b: "#F6F1E6" }, pattern: { kind: "frame", colour: "#C9A75A" }, deco: { kind: "goldarc", colour: "#C9A75A" },
  },
  blushsage: {
    name: "Blush and Sage", blurb: "Soft pink with sage green", text: "3E3438", muted: "6F6468", card: "FFFFFF",
    roles: { teal: "B04F6E", mint: "557A5A", sky: "4F7192", indigo: "6E5A86", lav: "9A4F5E" },
    tints: { teal: "FBE5EC", mint: "E5EFE4", sky: "E6EDF4", indigo: "EFE9F4", lav: "F8E1E5" },
    bg: { base: "#FFF8F7", a: "#FADDE4", b: "#DDE9DA" }, pattern: null, deco: { kind: "pics", pics: ["blossom", "seedling"] },
  },
  blushnavy: {
    name: "Blush and Navy", blurb: "Soft pink with deep navy", text: "1F2A44", muted: "5D6680", card: "FFFFFF",
    roles: { teal: "2C3D63", mint: "3F766E", sky: "3A68A6", indigo: "4A3F7A", lav: "AE4D69" },
    tints: { teal: "E7EBF4", mint: "E2EFEC", sky: "E4ECF7", indigo: "ECE9F5", lav: "FBE5EB" },
    bg: { base: "#FFF9F8", a: "#F8DCE3", b: "#DCE3F1" }, pattern: null, deco: { kind: "arcs", colours: ["#F3C9D3", "#C8D3E8", "#F7E1E6"] },
  },
};
THEMES.cool = THEMES.ocean; // old name

// Level names. Students see `names` with a small dot marker (1, 2 or 3 dots); teachers see `teacher`.
// Default "plain" follows Sullivan: everyone aims for the main task; enabling and extending versions sit either side.
// "chillies" is an option for teachers who like Mild/Medium/Spicy.
const LEVEL_STYLES = {
  plain: { names: ["Get started", "Main task", "Go further"], marker: "dots",
    blurbs: ["An easier way into the same maths. Use materials and pictures.", "Where everyone aims to be. Try it on your own first.", "Ready for more? Explain, prove or find all the answers."] },
  chillies: { names: ["Mild", "Medium", "Spicy"], marker: "chillies",
    blurbs: ["Start here to build confidence. Use materials and pictures.", "The main task. Try it on your own first.", "Ready for more? Explain, prove or find all the answers."] },
};
const TEACHER_LEVELS = ["Support", "Core", "Extension"];
const levels = unit => LEVEL_STYLES[(unit && unit.levelStyle) || "plain"] || LEVEL_STYLES.plain;
const THEME_KEYS = ["ocean", "pastel", "gumleaf", "boho", "creamgold", "blushsage", "blushnavy"];

function lum(hex) { const c = hex.replace("#", "").match(/../g).map(h => parseInt(h, 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
function contrast(a, b) { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); }

async function themeBackground(theme, kind = "content") {
  const t = THEMES[theme];
  const f = path.join(CACHE, `bg2_${theme}_${kind}.png`);
  if (fs.existsSync(f)) return f;
  const W = 1920, H = 1080, PX = 144; // 144 px per inch
  const big = kind !== "content";
  let pat = "";
  if (t.pattern && t.pattern.kind === "dots") pat = `<pattern id="d" width="36" height="36" patternUnits="userSpaceOnUse"><circle cx="18" cy="18" r="3.2" fill="${t.pattern.colour}"/></pattern><rect width="${W}" height="${H}" fill="url(#d)"/>`;
  if (t.pattern && t.pattern.kind === "frame") pat = `<rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="22" fill="none" stroke="${t.pattern.colour}" stroke-width="3"/>`;
  let deco = "";
  const d = t.deco || {};
  if (kind === "title" && d.kind === "arcs") {
    const arc = (cx, cy, r0) => d.colours.map((c, i) => `<circle cx="${cx}" cy="${cy}" r="${r0 + i * 34}" fill="none" stroke="${c}" stroke-width="22"/>`).reverse().join("");
    deco = arc(0, 0, 120) + arc(W, 0, 120);
  }
  if (kind === "title" && d.kind === "goldarc") deco = `<circle cx="0" cy="0" r="230" fill="none" stroke="${d.colour}" stroke-width="3"/><circle cx="0" cy="0" r="250" fill="none" stroke="${d.colour}" stroke-width="1.5"/><circle cx="${W}" cy="0" r="230" fill="none" stroke="${d.colour}" stroke-width="3"/><circle cx="${W}" cy="0" r="250" fill="none" stroke="${d.colour}" stroke-width="1.5"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="a" cx="${big ? 0.92 : 1}" cy="0" r="${big ? 0.75 : 0.55}"><stop offset="0" stop-color="${t.bg.a}"/><stop offset="1" stop-color="${t.bg.a}" stop-opacity="0"/></radialGradient>
      <radialGradient id="b" cx="0" cy="1" r="${big ? 0.75 : 0.55}"><stop offset="0" stop-color="${t.bg.b}"/><stop offset="1" stop-color="${t.bg.b}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${t.bg.base}"/>
    <rect width="${W}" height="${H}" fill="url(#a)"/><rect width="${W}" height="${H}" fill="url(#b)"/>${pat}${deco}
  </svg>`;
  let im = sharp(Buffer.from(svg));
  if (kind === "title" && d.kind === "pics") {
    const comp = [];
    const sz = Math.round(1.25 * PX);
    for (const [i, k] of d.pics.entries()) {
      const fp = path.join(IMGDIR, k + ".png");
      if (!fs.existsSync(fp)) continue;
      const buf = await sharp(fp).resize(sz, sz).rotate(i ? 14 : -14, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      const m = await sharp(buf).metadata();
      comp.push({ input: buf, left: i ? W - m.width - Math.round(0.3 * PX) : Math.round(0.3 * PX), top: Math.round(0.2 * PX) });
    }
    im = sharp(await im.png().toBuffer()).composite(comp);
  }
  await im.png().toFile(f);
  return f;
}

// ---------- text measuring (real Nunito Sans glyph widths) ----------
const WID = require(path.join(ASSETS, "widths.json"));
const FONT = "Nunito Sans";
const LH = 1.364;
function textW(str, pt, bold) {
  const t = WID[bold ? "Bold" : "Regular"]; let u = 0;
  for (const ch of String(str)) u += t[ch.codePointAt(0)] || 560;
  return u / 1000 * pt / 72 * 1.04;
}
function linesFor(text, w, pt, bold, mh = 0.40) {
  const usable = Math.max(0.3, w - mh);
  let lines = 0;
  const sp = textW(" ", pt, bold);
  for (const para of String(text).split("\n")) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = 0, l = 1;
    for (const wd of words) {
      const ww = textW(wd, pt, bold);
      if (cur === 0) cur = ww; else if (cur + sp + ww <= usable) cur += sp + ww; else { l++; cur = ww; }
    }
    lines += l;
  }
  return lines;
}
const hFor = (text, w, pt, bold, pad = 0.24) => linesFor(text, w, pt, bold) * pt * LH / 72 + pad;

// ---------- images ----------
const img = k => { const f = path.join(IMGDIR, k + ".png"); if (!fs.existsSync(f)) throw new Error("missing image " + k); return f; };
const hasImg = k => k && fs.existsSync(path.join(IMGDIR, k + ".png"));

const React = require("react");
const RDS = require("react-dom/server");
const fa = require("react-icons/fa6");
const ICONS = {
  ido: fa.FaPersonChalkboard, wedo: fa.FaPeopleGroup, youdo: fa.FaPencil, target: fa.FaBullseye, list: fa.FaListCheck,
  timer: fa.FaStopwatch, comments: fa.FaComments, link: fa.FaLink, box: fa.FaBoxOpen, clock: fa.FaClock, check: fa.FaCheck,
  xmark: fa.FaXmark, question: fa.FaQuestion, bulb: fa.FaLightbulb, home: fa.FaHouse, star: fa.FaStar, eye: fa.FaEye,
};
const iconCache = {};
async function icon(name, color, fg = "FFFFFF") {
  const key = name + color + fg;
  if (iconCache[key]) return iconCache[key];
  const Comp = ICONS[name];
  if (!Comp) throw new Error("icon " + name);
  const inner = RDS.renderToStaticMarkup(React.createElement(Comp, { size: 120, color: "#" + fg }));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><circle cx="128" cy="128" r="128" fill="#${color}"/><g transform="translate(68,68)">${inner}</g></svg>`;
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return (iconCache[key] = "image/png;base64," + buf.toString("base64"));
}

const hash = s => crypto.createHash("md5").update(s).digest("hex").slice(0, 12);
const clean = s => String(s == null ? "" : s).replace(/—/g, ", ").replace(/–/g, " to ");

async function browser() {
  const { chromium } = require("playwright");
  try { return await chromium.launch(); }
  catch (e) {
    const alt = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";
    if (fs.existsSync(alt)) return chromium.launch({ executablePath: alt });
    throw e;
  }
}

module.exports = { browser, ROOT, ASSETS, IMGDIR, CACHE, THEMES, THEME_KEYS, LEVEL_STYLES, TEACHER_LEVELS, levels, contrast, themeBackground, FONT, LH, textW, linesFor, hFor, img, hasImg, icon, hash, clean };
