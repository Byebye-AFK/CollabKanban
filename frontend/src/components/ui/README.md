# ui

## Overview
Shared, page-agnostic UI primitives: the app's single dialog, an animated search field, and a "decrypting" text effect. Each one holds only local presentation state and gets its data and actions from props.

## Interface
- `Modal` (default export) `{ title, label = title, kicker, onClose, footer, children, as = 'div', onSubmit }`: the dialog every page uses. Rendered with `createPortal` into `document.body` [Modal.jsx:Modal]
- `GooeyInput` (default export) `{ value, onChange, placeholder, label, type, anchor = 'end' | 'start', hotkey, inputRef, className }`: a controlled search input that opens from a round icon. `onChange` receives the string value, not the event [GooeyInput.jsx:GooeyInput]
- `EncryptedText` (default export) `{ text, animate = true, revealDelayMs, flipDelayMs, charset, className, encryptedClassName, revealedClassName }` [EncryptedText.jsx:EncryptedText]
- `scrambleFrame(text, revealedCount, charset?, random?)`: a pure function that returns `{ char, isRevealed }[]`. `random` can be injected for tests [EncryptedText.jsx:scrambleFrame]
- `prefersReducedMotion()`: returns `true` when the `(prefers-reduced-motion: reduce)` media query matches, and `false` if `matchMedia` is missing or throws [EncryptedText.jsx:prefersReducedMotion]

## Invariants
- `Modal` closes on three things: Escape (a `window` keydown listener), the close button, and a `mousedown` whose target is the overlay itself. A press inside the dialog never closes it [Modal.jsx:Modal]
- When `as="form"` is set, `onSubmit` goes on the dialog element, so Enter in a field submits natively. Footer buttons that should not submit must have `type="button"` [Modal.jsx:Modal]
- `GooeyInput` stays open while it has focus or a non-empty `value` (`isOpen = hasFocus || Boolean(value)`) [GooeyInput.jsx:GooeyInput]
- In `GooeyInput`, Escape clears a non-empty value (`onChange('')`). With an empty value, Escape blurs the field instead [GooeyInput.jsx:handleKeyDown]
- Only one `GooeyInput` per page should set `hotkey`. Each instance with `hotkey` adds its own global Cmd/Ctrl-K listener [GooeyInput.jsx:GooeyInput]
- The gooey SVG filter id comes from `useId()` with the colons removed, so several instances never share a filter [GooeyInput.jsx:filterId]
- Spaces and other whitespace in `scrambleFrame` are always revealed, so word shapes stay stable [EncryptedText.jsx:scrambleFrame]
- `EncryptedText` renders plain text when `animate` is false or the user prefers reduced motion. While animating, the real text is in an `sr-only` span and the scrambled glyphs are `aria-hidden` [EncryptedText.jsx:EncryptedText]

## Side Effects
- `Modal` portals into `document.body` and adds a `keydown` listener on `window`, removed on unmount [Modal.jsx:Modal]
- `GooeyInput` with `hotkey` adds a `keydown` listener on `window` that calls `preventDefault()` on Cmd/Ctrl-K and then focuses and selects the field [GooeyInput.jsx:GooeyInput]
- `EncryptedText` runs a `setInterval` that is cleared when the text is fully revealed or the component unmounts [EncryptedText.jsx:EncryptedText]
- No network or storage access.

## Verification
- Run: `npm test -- src/components/ui` (from `frontend/`)
