---
name: Affiliate Trust & Action System
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#434655'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006c4a'
  on-secondary: '#ffffff'
  secondary-container: '#82f5c1'
  on-secondary-container: '#00714e'
  tertiary: '#784b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#996100'
  on-tertiary-container: '#ffeedd'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#85f8c4'
  secondary-fixed-dim: '#68dba9'
  on-secondary-fixed: '#002114'
  on-secondary-fixed-variant: '#005137'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.25'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  2xl: 64px
  container-max: 1280px
  gutter: 24px
---

## Brand & Style
The design system is engineered for a high-traffic affiliate hub where the intersection of professional reliability and urgent action is paramount. The brand personality is **authoritative yet energetic**, designed to strip away the "clutter" often associated with coupon sites in favor of a clean, premium experience that validates the user's intent to save.

The visual style follows a **Corporate Modern** aesthetic with a lean toward **Functional Minimalism**. It prioritizes high-contrast calls-to-action (CTAs) and structural clarity. By using generous whitespace and a refined color palette, the system builds the "Trust Factor" necessary for users to confidently click outbound affiliate links.

## Colors
The palette is rooted in psychological triggers of safety and success. 
- **Primary (Blue #2563EB):** Used for primary brand elements, navigation, and core links to establish professional authority.
- **Secondary (Green #059669):** Specifically reserved for "Savings," "Verified," and "Active" indicators. This signals positive action and successful outcomes.
- **Tertiary (Amber #F59E0B):** Used sparingly for "Ending Soon" or "Expiring" alerts to create low-level urgency without inducing anxiety.
- **Neutrals:** A scale of cool grays provides structure. Backgrounds are kept pure white (#FFFFFF) to maintain a "clean" feel, while surfaces use #F9FAFB to differentiate card content.

## Typography
**Inter** is the workhorse of this design system, chosen for its exceptional legibility and neutral, modern tone. 
- **Headlines:** Use heavy weights (700-800) for merchant names and deal titles to create a strong visual hierarchy.
- **Coupon Codes:** Represented via **JetBrains Mono**. The monospaced nature makes codes distinct from standard text, aiding in character recognition (e.g., distinguishing '0' from 'O').
- **Admin Context:** In the dashboard, `body-sm` becomes the primary size for table data to maximize information density while maintaining readability.

## Layout & Spacing
This design system utilizes a dual-mode layout strategy:
1. **Public Site (Marketing):** Uses a 12-column fluid grid with 24px gutters and 64px vertical rhythm (2xl). This encourages scanning and provides enough "breathable" space to avoid the cluttered look of traditional coupon sites.
2. **Admin Dashboard (Utility):** Switches to a condensed 8px spacing rhythm. Sidebars are fixed-width (240px), and main content areas use a fluid grid with reduced margins (16px) to accommodate dense data tables and complex forms.

**Breakpoints:**
- Mobile: < 640px (Single column, 16px margins)
- Tablet: 641px - 1024px (2-3 column cards, 24px margins)
- Desktop: > 1025px (Full 12-column grid)

## Elevation & Depth
Depth is used to signify "clickability" and distinguish content layers:
- **Level 0 (Flat):** Used for background surfaces and the Admin Dashboard workspace.
- **Level 1 (Subtle):** Cards on the public site use a 1px border (#E5E7EB) and a very soft, high-diffusion shadow (0 4px 6px -1px rgba(0,0,0,0.05)).
- **Level 2 (Hover/Active):** When a user hovers over a deal card, the shadow deepens and the border color shifts to the primary blue. This provides immediate tactile feedback.
- **Level 3 (Modals):** Large, diffused shadows (0 20px 25px -5px rgba(0,0,0,0.1)) to pull critical action items (like "Copy Code" popups) to the foreground.

## Shapes
The shape language is **Soft (0.25rem / 4px)**. This choice maintains a professional, geometric feel that aligns with "Trust" while avoiding the clinical sharpness of 0px corners. 
- `rounded-lg` (8px) is reserved for larger containers like Deal Cards and Image Placeholders.
- `rounded-full` (Pill) is used exclusively for status chips (Active, Expired) to differentiate them from square-ish buttons.

## Components
- **Buttons:** 
  - **Primary:** Solid Blue (#2563EB) background with white text. High contrast, 48px height for touch-targets.
  - **Secondary:** Green (#059669) for "Get Deal" or "Claim" buttons.
  - **Outline:** Gray border for "Secondary" actions like "Details" or "Terms".
- **Status Chips:** Small, pill-shaped badges with low-opacity backgrounds. 
  - *Active:* Green text on Light Green bg.
  - *Expired:* Red text on Light Red bg.
  - *Draft:* Gray text on Light Gray bg.
- **Merchant Badges:** Small circular icons (40x40px) with 1px borders, used to identify brands quickly in list views.
- **Coupon Code Box:** A distinctive container using a dashed border (#D1D5DB) and monospaced font. It should include a "Copy" icon button as a secondary action.
- **Admin Tables:** Compact rows (40px height) with alternating zebra striping and sticky headers for high-density data management.
- **Urgency Badges:** "Ending Soon" badges utilize a slight pulse animation or the Tertiary Amber color to draw attention without breaking the professional tone.