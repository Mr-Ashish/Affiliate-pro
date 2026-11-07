---
name: Verified Savings Portal
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3c4a42'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6c7a71'
  outline-variant: '#bbcabf'
  surface-tint: '#006c49'
  primary: '#006c49'
  on-primary: '#ffffff'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#4edea3'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#855300'
  on-tertiary: '#ffffff'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-code:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses a conversion-focused, modern consumer savings platform where transparency, reliability, and speed converge. The interface balances high-energy discount discovery with the poise of an authoritative financial utility.

### Emotional Target
- **Instant Confidence:** Visual cues immediately signal authenticity, verified working promo codes, and real cashback yields.
- **Rewarding Urgency:** Visual accents communicate limited-time incentives without resorting to intrusive or deceptive friction patterns.
- **Effortless Discovery:** Crisp layout rhythm ensures deal cards, merchant badges, and coupon triggers remain scannable under heavy information density.

### Design Movement: Modern Functional Consumer Portal
The aesthetic blends clean, structured consumer software patterns with tactile modern card UI. Crisp white surfaces sit on cool, subtle background tints, punctuated by high-contrast typographic scales and an unmistakable emerald/mint anchor.

## Colors

The palette establishes an immediate psychological link to financial health, savings validation, and merchant authority.

### Color Hierarchy & Roles
- **Primary (`#10B981`):** The engine of the platform. Used for core actions ("Copy Code", "Activate Cashback"), verified deal badges, positive savings metrics, and active states.
- **Secondary (`#0F172A`):** Deep Slate Navy. Provides crisp, authoritative contrast for primary headlines, navigation headers, and anchor micro-copy, preventing the portal from feeling disposable.
- **Tertiary (`#F59E0B`):** Warm Amber/Coral accent. Dedicated exclusively to urgency indicators: expiring deals, "exclusive" flash ribbons, and trending hot tags.
- **Neutral (`#64748B`):** Cool Slate. Drives secondary metadata, subtle borders, inactive tab markers, and body prose.

### Surface Tones & Backgrounds
- Canvas Background: `#F8FAFC` (Slate-50) creates crisp delineation against card containers.
- Surface Pure: `#FFFFFF` for primary cards, modals, and input containers.
- Muted Container: `#ECFDF5` (Mint-50) for verified message backgrounds and positive callouts.
- Danger / Expiring: `#EF4444` reserved strictly for expired alerts or error states.

## Typography

The pairing combines the warm geometric curves of **Plus Jakarta Sans** for headlines and savings percentages with the utilitarian neutrality of **Inter** for high-density tabular metadata, merchant terms, and coupon copy.

### Usage Standards
- **Discount Callouts:** Use `headline-lg` or `headline-md` with `Plus Jakarta Sans` in bold weight for percentage discounts (e.g., "30% OFF") to ensure immediate glanceability.
- **Coupon Strings:** Use `label-code` in all caps with monospaced digit behavior (`font-variant-numeric: tabular-nums`) so codes stand out sharply against prose.
- **Disclaimers & Exclusions:** Constrain to `body-sm` using neutral text (`#64748B`) to keep card interfaces unencumbered.

## Layout & Spacing

A 12-column responsive fluid grid anchored by strict maximum containment boundaries ensures optimal readability across all desktop and mobile devices.

### Grid & Breakpoints
- **Desktop (1200px+):** 12 columns, `gutter: 1.5rem`, max container width of `1280px` centered with variable margins. Deal listings display in 3-column or 4-column card matrices.
- **Tablet (768px - 1199px):** 8 columns, `gutter: 1rem`, `margin: 1.5rem`. Deal matrices collapse to 2 columns.
- **Mobile (0 - 767px):** 4 columns, `gutter-mobile: 1rem`, `margin-mobile: 1rem`. Deals stack into full-width horizontal micro-cards.

### Spacing Principles
- Use `space-sm` (8px) for internal pill chips, code box padding, and merchant icon pairing.
- Use `space-md` (16px) for interior card section dividers and inline form actions.
- Use `space-lg` (24px) for spacing between related card modules and layout clusters.
- Use `space-xl` (40px) to divide distinct thematic sections (e.g., "Trending Today" vs. "Top Cash Back Stores").

## Elevation & Depth

To maintain a clean, trustworthy affiliate experience without visual fatigue, elevation relies on low-contrast structural borders paired with ultra-diffuse ambient shadows.

### Elevation Levels
- **Level 0 (Flat / Inset):** Background containers, coupon code preview boxes, and search inputs (`border: 1px solid #E2E8F0`, `background: #F8FAFC`). No shadow.
- **Level 1 (Default Surface):** Deal cards, merchant badges, and navigation headers (`background: #FFFFFF`, `border: 1px solid #E2E8F0`, `box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04), 0 1px 2px rgba(15, 23, 42, 0.02)`).
- **Level 2 (Interactive Hover):** Triggered on hovering deal items and action cards (`transform: translateY(-2px)`, `border-color: #CBD5E1`, `box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)`).
- **Level 3 (Overlays & Modals):** Deal reveal dialogs, sticky affiliate claim bars, and floating drawer panels (`box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 10px 10px -5px rgba(15, 23, 42, 0.04)`).

## Shapes

With a roundedness factor of `2`, the shape language establishes a friendly, approachable consumer application feel without compromising dense data alignment.

### Geometry Specifications
- **Small Elements (Pills, Chips, Badges):** 0.5rem (8px) border radius for compact tags; fully rounded pill shapes are allowed specifically for verified indicator icons and quick-filter category pills.
- **Input Fields & Buttons:** 0.5rem (8px) radius, providing clean ergonomic finger targets on touch surfaces.
- **Cards & Modals:** 1rem (16px) radius (`rounded-lg`) creates soft, approachable containment boundaries that stand out against the `#F8FAFC` base surface.
- **Coupon Cutouts:** Deal cards feature an intentional dashed outline separator (`border-style: dashed`, `border-color: #CBD5E1`) separating the merchant discount value from the reveal button.

## Components

### Buttons
- **Primary Deal Action ("Get Code" / "Shop Deal"):** Filled `#10B981` background, `#FFFFFF` text, font `label-lg`. On hover, shifts to `#059669`. Includes an intentional scissor, ticket, or forward arrow icon.
- **Secondary Action ("Copy Code"):** Outlined `#0F172A` text on pure white, `border: 1.5px solid #0F172A`. Transitions to solid `#0F172A` with `#FFFFFF` text on hover.
- **Ghost Action:** Low-contrast `#64748B` text, transparent background, used for "Terms & Exclusions" disclosures.

### Cards (Deal & Coupon)
- Dual-segment architecture: Left quadrant displays merchant logo (48x48px container) and deal headline (e.g., "25% Off Entire Order"); right quadrant houses the "Show Code" CTA.
- Top corner supports absolute-positioned chips (e.g., "Verified Today", "Staff Pick", or "Expiring Soon").
- Border styling uses `#E2E8F0` with a hover shift to `#10B981` subtle outline (`box-shadow: 0 0 0 1px #10B981`).

### Chips & Badges
- **Verified Badge:** `#ECFDF5` fill with `#059669` text and a green checkmark icon.
- **Urgent / Expiring Chip:** `#FEF3C7` fill with `#D97706` text for deals closing within 24 hours.
- **Cash Back Multiplier:** Solid `#0F172A` background with crisp `#10B981` accent text (e.g., "Was 2% -> Now 10%").

### Code Reveal Box
- Pre-click state: Renders a masked button with simulated dashed ticket edges and a "Show Code" tease.
- Post-click state: Shifts to an inset container (`background: #F1F5F9`, `border: 1px dashed #94A3B8`) displaying the raw code in `label-code` typography alongside an active "Copied!" notification pill.

### Search & Filter Bar
- Large input field with a 48px height, `#FFFFFF` fill, and a prominent leading search icon.
- Features a floating "Search thousands of stores & coupons..." placeholder in `#94A3B8`.
- Focus state highlights with a crisp `#10B981` ring (`box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2)`).

### Checkboxes & Radio Controls
- Base control dimensions: 20x20px with a 4px corner radius for checkboxes, 100% round for radios.
- Inactive: `#FFFFFF` fill with `#CBD5E1` border.
- Active: `#10B981` solid fill with crisp white glyph.