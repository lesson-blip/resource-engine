# Style guide v1

The standard every product from this engine must meet. Built from: best-selling TpT products (Oct 2026 sweep), Teach Starter decks, Mathletics Series D books, The Busy Honey Bee (main Australian competitor), a live classroom trial of Word Detective (Year 3, Oct 2026), and the evidence base in `research/maths-evidence.md`. Details and sources: `research/market-notes.md`.

## 1. What we sell
- **Complete units, not loose sheets.** One topic, every lesson, everything the teacher needs. The best sellers are complete units with a teacher guide, assessment and answer keys.
- **Nothing to find or insert.** Competitors' slides tell teachers to add department resources. Ours include every resource. Say so in the listing.
- **Differentiated in every lesson,** not just the test: one main task with an easier way in and a way to go further (Sullivan's enabling and extending prompts). Teachers see Support, Core, Extension; students see Get started, Main task, Go further, marked with 1 to 3 dots, never ability labels. The top Australian TPT maths seller (Mrs Chalmers' Cherubs) sells on "Differentiated" and "3 levels" in the title, so always put both in listing titles. Chillies are an option (`levelStyle`).
- **Australian first:** NSW syllabus wording for content, Australian spelling, A$ prices in Australian stores. Name the NSW focus area in the title. Mention where the unit fits a school's scope and sequence in our own words, never copying department unit text.
- **Honest claims only:** "classroom tested" only when it was; never invent reviews or results.

## 2. Teaching design (every lesson)
Learning intention and success criteria → warm-up (retrieval of earlier content) → explicit teaching (I do, We do) with concrete, pictorial, then symbols → examples and close non-examples → turn and talk → hinge question (4 options, each wrong option a real misconception) with a reveal slide → Show me (mini whiteboards) with an answer slide → activity → Choose your challenge → Discuss and connect → exit ticket.

- Plain sentence starters beat abstract instructions. (Trial: "This IS it / This is NOT it" confused Year 3; "I would / would NOT use my word for..." worked.)
- Give Year 3 more writing space than you think: lines at least 9.5 to 11 mm.
- Never label groups by ability. Students choose a level and can move.

## 3. Slides
- PowerPoint, 16:9, opens in Google Slides. Nunito Sans embedded. All text sits in rounded boxes sized to the text; boxes never overlap; nothing off-slide (`src/finalize.py` checks).
- Header: Lesson pill, title, mode tag (I do sky, We do mint, You do lavender). Footer: unit and lesson label, Menu button.
- Cover is a clickable lesson menu. Slide 2 explains the modes and levels. Slide 3 is the word wall.
- Themes (see `docs/research/theme-notes.md`): Ocean (default), Soft Pastel, Gum Leaf, Boho Neutral, Cream and Gold, Blush and Sage, Blush and Navy. Decoration only in the top corners of lesson title slides; diagrams take the theme colours; white text on role colours meets WCAG large-text contrast. Never loud 90s colours.
- Real images or Microsoft Fluent 3D emoji, never clip art or amateur drawings. Maths diagrams are drawn exactly by `src/visuals.js`.
- Teacher notes and answers live in the slide notes.

## 4. Printables
- Page anatomy (from Mathletics): title and level badge, Name line, teaching box with a worked example, numbered questions with a/b/c parts, dotted dividers, "How did I go? Not yet / Kind of / Got it" at the bottom, footer with page number.
- One A4 page per level. Colour and black-and-white versions.
- Answer key = the same pages with answers written in the NSW school handwriting font (Edu NSW ACT Foundation).
- A "My progress" tracker page, a pre-test, an assessment with self-check and an A to E rubric.
- A signature make-and-keep item (flip book) and a word wall.

## 5. Listing
- Five square cover tiles: (1) huge 2 to 4 word title, product shown fanned on a soft background, one bold claim, counts in the banner; (2) What's included; (3) 3 levels every lesson; (4) Teaching slides; (5) Hands-on extras.
- Best results come from adding one real photo of the printed product in use (George to take per unit).
- Preview PDF is a short sales deck: hook ("Would you love to..."), what's included, inside a lesson, sample pages watermarked PREVIEW, why it works (research), terms of use.
- Listing text: intro, bold headings, bullet lists, lessons, syllabus outcomes, formats, tags.
- Price: single unit A$15 to A$19 (US$9 to US$12); term bundle; multi-teacher licences.

## 6. Copy rules
Plain teacher voice. No em dashes or heavy dashes. No hype words. Short sentences for students. Australian spelling (colour, metre, practise as a verb).

## 7. Legal
- Content is original. Never copy text from department sample units, Teach Starter, Twinkl, TpT products or textbooks. Use their structure and ideas only.
- Fluent Emoji are MIT; fonts are SIL OFL; credit both. Syllabus outcome codes and short outcome text © NESA, credited, with "not endorsed by NESA or the NSW Department of Education".
- Check with your employer before selling anything built from a school program.

## 8. Slide furniture (added 20 Oct 2026, from The Busy Honey Bee Stage 3 fractions)
- Footer shows the lesson stage: Beginning the lesson, Core lesson, Concluding the lesson (NSW sample unit structure).
- Activity and levels slides carry a "Resource N" pill; printables are numbered the same way (`K.resources`).
- Worked example steps are in the NSW school handwriting font (Edu NSW ACT Foundation, embedded, set 25% larger).
- Show me slides carry a mini whiteboard icon. Templates include a grid paper working space.
- Slide 2 is Unit at a glance; the cover links to At a glance, How it works, Word wall and Toolkit. Toolkit slides have pieces to drag in edit mode (`unit.toolkit`). Five blank templates sit before the credits.

## 9. Photos (added 20 Oct 2026)
- Source: Pexels (licence allows use inside sold templates). `node src/photos.js search "<query>"` makes a contact sheet; choose by id and record it in `unit.photos` with a note on what maths it shows. Every photo is checked by eye: parts called equal must look equal, and captions only claim what is visible.
- Photo check (before every release): view each real-life slide at full size. Every number in a caption must be countable in the photo as cropped; "equal" only where parts look equal; set `"whole": true` on an item when cropping would hide parts the caption counts. No claims the photo cannot show (e.g. "this slice is one eighth" of a cake we cannot see).
- Lesson title slides show `lesson.photo`. `lesson.reallife` adds a "... in real life" slide after the LI/SC slide (1 to 3 photos with captions and a talk question).
- `unit.people` are cut out (rembg, local) and stand beside Turn and talk and Discuss and connect slides. No school logos or brand names on clothing.
- Photographers are credited on the Thank you slide and in the guide. The API key lives in `.env` (git-ignored).
