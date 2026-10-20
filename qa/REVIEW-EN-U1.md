# Independent QA review: s2-en-a-u1 (Narrative and Character, Fantastic Mr Fox)

Reviewed 20 Oct 2026 by an independent reviewer (NSW Stage 2 teacher and copyright editor lens).

What I checked:
- the unit file `units/s2-en-a-u1.json`: all 20 lessons, all 20 skills, the assessment, vocab, the copy and the guide
- the Department unit `.cache/dept-unit-s2a-u1.md`: Component B lessons 1 to 20, the Component A teaching guides for Weeks 1 to 5, and Resources 1 to 13
- the slide PDFs `b.pdf` and `a.pdf`, using the contact sheets plus zoomed pages
- every built PDF in `dist/s2-en-a-u1/`: Worksheets, Component A Printables, Answer Key, Assessment, Posters, Exit Tickets and Word Wall
- the Teacher Guide docx (text only) and `Listing/Narrative_and_Character_Listing.md`

I did not edit the unit or the engine.

## Verdict: NOT READY today. READY AFTER FIXES

The good news first. The sequence follows the Department unit closely. Every Department set piece is there: the slow reveal, protocols, Somebody Wanted But So Then, the story map, conscience alley, the narrative arc for the climax, six types of resolution, the class vote, and revising vs editing. No sentence from Fantastic Mr Fox is reproduced. Every locator is 4 words or fewer. Grapheme, syllable and phoneme facts are almost all correct.

What stops it shipping:
- **A student poster still has maths wording.**
- **Two printables can't be used for the task they serve:**
  - the "Picture a farmer" page has no drawing space
  - the narrative arc planner has tiny boxes
- **The Lesson 13 and 14 model texts closely paraphrase the Department's Bertha model.** They follow it beat by beat.
- **The person cut-out covers text** on the Discuss slides.
- **Answers print over the question text** in the answer key.
- **The listing makes claims the pack does not meet.**

All of these are fixable without restructuring.

Counts: **High 9, Medium 17, Low 22.**

Severity key:
- High: fix before listing.
- Medium: fix before listing if at all possible.
- Low: polish or v1.1.

---

## HIGH

**H1. Posters PDF p1, "Choose your challenge": maths text in an English pack.**
The poster reads "An easier way into the same maths. Use materials and pictures." and "Stuck? Read it again. Draw it. Use materials. Try a smaller number. Ask a partner."
- Source: `src/kit.js:70` (blurbs) and `src/printables.js:279` (Stuck? box). Both are hard-coded for maths.
- The same maths wording is in `src/listing.js:85` and `:89`, and in `src/guide.js:72`. Check that none of these reach English output.
- Fix: make the blurbs subject-aware. For English use:
  - Get started: "An easier way into the same task. Use the word bank, sentence starters or a drawing."
  - Main task: "Where everyone aims to be. Try it on your own first." (keep)
  - Go further: "Ready for more? Add detail, explain your choices or try a new technique."
  - Stuck?: "Reread the model. Say your sentence to a partner first. Use the word bank. Write one sentence at a time. Ask a partner."

**H2. Worksheets p5, "Picture a farmer" (L2): no drawing space.**
The lesson task is "Draw your farmer and add 4 labels from the text". The page has a "My plan" box, six writing lines and a checklist. Half the page is blank, and there is nowhere to draw.
- Fix: give this page a large framed drawing box (about 60% of the page) with "Label 4 key words from the text and 2 of your own" around it. Then add 4 lines underneath for Go further.
- This needs a `draw: true` option on the `writing` template, or a small new `drawLabel` organiser.

**H3. Worksheets p38 "Narrative arc planner" (L16) and p37 "Narrative arc poster" (L13): not usable as built.**
- The 5 boxes are tiny: 2 to 3 short lines each.
- The dashed arc doesn't join the boxes. It starts below Orientation and runs off the page past Resolution.
- About 60% of the page is white space.
- The L16 model plan has 6 parts (Orientation, Problem, Try 1, Try 2, Climax, Resolution), and the levels slide asks for "2 or 3 tries that fail". The planner has no room for tries.
- Fix: rebuild the planner as a full-page rising line with 6 large boxes (about 5 lines each): Orientation, Problem, Try 1, Try 2 (Try 3 optional), Climax, Resolution. Add a tick row for resolution type (Happy, Funny, Surprise, Lesson, Cliffhanger, Circular).
- Fix: for the poster, make the boxes larger with one-line meanings and the arc joined. Add the subtitle "Freytag's pyramid" (see M14).

**H4. L13 model "I do: someone is coming" closely paraphrases the Department's Bertha model (Dept L13, activity 159).**
No sentence is copied, but the beats and several phrasings match one for one. This breaks the house rule "Never copy wording from NSW DoE sample units", and the "Original model texts" claim in the listing.

| Department | Pack |
|---|---|
| "Mr Fox pointed towards 6, large bags ... 'Quick!' said Mr Fox. 'Hide behind here!'" | "Mr Fox pointed at a tall stack of crates. 'Hide!' he hissed." |
| "Peeking out from their hiding place, they saw Betty's sister Bertha standing in the doorway." | "Through a crack, they saw Farmer Pip in the doorway" |
| "took 4, large steps towards them" | "took three slow steps towards the crates" |
| "heavy footsteps coming towards the barn door" / "Mr Fox held his breath" | "Heavy boots thudded closer and closer" / "held their breath" |

Replacement parts. Keep the labels and use the same markup style:
- Warning: `[adv:Suddenly], the latch rattled. Badger froze with a pear in his paw.`
- Closer: `A yellow circle of lantern light [verb:swept] [adv:across the shelves]. Someone was humming.`
- Hide: `The Small Foxes [verb:dived] [adv:into an empty pumpkin crate]. Badger squashed himself [adv:under the bench].`
- Who is it?: `It was Farmer Pip in her dressing gown, and Biscuit was trotting [adv:beside her].`
- Closer still: `Biscuit's nose [verb:twitched]. She padded [adv:straight towards the crate].`

Also update the L13 `examples` yes item "The light swung towards them." It can stay as is, because it is generic. Change the `notes` to: "Point out each small step and the compound sentence in the last part."

**H5. L14 model "I do: the danger leaves" closely paraphrases the Department's Bertha resolution (Dept L14, activity 165).**

| Department | Pack |
|---|---|
| "She reached for the eggs directly above Mr Fox's head." | "She reached for the crate right above their heads." |
| "Mr Fox could feel Badger nervously shaking beside him." | "Badger trembled beside Mr Fox." |
| "'How many eggs ...' muttered Bertha." | "'What is it, girl?' muttered Pip." |
| "Bertha's footsteps faded." | "The footsteps faded." |
| "'Quick!' said Mr Fox. 'Grab your eggs and run for it!'" | "'Now!' whispered Mr Fox. 'Grab your pears and run!'" |

Replacement parts (these follow on from the H4 replacement):
- Danger closer: `Biscuit sniffed the crate [adv:from end to end]. A low growl rumbled [adv:in her throat].`
- Animals react: `Inside the crate, the Smallest Fox squeezed his eyes shut. Nobody moved a whisker.`
- Dialogue: `'Probably just a possum,' yawned Pip. She tapped the lid [adv:with the lantern].`
- Near miss: `The lid wobbled. A pumpkin rolled off the top and thumped [adv:onto the floor]!`
- Distraction: `[adv:Just then], the wind banged the shed door, and Biscuit raced outside, barking. 'Biscuit! Come back here!' Pip hurried [adv:after her dog].`
- Safe: `The barking grew fainter and fainter. Soon there was only the sound of rain. 'That was close,' breathed Mr Fox.`

Other changes for consistency:
- Update the L14 teacherNotes: "In the model, the wind bangs the door and Biscuit runs off barking, so Pip leaves without finding the animals."
- Optionally, change the L14 hinge option "Pip lifted the lantern." to "Pip tapped the lid."

**H6. Every Component B Discuss slide: the student cut-out covers the Connect text.**
Confirmed on b.pdf p19 (L1: "...opens with an orient[ation]" is hidden behind the girl) and p42 (L2: "made infer[ences]" is hidden behind the boy). The contact sheets show the same thing on L10 and L11, and it looks systematic.
- Fix: in the discuss layout, either:
  - stop the Connect box at the left edge of the person image, or
  - place the person above the Connect box (bottom-right, clear of the box), or
  - drop the person when `connect` is longer than about 60 characters.

**H7. Answer key: answers print over the question text.**
Seen on:
- Answer key p1, Q2: the answer "Answers will vary: look for a describing adjective such as huge or orange" overprints "Write a describing word for each noun".
- p11 (Setting description, Main task), Q1: the see/hear/smell answers collide.
- the assessment answer page, Q1(b): the Setting answer runs into the Hint of a problem answer.
- the assessment answer page, Q11: the adverbial phrase answers overprint the parts.

Two fixes, both worth doing:
- **Engine:** when a part answer is wider than its answer line, wrap it below the line.
- **Content:** shorten part answers to what fits:
  - L3 Support Q2: "e.g. huge, orange" and "e.g. sly, hungry"
  - L12 Main task Q1: "e.g. shiny jars", "e.g. a creaking floorboard", "e.g. smoky ham"
  - Assessment Q1 Setting: "a burrow under a gum tree"; Hint: "the grass is all eaten"

**H8. Listing claims the pack does not meet** (`copy.everyLesson`, `copy.included`, `copy.hook` and the built Listing.md).
- "15 differentiated worksheets in 3 levels". There are **7** levelled worksheets: l3, l4, l6, l12, l13, a6, a10. That is 21 levelled pages.
  - Fix: "7 differentiated worksheets in 3 levels (21 pages) with an answer key, plus 30+ organisers, planners and writing pages".
- "Every lesson includes ... Model writing ... Co-constructed success criteria and Tell, Ask, Give peer feedback ... Slow reveal or mentor text slides". Per lesson:
  - model writing is missing in L1, 2, 6, 9, 10, 11 and 15
  - TAG is missing in 13 of the 20 lessons
  - L5, 7, 16, 18, 19 and 20 have no mentor or reveal slide
  - Fix: retitle the list "Lessons include", or "Every lesson includes: learning intention and success criteria; a warm-up; explicit teaching; turn and talk; a main task in three levels; reflection and an exit ticket". Keep model writing, TAG and mentor slides in a separate "Writing lessons also include" list.
- "Exact page references". Page numbers depend on the edition, and the pack itself says so.
  - Fix: "chapter and page references (Puffin edition) for your own copy".
- Hook: "have Component A skills and Component B lessons ready for every day". See M15.
  - Fix: "have short Component A skill lessons and full Component B lessons ready to teach".

**H9. Component A deck file was missing from the brief's expected list. Check the final ZIP.**
`dist/` now contains `Component_A_Slides.pptx`, `Teacher_Guide.docx` and the themes folder, so this is resolved in the latest build.
- Before upload, confirm `Listing/Narrative_and_Character_PRODUCT.zip` was rebuilt *after* 11:06 and contains:
  - both decks
  - the guide
  - Fonts_Licence.txt
  - Read_Me_First.txt
  - all 7 colour themes listed in "in 7 colour themes"

  The themes folder has 6 extra themes plus the default, which makes 7. That checks out, but only if the default deck is counted.

---

## MEDIUM

**M1. Sentence-type sorts mix overlapping categories (declarative vs compound).** A compound statement is also declarative, so "declarative" is a correct answer for every compound item. That penalises a student who is right.

Affected:
- L13 warm-up
- a12 CFU and the a12 "Sentence type sort" cards
- a20 CFU and the a20 cards
- **Assessment Q5(c)**, which matters most because it is graded

Fix:
- Change the instruction to "Write: simple statement, exclamation or compound sentence".
- Change the card headings to "simple statement", "exclamation", "compound sentence".
- In the answer key, add "(also accept declarative)" to compound items.
- Add to the a12 teacherNotes: "A compound sentence can also be declarative or exclamatory; in this sort we are looking for the joining word."

**M2. a5 slide "Word lists from this week", ee row: "evening" does not contain the ee digraph.** Its /ee/ is spelt e (the Department analyses it as e_e: e_e-v-n-i-ng).
- Fix: replace "evening" with "sheep".
- If you want evening kept, put it in a row labelled "e (or e_e)".

**M3. a13 slide "This week's words", ay row: "they" is spelt with ey, not ay.** The slide's own CFU then asks "Spell the /ay/ in they", answer "ey", which contradicts the row.
- Fix: the ay row becomes "today, way, yesterday, away, stay, play, tray, delay".
- Optional: add a row `ey: they, grey, prey`.

**M4. L11 warm-up Q4, answer "Answers will vary: e.g. loyal, hungry, careful, honest".** L4 explicitly teaches that **hungry is not a trait** (it is a close non-example: "how a character feels right now").
- Fix: "Answers will vary: e.g. loyal, careful, honest, worried".

**M5. L7 hinge: the explanation for option B is wrong.** B "Pip put cans on a string." contains an adverbial phrase ("on a string", where). Yet the why says "there is no adverbial phrase to slow it down". Option C is also missing its full stop.
- Fix: options[2] = "Slowly, Pip tied the string." (28 characters).
- Fix: why[1] = "Better, but put is a weak verb and nothing slows the moment down."
- Fix: why[2] = "Right. A slow how word and a precise verb help us picture each step."

**M6. L6 CFU Q4: "The fox waited for his chance." with answer "Why".** "for his chance" is the complement of *wait for*, not a reason adverbial. Teachers and strong students will argue it.
- Fix: "The fox waited to grab a hen." (answer: Why). Also consider Q3: "very patiently" is an adverb group, not a phrase. Change it to "The fox waited with great patience." (How).

**M7. L10 "Too little, too much, just right": close to the Department's Innovation 1 and 2 (Dept L10, activity 124).**
- Dept Innovation 1: "'This, badger,' said Mr Fox, 'is Bunce's shed. He keeps his stuff in here.'"
- Pack: "This is Pip's shed. She keeps stuff in it."
- Dept Innovation 2 uses "Magnificent, Mighty and Marvellous ... wonderful". The pack uses "magnificent, marvellous, gigantic, wonderful".
- All three pack rows keep the Dahl/Department frame "This is X's [storehouse]".

Fix:
- Too little: `Pip's shed had food.`
- Too much: `Pip's huge, giant, enormous, massive shed was full of yummy, tasty, delicious, lovely food.`
- Just right: `Pip's [adj:enormous] Pumpkin Shed was piled [adv:to the rafters] with [adj:ripe], [adj:orange] pumpkins.`

**M8. L4 tells the teacher to use "a large drawing of a fox for the board". The pack doesn't provide one.** The house rule says everything shown must be in the pack.
- Fix: in materials, change it to "the Mr Fox slide (photo) on the board, or the Mr Fox trait wall page".
- Add a one-page A3 or A4 "Mr Fox trait wall" printable to l4 printables: the fox photo in the centre and a "Trait / Evidence" sticky-note ring around it.

**M9. L12 slide "I do: the Pumpkin Shed" renders as one dense handwriting-font paragraph** (contact sheet b, L12). The part labels are lost and the text is too small to read from the back of a room.
- Fix: render `model.parts` as labelled rows, as L7 and L8 do, or split it over two slides (parts 1 to 3, then 4 to 6).

**M10. Poster "Watch out for these" (Posters p2) is teacher-facing text on a classroom poster.**
It reads "Some people think ... Remember: Use the Orientation planner ... Show the too little ... sentences from Lesson 10 ... Teach but for contrast...".
- Fix: move it to the Teacher Guide only, or rewrite it for students, for example "Watch out: A trait is what a character is like inside, not how they look."

**M11. Assessment has no /ee/ spelling item.** /ee/ is taught for two weeks (a1, a5, a17). The spelling section only tests plurals, suffixes and one /ay/ word.
- Fix: add "Which is the correct spelling? valley, vally, vallee" (answer: valley).
- Or add "Write the word that means more than one tree: ___" (answer: trees).

**M12. Model-thread continuity (Farmer Pip):**
- L8: Pip sees Mr Fox ("'Fox!' roared Farmer Pip").
- L12 to L14: the animals raid her Pumpkin Shed and narrowly escape Pip and Biscuit.
- L15: the definition example says "Pip never finds out where her pears went".
- L16 and L18: the sequel has Mr Fox "remember" the Pumpkin Shed as if it were new, and he befriends Biscuit as if meeting her for the first time.

Fixes:
- L15 resolution example: `The foxes are safe, and Pip never catches the pear thief.`
- L16 model "Climax": `They dig uphill to Farmer Pip's Pumpkin Shed again, but now Biscuit sleeps inside it!`
- L18 "An idea": `Then Mr Fox remembered the Pumpkin Shed over the hill, high and dry. But since their last visit, Pip had left Biscuit on guard inside.`

**M13. Close-reading synopsis for Chapter 1 (l2-passage) paraphrases the Department's Resource 1 sentence by sentence.**
- Dept: "This passage is the opening chapter to the book. It describes the setting and introduces 3 of the main characters ... It is part of the orientation to the narrative."
- Pack: "The opening chapter. It sets up the valley ... introduces Boggis, Bunce and Bean. It is part of the orientation".
- The Department material is CC BY, so the legal risk is low, but it breaks the house rule.
- Fix: `["Chapter 1 builds the world of the story: one valley, three farms, three unpleasant owners.", "Each farmer gets a short portrait in the same pattern.", "By the end, readers are firmly on the fox's side before he has even appeared."]`

**M14. Freytag's pyramid is not named anywhere a teacher following the Department unit would look.** The Department uses Resources 12 and 13 by that name in L13 and L16. The pack mentions it only in the L13 teacherNotes.
- Fix: retitle the L13 anchor "Anchor chart: the narrative arc (Freytag's pyramid)".
- Fix: subtitle the l13-arc and l16-arc printables "Freytag's pyramid".

**M15. Component A is much lighter than the Department's Component A.** This is fine as a product, but the listing must say so.
- The Department plans Component A at "60 minutes x 4 days/week". The pack's skills are 15 to 20 minute mini-lessons with 3 to 6 slides.
- Department content with no skill slide:
  - Monitoring comprehension in Weeks 1 and 2. This covers comparisons and metaphors ("thin as a pencil", "Quick as a whip"), cohesive ties ("one fat, one short, one lean", "These horrible crooks"), and complex sentences.
  - Prefixes in Week 2 ("Morphemes can be added before (prefix)...").
  - Adverbs as a vocabulary focus in Week 1.

Fixes:
- (a) In the listing and guide, describe the skills as "20 short, explicit Component A skill lessons (15 to 20 minutes) to anchor your Component A block".
- (b) Add one "Where meaning breaks down" slide to a3 and to a7. Use locators only, for example "Chapter 1, p 4: the comparison about how thin Bean is" and "Chapter 3: the sentence beginning 'Quick as a'", with questions: "What two things are being compared? What does it tell us?"
- (c) Add one prefix row to a7 (un-, dis-, re- with base words such as happy/unhappy, like/dislike).

**M16. Card-sort printables: heading cards look the same as word cards.**
Affected: a1, a2, a5, a9, a12, a14, a17 and a20 in the Component A Printables. Students can't tell headings from words once they are cut out.
- Fix: draw cards whose text matches a heading (or flag them, say `"heading": true`) with a filled colour band and bold text, or put them on their own strip.

**M17. Syllabus outcome statements in the listing and the unit `outcomes` are paraphrased, but presented as the outcomes.**
For example, NESA's EN2-HANDW-01 reads "forms legible joined letters to develop handwriting fluency". The pack has "Forms legible letters with consistent size, slope and spacing...".
- Fix: use the official NESA wording, which the Department unit quotes in full, with the © NESA line.
- Or label the section "Syllabus outcomes (in brief)".

---

## LOW

**L1. a1 definition of /ee/: "The letter says its name."** This is wrong for ee, ea, ey and y.
- Fix: means = "A long vowel sound, like the sound in me and tree."

**L2. a6 Go further teaching box gives away Q2.** The box says "one sheep, two sheep; one mouse, two mice" and Q2 asks for the plural of goose, mouse and sheep.
- Fix: teach text = "Some plurals break the rules: one child, two children; one tooth, two teeth."

**L3. a15 "paused: pause, drop e, + ed"** contradicts a10 and a14, which say "Ends in e: just add d".
- Fix: "pause + d: stopped for a moment. 1 syllable."

**L4. a3 vocab table: "valleys", Ch 1, p 1.** Page 1 says "valley" (singular).
- Fix: replace it with `{"word":"turkeys","locator":"Ch 1, p 4","base":"turkey","suffix":"-s","means":"more than one turkey"}`.

**L5. a3 teacherNotes says "-est usually joins one syllable adjectives"** while the focus word is cleverest.
- Fix: add "Cleverest is an exception: clever has two syllables but still takes -est."

**L6. a5 /ee/ cards: "speedy" has two /ee/ spellings (ee and y),** but the sort has no y heading.
- Fix: replace it with "sweeter" or "freezing".

**L7. a18 "Short vowel + one consonant: Double it"** is over-general: visiting, opening.
- Fix: "Short word, short vowel + one consonant: double it: grin, grinning; begin, beginning (the stress is on gin)."

**L8. L9 setting non-example "Badger has doubts".** Badger isn't introduced until Chapter 12 (L10).
- Fix: "Mrs Fox is worried".

**L9. L10 hinge option B "The huge, giant, massive shed" isn't a sentence either.** Its "why" says "Too much", while D's says "Not a sentence".
- Fix: "Huge, giant, massive sheds." becomes "The huge, giant, massive shed held pears." This is too long for the 30-character limit, so use "The huge, giant, big shed." and set why[1] = "Too much: three words that mean the same thing, and it is not a full sentence."
- Or simply make A to D all full sentences.

**L10. L17 orientation model: "the farmers still sat by the hole, wet and grumpy"** comes before "it began to rain".
- Fix: "cold and grumpy".

**L11. Pumpkin count:** L3 has "three thousand pumpkins". The a20 handwriting copy has "Pip had 365 pumpkins".
- Fix: a20 copy and model line: "Pip grew 3000 pumpkins and 12 crates of pears."

**L12. a8 handwriting:** the slide copy is "...Mr Fox can." but the printable model is "Mr Fox can, but he is not hungry." Make them match.

**L13. L18 slide titles say "We do: ..." while `mode` is "I do".** Set the mode to "We do" on the three L18 model slides and on L19's "We do: the resolution".

**L14. L11 word bank: "Think of your family, Badger. ___"** is the Department's example argument (Dept L11, activity 134) word for word.
- Fix: "Badger, your cubs need ___".

**L15. L7 model closing sentence echoes the Department trap model.**
- Dept: "With smirks on their faces, the farmers ... wait for Mr Fox to appear."
- Pack: "With a sly grin, Pip crouched ... and they waited for the thief."
- Fix: `Then Pip blew out her lantern, crouched behind the hay bales with Biscuit, and waited.`
- Also, "rusty" appears twice in that paragraph. Change "a rusty nail" to "a bent nail".

**L16. L8 slow paragraph follows the same beat order as the Department's L8 model** (pokes head out, sniffs, smells food, moves slowly, sees something shiny). This is acceptable, because the Department and Dahl prescribe the steps and the wording differs. Optionally, change "Something thin and shiny glinted" to "A thin line of string glinted" so the Department's "shiny silver" image isn't echoed.

**L17. Page references differ from the Department in a few places.** Add a teacher note so teachers don't think the pack is wrong.
- Chapter 3 passage: the pack has pp 10 to 13. The Department's Component A has pp 11 to 13, and its Component B has the shooting on p 12.
- Chapter 1: the pack has pp 1 to 5. The Department has pp 1 to 4.
- Fix: one line in the guide: "Page numbers follow the Puffin edition used by the Department; some Department references differ by a page between Components A and B."
- Also check L9 "Chapter 6, p 28" (crater) and "Chapter 7, p 31" (tents) against a copy. The Department gives the pages but not the chapters.

**L18. L4 mentor locator "from 'Mr Fox crept up'".** The Department says "Read the start of Chapter 3". If the chapter opens with the Mr and Mrs Fox exchange that holds the evidence for L4 ("Now do be careful"), students miss it.
- Fix: locator = "Chapter 3, pp 10 to 12: from the start of the chapter to the gunshots".

**L19. Teacher-only close-reading planners** (Chapter 1, Chapter 3, three storehouses) sit inside the student Worksheets PDF (pp 4, 18, 25).
- Fix: move them to the Teacher Guide or a "Teacher planners" PDF, or mark them "Teacher page".

**L20. Printables are labelled "Resource 4", "Resource 16" and so on.** These clash with the Department's own Resource 1 to 13 numbering. For example, Department Resource 4 is the interaction protocols, but pack Resource 4 is Picture a farmer.
- Fix: prefix pack numbers, for example "Pack R4", or drop the numbers and use titles.

**L21. Colour markup renders as underlined coloured words on posters and word-bank slides,** which look like hyperlinks (Posters pp 7, 9 and 13 to 16; L2 word bank).
- Fix: use a coloured highlight or bold colour without an underline outside sentence contexts.

**L22. Smaller items:**
- Posters exist for 14 of the 20 lessons. L3, 4, 8, 15, 16 and 20 have none. Add them or say "posters for key lessons".
- The story map is A4, but L9 says "A3 Story map page". Note "print at A3".
- The L1 protocols poster is fully prefilled, while L1 says to co-construct. Add 2 blank lines per column, or provide a blank version.
- "candy, candies" (a1, a2) comes from the Department's sample words. It is fine, but "lolly, lollies" is more Australian.
- The Teacher Guide cites Siemon, a maths source, for "fixed ability groups widen gaps". Swap it for a general or literacy source, or keep it as general evidence.

---

## Checks that passed

**Copyright (book).**
- No Fantastic Mr Fox sentences are reproduced. These locators are all 4 words or fewer: 'Boggis was a', 'Bunce was a', 'Bean was a', 'Down in the valley', 'Mr Fox crept up', 'Just then, his sharp', 'Carefully, Mr Fox began', 'He reached high and', 'Mr Fox laughed and', 'Suddenly Badger said', 'At that moment they', 'But now, my friends', 'Outside the fox's hole'.
- Single book words used as vocabulary (beastly, pot-bellied, crooks and so on) are fine.
- The slow reveal gives locators only.

**Copyright (Department).** The only verbatim run longer than about 4 words is L14 in the Low list. The rest are the close paraphrases in H4, H5, M7 and M13. CC BY 4.0 attribution is present in the credits and in Read_Me_First.

**Grapheme lists.**
- /ee/ is ee, ea, e_e, ey, e, y. This matches the Department exactly.
- /ay/ is ai, ay, ey, a_e, a, eigh, aigh, and it is called a diphthong. This matches the Department.

**Counts and rules.**
- These counts match the Department: turkey 2 syllables and 4 phonemes; hooray 2 and 4; waiting 2 and 5; beginning 3 and 7; enormously 4; disgusting 3; cleverest 3; smothered 2; flattened 2; especially 4; crouched and paused 1; carried 2; amazing (schwa, then /ay/).
- street 5, teeth 3, speed 4 and peach 3 are correct.
- These rules are all correct: plural y (vowel + y vs consonant + y), -es after s, ss, sh, ch, x, drop e before -ing, keep y after a vowel, consonant + y to i before -ed, and the three sounds of -ed.

**Grammar definitions.** Declarative, exclamatory, compound sentences, the coordinating conjunctions and/but/so with their meanings, adverbial phrases (when, where, how, why), and the three adjective types with commas between describing adjectives all match the Department's teaching notes. The one exception is the category overlap in M1.

**Answers.** I checked every other CFU, hinge index, worksheet, exit ticket and assessment answer, and found no other errors.

**Plot facts.** All of these are correct:
- the farms (Boggis: chickens; Bunce: ducks and geese; Bean: turkeys and apples)
- the 4 Small Foxes and the hole under the tree
- the tail shot off in Chapter 3
- shovels (Ch 4), then machines (Chs 5 and 6), then the siege and starvation (Chs 7 and 8)
- Chapter 9, the plan
- Boggis's Chicken House (Ch 10), Badger (Ch 12) and Bunce's storehouse (Ch 13)
- Badger Has Doubts (Ch 14), Rat and Bean's cellar (Ch 15) and the Woman (Ch 16)
- the feast and speech (Ch 17) and Still Waiting (Ch 18)
- 18 chapters, and the Then row completed after Ch 17

**Department sequence.** Every lesson covers the Department lesson's focus. That includes the slow reveal from Ch 10 p 38, protocols, main and supporting characters, the Quentin Blake comparison, the fourth farmer description, foxes in other texts, act-out traits, SWBST and the try/fail pattern, the two-speed Chapter 3 scene, plans and fails, story map, Mrs Fox and Small Foxes traits, under- and over-description, conscience alley, the storehouse pattern, the climax, the danger leaving, six resolution types with picture books and a vote, planning a sequel, drafting in three lessons, and revising vs editing with read-aloud.

**Style.**
- No em or en dashes anywhere in the unit or the Teacher Guide.
- Australian spelling throughout (colour, organiser, neighbour, practise, smelt, draughty).
- Farmer Pip is always she, and Biscuit is always she (a kelpie). Bluegum Creek and the Pumpkin Shed are consistent.
- The prose doesn't read as AI-generated.

**Depth.** Component B lessons have 12 to 14 content slides plus LI/SC, a check and an exit ticket. Most have a 20 to 30 minute independent task, which is enough for 60 minutes. Year 3 language is suitable, with terms defined and non-examples given.

## Fix order suggestion
1. **Engine fixes:** H1, H6, H7 (wrapping), M9, M16, L21.
2. **Printable templates:** H2, H3, M8.
3. **Content edits in the unit JSON:** H4, H5, M1 to M7, M11 to M14, and all the Lows above. These are all text replacements, as given.
4. **Copy and listing:** H8, M15(a), M17.
5. **Rebuild, then re-check:** the answer key pages for overprint, Discuss slides, the posters, and that the PRODUCT.zip contents match (H9).
