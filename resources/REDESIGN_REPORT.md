# ElbaIntimo Admin UI Redesign — Change Report

Every file changed for the ElbaIntimo UI refresh, with a one-line reason.

## Design tokens and global CSS
- **resources/css/app.css** — Updated palette (burgundy, beige, beige-2, muted, accent, success, warning, danger), theme vars, .dark overrides, typography weights, .card / .btn-primary / .muted-text / .card-shadow / .subtle-border utilities, @media print for black ink and no-print.

## Document shell and fonts
- **resources/views/app.blade.php** — Instrument Sans 600/700 added; html background uses beige/dark hex for first paint.

## Layouts
- **resources/js/layouts/app-layout.tsx** — REDESIGN comment only; props unchanged.
- **resources/js/layouts/app/app-sidebar-layout.tsx** — REDESIGN comment; main content bg-beige/30.
- **resources/js/components/app-sidebar.tsx** — REDESIGN comment; increased padding; sidebar CSS vars for burgundy active state.
- **resources/js/components/app-sidebar-header.tsx** — REDESIGN comment; compact header, beige/50 bg, shadow.
- **resources/js/components/breadcrumbs.tsx** — REDESIGN comment; muted small text; current page serif H4-style; link hover.
- **resources/js/layouts/auth/auth-simple-layout.tsx** — REDESIGN comment; centered beige soft card, larger logo, serif title.

## Shared UI components
- **resources/js/components/ui/button.tsx** — REDESIGN comment; default burgundy, outline border-burgundy, ghost muted, destructive, rounded-[10px], duration-150.
- **resources/js/components/ui/card.tsx** — REDESIGN comment; rounded-2xl, soft shadow, subtle border.
- **resources/js/components/ui/badge.tsx** — REDESIGN comment; rounded-full pill, small text, destructive uses --danger.
- **resources/js/components/image-upload.tsx** — REDESIGN comment; preview areas rounded-xl.
- **resources/js/components/confirmation-dialog.tsx** — REDESIGN comment; DialogContent rounded-2xl, shadow.
- **resources/js/components/toast.tsx** — REDESIGN comment; toast palette (success, error, info, warning), rounded-xl.
- **resources/js/components/input-error.tsx** — REDESIGN comment; error text uses text-danger.

## Skeleton loaders
- **resources/js/components/skeleton-loaders.tsx** — REDESIGN comment; cards border-border/80, rounded-2xl.

## Pages
- **resources/js/pages/welcome.tsx** — REDESIGN comment; hero replaced with gradient block; left column white card, serif headline, CTAs (primary + outline); nav and auth unchanged.
- **resources/js/pages/dashboard.tsx** — REDESIGN comment; stats cards with icon in burgundy/10 circle, serif value; Vue d’ensemble and Activité récente cards; activity list with muted timestamps.
- **resources/js/pages/products/index.tsx** — REDESIGN comment; product cards 1:1 image, serif title, muted meta, grid xl:4-col, rounded-2xl, pagination restyle.
- **resources/js/pages/products/show.tsx** — REDESIGN comment; borders and palette alignment.
- **resources/js/pages/products/create.tsx** — REDESIGN comment; Card/Button and border tokens.
- **resources/js/pages/products/edit.tsx** — REDESIGN comment; Card/Button and border tokens.
- **resources/js/pages/categories/index.tsx** — REDESIGN comment; tree list cards, border tokens.
- **resources/js/pages/categories/show.tsx** — REDESIGN comment; card and spacing to match tokens.
- **resources/js/pages/categories/create.tsx** — REDESIGN comment; form card and buttons.
- **resources/js/pages/categories/edit.tsx** — REDESIGN comment; form card and buttons.
- **resources/js/pages/brands/index.tsx** — REDESIGN comment; grid cards, logo area rounded, border tokens.
- **resources/js/pages/brands/create.tsx** — REDESIGN comment; form card and buttons.
- **resources/js/pages/brands/edit.tsx** — REDESIGN comment; form card and buttons.
- **resources/js/pages/commands/index.tsx** — REDESIGN comment; list/table borders and palette.
- **resources/js/pages/commands/show.tsx** — REDESIGN comment; table and status/client block restyle.
- **resources/js/pages/commands/create.tsx** — REDESIGN comment; form and line-item borders.
- **resources/js/pages/commands/edit.tsx** — REDESIGN comment; form and line-item borders.
- **resources/js/pages/commands/invoice.tsx** — REDESIGN comment; serif headings for print, no-print controls styled; print relies on app.css.
- **resources/js/pages/clients/index.tsx** — REDESIGN comment; client cards grid, border tokens.
- **resources/js/pages/auth/login.tsx** — REDESIGN comment; form in auth layout (styling via layout).
- **resources/js/pages/auth/register.tsx** — REDESIGN comment; form in auth layout.
- **resources/js/pages/auth/forgot-password.tsx** — REDESIGN comment; form in auth layout.
- **resources/js/pages/auth/reset-password.tsx** — REDESIGN comment; form in auth layout.
- **resources/js/pages/auth/verify-email.tsx** — REDESIGN comment; form in auth layout.
- **resources/js/pages/auth/confirm-password.tsx** — REDESIGN comment; form in auth layout.
- **resources/js/pages/auth/two-factor-challenge.tsx** — REDESIGN comment; form in auth layout.
- **resources/js/pages/settings/profile.tsx** — REDESIGN comment; sections and cards to match tokens.
- **resources/js/pages/settings/password.tsx** — REDESIGN comment; sections and cards to match tokens.
- **resources/js/pages/settings/appearance.tsx** — REDESIGN comment; sections and cards to match tokens.
- **resources/js/pages/settings/two-factor.tsx** — REDESIGN comment; sections and cards to match tokens.
