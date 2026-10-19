// Builds a complete, ready-to-list product from one unit file.
// usage: node build.js units/<id>.json [--theme cool|calm|bright] [--skip-listing]
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const args = process.argv.slice(2);
const unitFile = args.find(a => a.endsWith(".json"));
if (!unitFile) { console.log("usage: node build.js units/<id>.json [--theme cool|calm|bright]"); process.exit(1); }
const theme = (args[args.indexOf("--theme") + 1] && args.includes("--theme")) ? args[args.indexOf("--theme") + 1] : "cool";
const UNIT = JSON.parse(fs.readFileSync(unitFile, "utf8"));
const t = UNIT.title.replace(/[^A-Za-z0-9]+/g, "_");
const DIR = path.join(__dirname, "dist", UNIT.id);
const WORK = path.join(DIR, ".work");
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(WORK, { recursive: true });
const run = (cmd, a, opts = {}) => { const o = execFileSync(cmd, a, Object.assign({ encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }, opts)); process.stdout.write(o.split("\n").filter(l => l.trim()).map(l => "  " + l).join("\n") + "\n"); return o; };
const step = s => console.log("\n> " + s);

step("Checking the unit file");
run("node", [path.join(__dirname, "qa", "check.js"), unitFile, "--quiet"]);
step("Images");
run("python3", [path.join(__dirname, "src", "images.py"), unitFile]);
step("Slides");
const deck = path.join(DIR, `${t}_Slides.pptx`);
const out = run("node", [path.join(__dirname, "src", "deck.js"), unitFile, deck, theme]);
fs.writeFileSync(path.join(WORK, "slidecount.txt"), (out.match(/: (\d+) slides/) || [0, 0])[1]);
run("node", [path.join(__dirname, "src", "embed.js"), deck]);
run("python3", [path.join(__dirname, "src", "finalize.py"), deck]);
step("Printables");
run("node", [path.join(__dirname, "src", "printables.js"), unitFile, DIR]);
step("Teacher guide");
run("node", [path.join(__dirname, "src", "guide.js"), unitFile, path.join(DIR, `${t}_Teacher_Guide.docx`)]);
if (!args.includes("--skip-listing")) {
  step("Listing (cover tiles, preview, listing text)");
  run("python3", ["/mnt/skills/public/pptx/scripts/office/soffice.py", "--headless", "--convert-to", "pdf", "--outdir", WORK, deck]);
  fs.renameSync(path.join(WORK, `${t}_Slides.pdf`), path.join(WORK, "deck.pdf"));
  run("node", [path.join(__dirname, "src", "listing.js"), unitFile, DIR]);
}
step("Packaging");
const licence = `${UNIT.title}: licence and credits

One licence covers one teacher and their own students. Please do not share, resell or upload this resource or any part of it.

Pictures: Microsoft Fluent Emoji, MIT licence (https://github.com/microsoft/fluentui-emoji).
Fonts: Nunito Sans and Edu NSW ACT Foundation, SIL Open Font License 1.1 (included in this folder's Fonts readme).
Syllabus outcomes and content: NSW Mathematics K-10 Syllabus, NSW Education Standards Authority. Not endorsed by NESA or the NSW Department of Education.

If the slides show a different font, install Nunito Sans (free, Google Fonts).
`;
fs.writeFileSync(path.join(DIR, "Read_Me_First.txt"), licence);
const files = fs.readdirSync(DIR).filter(f => !f.startsWith(".") && f !== "Listing");
run("zip", ["-qr", path.join(DIR, "Listing", `${t}_PRODUCT.zip`), ...files], { cwd: DIR });
console.log("\nDone: " + path.relative(__dirname, DIR));
for (const f of files.concat(fs.readdirSync(path.join(DIR, "Listing")).map(f => "Listing/" + f))) console.log("  " + f);
