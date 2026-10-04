## UI
- Hand-written CSS in `frontend/src/index.css`, built on the color tokens in its `:root` block (sand palette). No Tailwind or daisyUI; never create tailwind.config.js.
- Font: Noto Sans (Google Fonts, linked in `frontend/index.html`) everywhere.
- Court cards are stat-style: "Available"/"Reserved" label, green check or yellow caution icon, `#16`-style number, reserved times, and an 8am–5pm timeline with tick labels.
- Layout is fixed: always 3 across; North 16-15 / 14-13-12 / … / 2-1, South H-G / F-E-D / C-B-A; rows of two centered.
- The background is an 8-bit pixel-art beach drawn on a canvas by `frontend/src/scene.js`, west to east: ocean, sand, palms, running path, bike path (lane icons, moving walkers/bikers/dog walkers; northbound on the right half), grass with Perry's Cafe beside courts #14–#11. Lifeguard towers sit in the gaps left of #16 and #2. Landmarks are positioned from the `[data-court]` cells, so keep that attribute.
- Every visual detail above was chosen by the user in a long review; ask before changing any of it.
