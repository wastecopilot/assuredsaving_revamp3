# Assured Saving: revamp 4 ("Daylight", photo-led)

The fourth take on the Assured Saving flow.

- **Look.** A warm cream page led by real photos: a living-room photo beside the official headline on step 1, a photo of the visitor's home or business on the "Address Found" card, and a photo banner on each step.
- **Colour.** Royal blue for structure, coral for the main action, and bright solid colours for the services: cyan (Internet), pink (TV), lime (Landline), sunflower (Mobile) and green (Home Security). Flat colour only, with no gradients, glows or glass. The font is Figtree.
- **Flow.** One step on screen at a time. The header shows the official step names, never step numbers.
- **Wording.** All visible text is the official wording from https://www.assuredsaving.com/. It is extracted into `data/official-copy.json` and checked by tests.
- **Rules.** The official selection rules and the business-address rule are unchanged.
- **Mocked.** Everything is mocked: no request is sent, and no call or text is made.

## Photos

The five photo slots (hero, home, business, usage, tv) show flat drawings until real photos are added. To add one, put it in `public/photos/<slot>.jpg` and rebuild. The Gemini prompts for each photo are in `docs/image-prompts.md`.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run check      # typecheck, lint, contrast, tests, production build
```

See `docs/quality.md` for:
- the design spec;
- the tests;
- the UX pen test;
- the simulated users.
