# johandrox bust site scaffold

## What to replace
Put your 3D bust at:

`/assets/bust.glb`

The scaffold is already set up with:
- the provided logo at `/assets/logo.png`
- the provided blue photo backdrop at `/assets/backdrop.jpeg`

## Files
- `index.html` → homepage with the 3D bust
- `shop.html` → placeholder page
- `contact.html` → placeholder page
- `style.css` → all styles
- `js/main.js` → three.js scene and interaction

## Notes
- The bust rotates on drag and slowly returns to zero.
- The bottom of the screen hides the chest cutoff with a foreground occluder using the same backdrop.
- Breathing motion is intentionally extremely subtle.
- If your bust loads too high or too low, edit this line in `js/main.js`:

`object.position.y = -1.65;`

More negative = lower on screen.
