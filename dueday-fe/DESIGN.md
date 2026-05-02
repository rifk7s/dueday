---
name: Test
colors:
  surface: "#f8f9ff"
  surface-dim: "#d1dbec"
  surface-bright: "#f8f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#eef4ff"
  surface-container: "#e5eeff"
  surface-container-high: "#dfe9fa"
  surface-container-highest: "#d9e3f4"
  on-surface: "#121c28"
  on-surface-variant: "#584237"
  inverse-surface: "#27313e"
  inverse-on-surface: "#eaf1ff"
  outline: "#8c7164"
  outline-variant: "#e0c0b1"
  surface-tint: "#9d4300"
  primary: "#9d4300"
  on-primary: "#ffffff"
  primary-container: "#f97316"
  on-primary-container: "#582200"
  inverse-primary: "#ffb690"
  secondary: "#944a00"
  on-secondary: "#ffffff"
  secondary-container: "#fd933d"
  on-secondary-container: "#693300"
  tertiary: "#625e56"
  on-tertiary: "#ffffff"
  tertiary-container: "#a09a91"
  on-tertiary-container: "#36322c"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#ffdbca"
  primary-fixed-dim: "#ffb690"
  on-primary-fixed: "#341100"
  on-primary-fixed-variant: "#783200"
  secondary-fixed: "#ffdcc5"
  secondary-fixed-dim: "#ffb783"
  on-secondary-fixed: "#301400"
  on-secondary-fixed-variant: "#713700"
  tertiary-fixed: "#e9e1d8"
  tertiary-fixed-dim: "#ccc5bc"
  on-tertiary-fixed: "#1e1b15"
  on-tertiary-fixed-variant: "#4a463f"
  background: "#f8f9ff"
  on-background: "#121c28"
  surface-variant: "#d9e3f4"
typography:
  h1:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: "700"
    lineHeight: "1.2"
    letterSpacing: -0.02em
  h2:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: "700"
    lineHeight: "1.3"
    letterSpacing: -0.01em
  h3:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: "600"
    lineHeight: "1.4"
  body-lg:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: "400"
    lineHeight: "1.6"
  body-sm:
    fontFamily: Lexend
    fontSize: 14px
    fontWeight: "400"
    lineHeight: "1.5"
  label-bold:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: "700"
    lineHeight: "1"
    letterSpacing: 0.05em
  button:
    fontFamily: Lexend
    fontSize: 16px
    fontWeight: "600"
    lineHeight: "1"
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-padding: 20px
  gutter: 12px
---

## Brand & Style

This design system is built on the pillars of efficiency, clarity, and encouragement. Designed specifically for modern platforms and high-achieving, the aesthetic is **Minimalist-Modern**. It strips away visual clutter to reduce cognitive load, allowing students to focus entirely on their deadlines.

The style utilizes a "Flat-Plus" approach—mostly flat surfaces paired with intentional gradients and soft depth to guide the eye toward action. The atmosphere is professional and academic yet remains approachable through the warmth of its orange palette, moving away from the coldness often associated with institutional software.

## Colors

The palette is dominated by a vibrant, energetic orange that signifies urgency and action. The primary orange (#F97316) is used for high-priority calls to action and critical status indicators. The secondary light orange (#FB923C) provides a softer alternative for secondary actions and progress bars.

The background system relies on a clean white base, occasionally giving way to soft orange gradients (#FFF7ED) to define different sections of the application without using harsh lines. Text is rendered in a deep charcoal neutral to ensure WCAG AA accessibility compliance against the warm backgrounds.

## Typography

Lexend is the core typeface for this design system, chosen for its pedagogical origins and exceptional readability. Headings are set in bold weights with tight letter-spacing to create a sense of authority and importance.

Body text remains spacious and clean to facilitate quick scanning of assignment descriptions. Labels utilize a bold, uppercase treatment to differentiate administrative metadata (like course codes or dates) from user-generated content.

## Layout & Spacing

The layout follows a fluid 8px grid system. For mobile interfaces, a standard 4-column grid is used with 20px side margins to keep content comfortably away from the screen edges.

The vertical rhythm is tight, using 16px increments to group related items (like an assignment title and its due date) and 32px increments to separate distinct sections (like "Due Today" and "Upcoming"). Content containers should prioritize vertical stacking to maintain a "list-first" mentality suitable for task management.

## Elevation & Depth

Depth is communicated through a mix of **Tonal Layers** and **Ambient Shadows**. This design system avoids heavy drop shadows in favor of a "soft-lift" effect.

Cards and interactive elements use a very subtle, diffused shadow (0px 4px 20px, 5% opacity of the primary orange) to appear as if they are floating slightly above the soft gradient background. When an element is in a "pressed" or "active" state, the shadow is removed, and the element may receive a subtle inset tint to simulate physical interaction.

## Shapes

The shape language is the primary differentiator for this design system. It utilizes a "Top-Heavy" rounding logic. Main content cards feature a signature 28px radius on the top-left and top-right corners, while the bottom corners remain square or have a minimal 4px radius; this creates a drawer-like appearance that suggests information is rising from the bottom of the screen.

Buttons are strictly pill-shaped (fully rounded) to maximize their "tapability" and contrast against the more architectural cards. Input fields use a moderate 12px radius to balance the sharp headers and soft buttons.

## Components

### Buttons

Buttons are pill-shaped and high-contrast. The primary button uses a solid fill of #F97316 with white text. Secondary buttons use a transparent fill with a 2px outline of the primary color. All buttons include a subtle transition effect on hover/active states.

### Cards

Cards are the primary container for assignments. They must feature the 28px top-corner radius. The background is pure white (#FFFFFF). To indicate different assignment categories or subjects, a 4px vertical accent bar of color can be added to the left-most edge of the card.

### Input Fields

Inputs are outlined with a 1.5px border in a light gray (#D1D5DB). Upon focus, the border transitions to the primary orange. Every input field must be accompanied by a 20px functional icon (e.g., a calendar icon for date pickers or a book icon for subject selection) positioned inside the left edge of the field.

### Chips & Badges

Small, pill-shaped indicators used for "Subject Tags" or "Priority Levels." These should use low-saturation versions of the primary color with dark text to ensure they do not compete with primary buttons for the user's attention.

### Progress Indicators

Linear progress bars used to show how close a student is to finishing a task or a semester. These utilize the secondary light orange (#FB923C) to provide a "warm" sense of progress without the high-alert feel of the primary orange.
