# Figma Match Notes


Implemented target:
- `frontend/src/app/page.tsx`
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/Chat.tsx`

## Pixel-parity adjustments applied

1. Canvas and shell
- Outer app uses a 16px stage inset and a rounded 24px frame.
- Frame content is clipped to preserve the rounded boundary.

2. Sidebar geometry and rhythm
- Sidebar width is fixed to 278px.
- Header row height is 40px.
- Content starts at 136px from sidebar top (96px vertical gap after header).
- Uploader, file list, URL input, and CTA sizes/gaps match Figma node structure.

3. Sidebar visual tokens
- Backgrounds: `#ffffff`, `#fafafa`, `#f0f0f0`
- Borders: dashed `#455A64`, regular `#B0BEC5`, button outline `#CFD8DC`
- Text colors: `#1c1c1c`, `#263238`, `#607D8B`
- Primary action: `#2c3ca4`
- File cards use the two-layer shadow:
  - `0px 1px 3px 0px rgba(0,0,0,0.06)`
  - `0px 1px 4px 1px rgba(0,0,0,0.04)`

4. Footer input bar and send button
- Footer row width is 670px with a 600px input and 56px send button.
- Input height is 56px, radius 81px, background `#f0f0f0`.
- Placeholder tone uses 20% black equivalent.
- Footer vertical placement aligns with Figma bottom spacing behavior.

5. Chat surface behavior for visual parity
- Empty-state center illustration/text is hidden to match the Figma frame.
- Bottom disclaimer text is removed for exact composition match.

## Validation

- Visual diff was checked against Figma screenshot and node metadata (`334:2277`).
- Lint verification passed:
  - `cd frontend && npm run lint`
