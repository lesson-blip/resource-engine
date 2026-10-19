// Writes the unit's theme colours into ppt/theme/theme1.xml so PowerPoint's colour picker shows our palette.
const fs = require("fs");
const JSZip = require("jszip");
async function applyTheme(file, T) {
  const zip = await JSZip.loadAsync(fs.readFileSync(file));
  const name = Object.keys(zip.files).find(n => /^ppt\/theme\/theme1\.xml$/.test(n));
  if (!name) return;
  let x = await zip.file(name).async("string");
  const r = T.roles;
  const map = { dk1: T.text, lt1: "FFFFFF", dk2: T.text, lt2: "F4F7FB", accent1: r.teal, accent2: r.mint, accent3: r.sky, accent4: r.indigo, accent5: r.lav, accent6: T.muted, hlink: r.sky, folHlink: r.lav };
  for (const [k, v] of Object.entries(map)) {
    x = x.replace(new RegExp(`<a:${k}>[\\s\\S]*?</a:${k}>`), `<a:${k}><a:srgbClr val="${v}"/></a:${k}>`);
  }
  x = x.replace(/<a:clrScheme name="[^"]*"/, `<a:clrScheme name="${T.name}"`);
  zip.file(name, x);
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}
module.exports = { applyTheme };
