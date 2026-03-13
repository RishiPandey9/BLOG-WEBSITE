# Responsive QA Checklist

This checklist is for validating the product on key breakpoints before release.

## Breakpoints

- Mobile small: 320x568
- Mobile standard: 390x844
- Tablet: 768x1024
- Laptop: 1366x768
- Desktop: 1920x1080

## Global Checks

- No horizontal scrolling on any route.
- Navbar is usable with touch and keyboard.
- Buttons have visible labels and are not clipped.
- Form fields and dialogs stay inside viewport width.
- Sticky or fixed elements do not block core actions.
- Text scales cleanly and remains readable at 200% zoom.

## Route Checklist

### /

- Hero heading wraps cleanly on mobile.
- CTA buttons stack on mobile and stay centered.
- Stats row remains visible without clipping.

### /blog

- Search/filter controls wrap correctly.
- Card grid collapses to 1 column on small mobile.
- No card content overflows card bounds.

### /blog/[slug]

- Back button remains visible in hero image.
- Action bar wraps correctly on mobile.
- Share controls do not cause overflow.
- TOC is hidden on mobile and visible on desktop.

### /dashboard

- Tabs can scroll horizontally when space is tight.
- Post rows stack with actions still reachable.
- Analytics bars and labels remain readable on mobile.

### /create and /blog/[slug]/edit

- Rich editor controls are usable on touch devices.
- Cover image uploader fits viewport width.
- Submit/publish buttons remain visible and clickable.

### /pricing

- Plan cards stack on mobile and spacing is preserved.
- CTA remains visible and not blocked by sticky UI.

### /admin

- Table/list sections are horizontally scrollable where needed.
- Moderation controls are usable on tablet widths.

## Suggested Test Steps

1. Run `npm run dev`.
2. Test each route at all breakpoints listed above.
3. Verify both light and dark mode.
4. Validate keyboard-only navigation for navbar, dialogs, and buttons.
5. Re-run after any CSS, component, or layout changes.
