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
const THEMES = {
  cool: {
    name: "Cool", text: "17324D", muted: "5B6B7F", card: "FFFFFF",
    roles: { teal: "0F7C8C", mint: "178F76", sky: "2C74C9", indigo: "5052C9", lav: "7A5CC7" },
    tints: { teal: "E0F2F4", mint: "DFF3EC", sky: "E3EEFA", indigo: "E8E8FA", lav: "EFE9FA" },
    bg: { base: "#F4F7FB", a: "#CFEFF2", b: "#E4DCFA" },
  },
  calm: {
    name: "Calm", text: "2E3440", muted: "6B6F76", card: "FFFFFF",
    roles: { teal: "3E7F7A", mint: "5E8C6A", sky: "4F78A8", indigo: "6A5E9E", lav: "9A6B8F" },
    tints: { teal: "E3EFEE", mint: "E7EFE8", sky: "E6EDF5", indigo: "ECEAF4", lav: "F3EAF1" },
    bg: { base: "#F7F5F0", a: "#E6EFE6", b: "#EFE6DD" },
  },
  bright: {
    name: "Bright", text: "1F2A44", muted: "5D6680", card: "FFFFFF",
    roles: { teal: "0E9AA7", mint: "16A34A", sky: "2563EB", indigo: "7C3AED", lav: "DB2777" },
    tints: { teal: "DDF6F8", mint: "DCFCE7", sky: "DBEAFE", indigo: "EDE9FE", lav: "FCE7F3" },
    bg: { base: "#FFFFFF", a: "#D7F3FF", b: "#FFF1C7" },
  },
};

async function themeBackground(theme, kind = "content") {
  const t = THEMES[theme];
  const f = path.join(CACHE, `bg_${theme}_${kind}.png`);
  if (fs.existsSync(f)) return f;
  const W = 1920, H = 1080;
  const big = kind === "cover";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <radialGradient id="a" cx="${big ? 0.92 : 1}" cy="0" r="${big ? 0.75 : 0.55}"><stop offset="0" stop-color="${t.bg.a}"/><stop offset="1" stop-color="${t.bg.a}" stop-opacity="0"/></radialGradient>
      <radialGradient id="b" cx="0" cy="1" r="${big ? 0.75 : 0.55}"><stop offset="0" stop-color="${t.bg.b}"/><stop offset="1" stop-color="${t.bg.b}" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="${t.bg.base}"/>
    <rect width="${W}" height="${H}" fill="url(#a)"/><rect width="${W}" height="${H}" fill="url(#b)"/>
  </svg>`;
  await sharp(Buffer.from(svg)).png().toFile(f);
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

module.exports = { browser, ROOT, ASSETS, IMGDIR, CACHE, THEMES, themeBackground, FONT, LH, textW, linesFor, hFor, img, hasImg, icon, hash, clean };
