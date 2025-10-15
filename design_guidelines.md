# Design Guidelines: Real-Time Trading Prediction System

## Design Approach
**System Selected:** Carbon Design System + Trading Platform Patterns (TradingView/Bloomberg-inspired)
**Rationale:** This is a data-intensive, real-time financial application where clarity, efficiency, and instant comprehension are critical. Carbon excels at handling complex enterprise data while maintaining visual hierarchy.

## Core Design Principles
1. **Data First:** Every pixel serves the purpose of delivering actionable information
2. **Glanceable Metrics:** Critical data (price, signal, confidence) readable in < 1 second
3. **Progressive Disclosure:** Advanced features accessible but not cluttering primary view
4. **Zero Ambiguity:** Color coding and visual signals must be instantly interpretable

---

## Color Palette

### Dark Mode Primary (Default)
- **Background Base:** 220 15% 8% (deep blue-gray, reduces eye strain)
- **Surface:** 220 15% 12% (cards, panels)
- **Surface Elevated:** 220 15% 16% (overlays, modals)

### Trading Signals (Semantic)
- **Bullish/Up:** 142 76% 45% (vibrant green, high contrast)
- **Bearish/Down:** 0 84% 55% (strong red, unmistakable)
- **Neutral/Inactive:** 220 10% 50% (muted gray)
- **Confidence High:** 142 76% 45% at 80% opacity
- **Confidence Low:** 142 76% 45% at 30% opacity

### UI Accents
- **Primary Interactive:** 210 100% 56% (blue for buttons, links)
- **Warning:** 38 92% 50% (amber for alerts, threshold warnings)
- **Success:** 142 76% 45% (same as bullish for consistency)
- **Text Primary:** 220 5% 95% (near white, high readability)
- **Text Secondary:** 220 5% 65% (labels, metadata)
- **Border Subtle:** 220 15% 20% (dividers, containers)

---

## Typography

**Font Stack:** 'Inter' for UI, 'JetBrains Mono' for numerical data
- **Display (Metrics):** 3rem (48px), weight 600, tracking -0.02em — Current price, large signals
- **Headline (Sections):** 1.5rem (24px), weight 500 — Panel headers
- **Body (Data):** 0.875rem (14px), weight 400 — General content, labels
- **Monospace (Numbers):** 0.875rem (14px), 'JetBrains Mono', weight 500 — Prices, percentages, time
- **Caption (Meta):** 0.75rem (12px), weight 400 — Timestamps, footnotes

---

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 16 (0.5rem, 1rem, 2rem, 4rem)
- Micro spacing (icons, badges): p-2, gap-2
- Component spacing (cards, inputs): p-4, gap-4  
- Section spacing (panels, grids): p-8, gap-8
- Major spacing (page layout): p-16, gap-16

**Grid Structure:**
- Main canvas: 3-column grid on desktop (sidebar-16 | chart-68 | metrics-16)
- Chart area: Full-bleed with internal padding of p-4
- Responsive breakpoints: Stack to single column < 1024px

---

## Component Library

### Navigation & Controls
- **Top Bar:** h-16, fixed position, contains play/pause, timeframe selector, settings icon
- **Sidebar (Left):** w-64, contains current price, last signal, probability badge, quick stats
- **Control Buttons:** Rounded-lg, h-10, px-4, with icon + label, blue primary or ghost variants

### Data Visualization
- **Main Chart:** Full-height candlestick chart (1min candles) using TradingView Lightweight Charts aesthetic
  - Green candles (up): Fill with bullish color
  - Red candles (down): Fill with bearish color
  - Prediction arrows: Overlaid above/below candles, sized based on confidence (1rem-2rem)
  - Confidence band: Semi-transparent gradient ribbon (20-40% opacity)

### Metrics & Indicators
- **Stat Cards:** Rounded-lg, p-4, background surface color
  - Large number (display size) in monospace
  - Label below in caption size
  - Trend indicator (arrow + %) in corner
- **Success Rate Display:** Circular progress ring (120px diameter) or horizontal bar with percentage
  - Color interpolates green→yellow→red based on performance
  - Time-window selector (1h/24h/7d) as segmented control below

### Signal History Table
- **Compact Table:** Alternating row backgrounds (base/surface), h-12 rows
- **Columns:** Time (monospace) | Direction (icon + text) | Probability (progress bar) | Result (checkmark/x)
- **Sticky header:** Background surface-elevated, border-b-2
- **Row hover:** Subtle brightness increase (+5%)

### Prediction Overlay Panel
- **Floating Card:** Positioned top-right of chart, rounded-xl, backdrop-blur-md
- **Content:** 
  - Large direction icon (2rem)
  - Probability percentage (display typography)
  - Confidence level text ("High/Medium/Low")
  - Micro chart showing feature importance (optional, collapsible)

---

## Interaction Patterns

### Real-time Updates
- **WebSocket Connected:** Subtle pulse animation on connection status dot (green, 0.5s interval)
- **New Signal:** Brief highlight flash on prediction panel (200ms, glow effect)
- **Price Update:** Smooth number transition using CSS counters or FLIP animation (100ms)

### User Actions
- **Chart Interaction:** Crosshair cursor on hover, tooltip shows OHLC + prediction if present
- **Metric Cards:** Click to expand full-screen modal with detailed breakdown
- **Signal Arrows:** Click reveals feature attribution panel (SHAP values as horizontal bars)
- **Timeframe Switch:** Instant update, no loading states needed (pre-fetch data)

### Feedback States
- **Loading:** Skeleton screens with shimmer effect (surface color → surface-elevated)
- **Error:** Red toast notification (top-right, auto-dismiss 5s)
- **Success:** Green toast for actions like "Model retrained successfully"

---

## Responsive Strategy

**Desktop (≥1280px):** Full 3-column layout, chart dominates center
**Tablet (768-1279px):** 2-column (chart + collapsible sidebar), metrics in bottom drawer
**Mobile (<768px):** Single column stack, chart full-width, swipeable metric cards

---

## Accessibility & Readability

- **Contrast Ratios:** All text meets WCAG AAA (7:1 minimum) against backgrounds
- **Focus States:** 2px offset ring in primary blue (ring-2 ring-offset-2 ring-blue-500)
- **Keyboard Navigation:** All controls accessible via Tab, Enter/Space activates
- **Screen Reader:** Aria-live regions for price updates and new signals
- **Color Independence:** Signal direction shown via icon + text, not color alone

---

## Animation Guidelines

**Use Sparingly:**
- Price changes: Subtle fade-in of new value (150ms)
- Signal appearance: Scale-in from 0.9→1.0 (200ms ease-out)
- Chart scrolling: Smooth pan with momentum (disabled by default, user toggle)

**Avoid:**
- Continuous animations (except connection pulse)
- Distracting transitions on critical data
- Parallax or decorative motion

---

## Special Considerations

**Performance Indicators:**
- Latency display: Show WebSocket ping in ms (top bar, monospace, updates every 1s)
- Data freshness: Timestamp of last tick (relative time, "2s ago")

**Educational Overlays:**
- First-time user: Guided tour using spotlight technique (dim surroundings, highlight feature)
- Feature tooltips: Appear on hover after 500ms delay, dismiss on mouse-out

**Disclaimers:**
- Legal notice: Fixed bottom banner (dismissible), h-12, yellow warning background
- Risk warning: Modal on first load, requires checkbox acknowledgment

This system prioritizes instant comprehension and decision-making speed while maintaining visual polish appropriate for a professional trading tool.