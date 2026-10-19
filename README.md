# Resource Engine

Builds sale-ready teaching resource packs from one content file: editable slides, levelled worksheets with answer keys, assessment, flip book, word wall, posters, teacher guide, plus the listing kit (cover tiles, preview PDF, listing text) and a zip ready to upload.

## Build a product
```bash
npm install
node build.js units/s2-fractions-a.json            # theme: --theme cool | calm | bright
```
Output goes to `dist/<unit id>/`. Listing files and the upload zip are in `dist/<unit id>/Listing/`.

## Make a new product
1. Write `units/<id>.json` following `SCHEMA.md` (content only; the engine draws everything).
2. `node qa/check.js units/<id>.json --answers` lists every question with its answer for checking.
3. `node build.js units/<id>.json`
4. Look at the pages: `qa/grid.sh dist/<id>/<file>.pdf prefix` makes contact sheets in `.cache/grid/`.

## Layout
| Path | What |
|---|---|
| `SCHEMA.md` | The content format for a unit |
| `docs/STYLE_GUIDE.md` | The standard every product must meet |
| `docs/research/` | Market sweep and maths evidence base |
| `src/deck.js` | Slides (PowerPoint) |
| `src/printables.js` | Worksheets, answer key, assessment, flip book, word wall, posters |
| `src/guide.js` | Teacher guide (Word) |
| `src/listing.js` | Cover tiles, preview PDF, listing text |
| `src/visuals.js` | Exact maths diagrams (fraction strips, number lines, walls...) |
| `qa/` | Unit checker, fit and overlap checks, contact sheets |
| `assets/` | Fonts (OFL), Fluent 3D emoji (MIT) |

Needs Node 18+, Python 3, LibreOffice (for slide previews) and poppler (`pdftoppm`).
