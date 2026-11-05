# Photo prompts (Google Gemini)

The site has five photo slots. Until a photo is added, each slot shows a flat drawing, so nothing looks broken.

**To add a photo:**
1. Save it as `public/photos/<slot>.jpg` (`.webp` and `.png` also work).
2. Run `npm run build`. The build lists the photos it found.

**Rules that apply to every prompt** (they keep the photos from looking AI-made):
- **Camera and light:** a documentary or editorial style, as if shot on a full-frame camera with a 35mm lens. Use natural window light, slight film grain and true-to-life colour, and keep it a little imperfect: a slightly off-centre frame, everyday clutter, real skin texture.
- **Things to leave out:** no text, logos, brand names or watermarks; no one looking at the camera; no stock-photo smiles; no extra fingers, warped objects, glowing light or lens flare; no HDR, plastic skin, oversaturation or a 3D render look.
- **Colour:** the site's colours are cream, royal blue, coral, sunflower yellow and green. Small touches of these in the scene (a cushion, a mug, a door) help the photos sit naturally on the page.

| Slot | File | Size (crop) | Where it appears |
| --- | --- | --- | --- |
| hero | `hero.jpg` | 1600×1000 (16:10) | Step 1, beside the headline |
| home | `home.jpg` | 1600×600 (8:3) | The "Address Found" card and the name step, for a home address |
| business | `business.jpg` | 1600×600 (8:3) | The same places, for a business address |
| usage | `usage.jpg` | 1600×500 (16:5) | Top of "How do you use the internet?" |
| tv | `tv.jpg` | 1600×500 (16:5) | Top of the TV step |

---

## 1. hero.jpg: a home that's connected

> Candid documentary photograph of an American family's living room on a weekday evening, shot from slightly above eye level with a 35mm lens. A mother sits on a cream sofa with a laptop on her knees while a young boy lies on the rug reading a tablet; a teenager in the background is on a phone near the window. A flat-screen TV on a low wooden cabinet is switched on but slightly out of focus; a small white Wi-Fi router sits on the cabinet. Warm late-afternoon window light from the left, soft natural shadows, a royal-blue throw blanket and a coral cushion on the sofa, a yellow mug on the side table, a few toys and a charging cable on the floor. Nobody looks at the camera. Real skin texture, slight film grain, true-to-life colour, gentle depth of field. Editorial photography, not staged, not stock. No text, no logos, no brand names. 16:10 landscape.

## 2. home.jpg: the visitor's house

> Street-level photograph of a typical two-storey American suburban house on a sunny morning, shot from across a quiet residential street with a 35mm lens at eye height. Pale cream siding, a coral-red front door, a small porch, a green lawn and a young tree, a car partly visible in the driveway on the right edge, a mailbox on the left. Clear blue sky with a few soft clouds, natural shadows on the grass, slight asymmetry in the framing. Looks like a real-estate street view taken by a person, not a render. No people, no house numbers, no text, no logos. Very wide 8:3 panorama crop with the house slightly right of centre.

## 3. business.jpg: the visitor's business

> Street-level photograph of a small single-storey American commercial building in a strip of shops on a bright afternoon, shot from the sidewalk across the parking lot with a 35mm lens. Large glass shopfront windows, a royal-blue awning, a cream brick facade, a couple of parked cars, a lamppost and a small planter with green shrubs. Natural reflections in the glass, real weathering on the pavement, a slightly tilted horizon corrected by hand. Shop signs are blank or out of focus. No readable text, no logos, no brand names, no people close to the camera. Very wide 8:3 panorama crop.

## 4. usage.jpg: how they use the internet

> Candid over-the-shoulder photograph of a person working from home at a wooden kitchen table, shot with a 35mm lens and shallow depth of field. A laptop shows a blurred video call grid; beside it a phone, a notebook, a coral mug and a pair of headphones. Through the window behind, soft daylight and a hint of green garden; a small white Wi-Fi router is visible on a shelf in the background. Hands and part of the shoulder visible, face not visible. Natural colour, gentle film grain, everyday clutter. No readable screen text, no logos. Very wide 16:5 crop with the laptop left of centre.

## 5. tv.jpg: TV night

> Candid photograph taken from behind a sofa of three friends watching a live football game on a large wall-mounted TV in a cosy apartment in the evening, shot with a 35mm lens. Only the backs of their heads and shoulders are visible; one holds a remote, a bowl of popcorn on a yellow cushion between them. The TV screen shows a blurred green sports field (no readable score or logos). Warm lamp light mixed with the cool light of the screen, natural shadows, slight motion blur on a raised arm, film grain. No faces, no text, no logos, no brand names. Very wide 16:5 crop.
