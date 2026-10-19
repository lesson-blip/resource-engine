const fs = require("fs"); const path = require("path");
const PPTXEmbedFonts = require("pptx-embed-fonts").default || require("pptx-embed-fonts");
const JSZip = require("jszip");
(async () => {
  const file = process.argv[2];
  const fdir = path.join(__dirname, "..", "assets", "fonts");
  const e = new PPTXEmbedFonts();
  await e.load(fs.readFileSync(file));
  const ab = b => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  await e.addFontFromTTF("Nunito Sans", ab(fs.readFileSync(path.join(fdir, "NunitoSans-Regular.ttf"))));
  await e.addFontFromTTF("Nunito Sans", ab(fs.readFileSync(path.join(fdir, "NunitoSans-Bold.ttf"))));
  const out = await e.save();
  // merge the two embeddedFont entries into one (regular + bold) and give a sans-serif fallback hint
  const zip = await JSZip.loadAsync(out);
  let pres = await zip.file("ppt/presentation.xml").async("string");
  const re = /<p:embeddedFont>(?:(?!<\/p:embeddedFont>).)*<\/p:embeddedFont>/gs;
  const ents = pres.match(re) || [];
  if (ents.length === 2) {
    const rid2 = ents[1].match(/<p:regular r:id="([^"]+)"/)[1];
    const merged = ents[0].replace("</p:embeddedFont>", `<p:bold r:id="${rid2}"/></p:embeddedFont>`)
      .replace(/<p:font typeface="Nunito Sans"[^>]*\/>/, '<p:font typeface="Nunito Sans" pitchFamily="34" charset="0"/>');
    pres = pres.replace(ents[0], merged).replace(ents[1], "");
  } else if (ents.length === 1) {
    const rels = await zip.file("ppt/_rels/presentation.xml.rels").async("string");
    const ids = [...rels.matchAll(/Id="([^"]+)" Target="fonts\/[^"]+\.fntdata"/g)].map(m => m[1]);
    const reg = ents[0].match(/<p:regular r:id="([^"]+)"/)[1];
    const other = ids.find(i => i !== reg);
    const merged = ents[0].replace("</p:embeddedFont>", other ? `<p:bold r:id="${other}"/></p:embeddedFont>` : "</p:embeddedFont>")
      .replace(/<p:font typeface="Nunito Sans"[^>]*\/>/, '<p:font typeface="Nunito Sans" pitchFamily="34" charset="0"/>');
    pres = pres.replace(ents[0], merged);
    console.log("bold rid", other);
  } else console.warn("embeddedFont count", ents.length);
  if (!/embedTrueTypeFonts/.test(pres)) pres = pres.replace("<p:presentation ", '<p:presentation embedTrueTypeFonts="1" ');
  zip.file("ppt/presentation.xml", pres);
  // sans-serif fallback hint on every run and the theme
  for (const n of Object.keys(zip.files)) {
    if (!/^ppt\/(slides\/slide\d+|slideLayouts\/slideLayout\d+|slideMasters\/slideMaster\d+|theme\/theme\d+|notesSlides\/notesSlide\d+)\.xml$/.test(n)) continue;
    let x = await zip.file(n).async("string");
    x = x.replace(/<a:(latin|ea|cs) typeface="Nunito Sans"(?![^>]*pitchFamily)/g, '<a:$1 typeface="Nunito Sans" pitchFamily="34" charset="0"');
    zip.file(n, x);
  }
  fs.writeFileSync(file, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
  console.log("embedded");
})();
