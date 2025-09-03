# TACo Website Style Guide

## Brand Identity

### Mission
TACo provides trust-minimized, decentralized end-to-end encryption and access control, enabling users to maintain privacy without relying on centralized intermediaries.

### Visual Language
- **Clean & Accessible**: Light theme prioritizing readability and clarity
- **Modern & Technical**: Minimalist design with purposeful animations
- **Trust & Security**: Professional appearance with lime green accent for innovation
- **Progressive Disclosure**: Information revealed through scroll-triggered animations and interactive elements

## Color Palette

### Light Theme (Primary)

#### Background Colors
- **Primary Background**: `#FFFFFF` - Main page background
- **Secondary Background**: `#F8F9FA` - Subtle section backgrounds
- **Tertiary Background**: `#F4F4F4` - Cards, input fields
- **Elevated Surface**: `#FFFFFF` with subtle shadow - Modals, dropdowns

#### Text Colors
- **Primary Text**: `#0A0A0A` - Main content, headlines
- **Secondary Text**: `#5A5A5A` - Supporting text, descriptions
- **Tertiary Text**: `#909090` - Hints, timestamps, metadata
- **Inverse Text**: `#FFFFFF` - Text on dark backgrounds

#### Accent Colors
- **Primary Accent**: `#96FF5E` - CTAs, active states, success
- **Secondary Accent**: `#7ACC47` - Hover states (darker lime)
- **Tertiary Accent**: `#B8FF8F` - Light highlights (lighter lime)

#### Functional Colors
- **Border Default**: `#E5E7EB` - Standard borders
- **Border Focus**: `#96FF5E` - Active/focused borders
- **Error**: `#EF4444` - Error states, warnings
- **Success**: `#96FF5E` - Success states, confirmations
- **Info**: `#3B82F6` - Informational elements

#### Dark Sections (Feature Sections)
- **Dark Background**: `#0A0A0A` - Feature sections, footer
- **Dark Surface**: `#1A1A1A` - Cards on dark background
- **Dark Border**: `#2A2A2A` - Borders on dark sections

## Typography

### Font Families

#### Display Font (Headlines)
- **Font**: ABC Diatype
- **Weight**: 700 (Bold)
- **Usage**: All headlines, hero text, section titles
- **Class**: `font-headline`

#### Monospace Font (Body/UI)
- **Font**: OCR-X
- **Features**: `"ss02" 1, "onum" 1` (stylistic sets and old-style numerals)
- **Usage**: Body text, navigation, buttons, technical content
- **Class**: `font-mono`

### Type Scale

#### Desktop Sizes
- **Hero/2xl**: 5rem/4.8rem line-height, -0.15rem letter-spacing, 700 weight
- **Section Title/xl**: 1.6rem/1.8rem line-height, -0.03rem letter-spacing
- **Body/lg**: 0.938rem/1rem line-height, 0 letter-spacing
- **List Items**: 1.25rem/1.4rem line-height, -0.02rem letter-spacing

#### Mobile Sizes
- **Hero**: 2.2rem/2.1rem line-height, -0.02rem letter-spacing
- **Section Title**: 1.25rem/1.4rem line-height, -0.02rem letter-spacing
- **Body**: 15px (0.938rem equivalent)

## Layout System

### Grid & Spacing
- **Max Width**: 90rem (1440px) for content containers
- **Desktop Padding**: 1.75rem (28px) - `p-7`
- **Mobile Padding**: 1rem (16px) - `p-4`
- **Section Height**: `min-h-[100vh]` or `min-h-[100svh]` for full viewport sections

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large Desktop**: > 1700px

### Navigation
- **Fixed Header**: White background with subtle shadow, scroll-triggered visibility
- **Mobile Menu**: Full-screen white overlay with centered navigation
- **Footer**: Light background transitioning to dark accent section

## Components & Patterns

### Buttons

#### Primary Button
- **Default**: Background `#96FF5E`, text `#0A0A0A`, rounded-xl
- **Hover**: Background `#7ACC47` (darker)
- **Active**: Background `#6BB83F`
- **Disabled**: Background `#F4F4F4`, text `#909090`

#### Secondary Button
- **Default**: Background `#F4F4F4`, text `#0A0A0A`, rounded-xl
- **Hover**: Background `#E5E7EB`
- **Active**: Border `#96FF5E`

#### Ghost Button
- **Default**: Transparent background, border `#E5E7EB`, text `#5A5A5A`
- **Hover**: Background `#F8F9FA`, text `#0A0A0A`

### Cards & Containers
- **Background**: `#FFFFFF` with subtle shadow or `#F8F9FA` without shadow
- **Border Style**: 1px solid `#E5E7EB`
- **Border Radius**: `rounded-xl` (0.75rem) for cards, `rounded-lg` for inputs
- **Shadows**: 
  - Small: `0 1px 3px rgba(0,0,0,0.08)`
  - Medium: `0 4px 6px rgba(0,0,0,0.08)`
  - Large: `0 10px 15px rgba(0,0,0,0.1)`

### Animations & Interactions

#### Scroll-Based Animations
- **Fade In**: Elements with class `fade-element`
  - Initial: `opacity: 0, translateY(50px)`
  - Active: `opacity: 1, translateY(0)`
  - Timing: 1.2s cubic-bezier(0.4, 0, 0.2, 1)

#### Parallax Effects
- **Images**: 0.4 parallax strength (0.2 on mobile)
- **Implementation**: transform3d with lerp smoothing (factor: 0.5)

#### Lottie Animations
- **Logo Animation**: Speed 3x, triggers matrix text effect
- **Section Animations**: Scroll-triggered, non-looping
- **Footer Animation**: Visibility-based replay on scroll

#### Highlight Effects
- **Green Highlight**: Delayed color transition from white to `#96FF5E`
  - Delay: 0.4s
  - Duration: 0.8s ease-in-out

#### Hover States
- **Links/Navigation**: Color transition to `#96FF5E` over 300ms
- **Accordion Items**: Height expansion with 500ms duration
- **Buttons**: Rotate transforms for plus/minus icons (45deg rotation)

### Icons & Graphics
- **Style**: Minimal line icons, consistent stroke width
- **SVG Implementation**: Inline SVG components
- **Logo Variations**: Standard (black), White (for dark backgrounds), Animated

## Design Principles for Light Theme

### Hierarchy & Contrast
- **Clear Visual Hierarchy**: Use size, weight, and color to establish importance
- **Sufficient Contrast**: Minimum 4.5:1 for body text, 3:1 for large text
- **Whitespace**: Generous spacing to improve readability and reduce cognitive load

### Data Tables & Lists
- **Zebra Striping**: Alternate row backgrounds (`#FFFFFF` / `#F8F9FA`)
- **Hover States**: Subtle background change to `#F4F4F4`
- **Selected State**: Border with `#96FF5E` accent
- **Headers**: Bold text with bottom border `#E5E7EB`

### Forms & Inputs
- **Input Fields**: White background, `#E5E7EB` border, rounded-lg
- **Focus State**: `#96FF5E` border, subtle shadow
- **Labels**: `#5A5A5A` color, positioned above input
- **Help Text**: `#909090` color, smaller font size

## Accessibility & Performance

### Optimization
- **Images**: WebP format, responsive sizing, lazy loading
- **Fonts**: WOFF2 format, font-display: swap
- **Animations**: GPU-accelerated transforms, will-change properties

### Accessibility
- **Contrast Ratios**: WCAG AA compliant (minimum 4.5:1 for normal text)
- **Focus States**: Visible focus indicators with `#96FF5E` accent
- **Screen Reader Support**: Semantic HTML, proper ARIA labels
- **Keyboard Navigation**: All interactive elements accessible via keyboard

## Code Patterns

### CSS Classes
- **Tailwind Utilities**: Primary styling method
- **Custom Classes**: Minimal, defined in main.css
- **Mobile-First**: Use `lg:` prefix for desktop overrides

### Component Structure

#### Light Section
```vue
<template>
  <section class="bg-white min-h-[100vh]">
    <div class="lg:p-7 p-4 max-w-[90rem]">
      <h2 class="font-headline text-[#0A0A0A] text-mobile-2xl lg:text-2xl">
        <!-- Title -->
      </h2>
      <h3 class="font-headline text-[#5A5A5A] text-mobile-xl lg:text-xl">
        <!-- Subtitle -->
      </h3>
    </div>
  </section>
</template>
```

#### Dark Accent Section
```vue
<template>
  <section class="bg-[#0A0A0A] min-h-[100vh]">
    <div class="lg:p-7 p-4 max-w-[90rem]">
      <h2 class="font-headline text-white text-mobile-2xl lg:text-2xl">
        <!-- Title -->
      </h2>
      <h3 class="font-headline text-[#96FF5E] text-mobile-xl lg:text-xl">
        <!-- Subtitle with accent -->
      </h3>
    </div>
  </section>
</template>
```

### Animation Implementation
```css
/* Fade in animation */
.fade-element {
  opacity: 0;
  transform: translateY(50px);
  transition: opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1),
              transform 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-in {
  opacity: 1 !important;
  transform: translateY(0) !important;
}
```

## Brand Voice & Content

### Tone
- **Professional**: Technical accuracy without jargon
- **Confident**: Direct statements about capabilities
- **Provocative**: Challenges status quo (e.g., "giving Bezos your house keys")

### Content Patterns
- **Headlines**: Bold statements with line breaks for emphasis
- **Highlights**: Key phrases in lime green for emphasis
- **Technical Terms**: Monospace font for code, APIs, technical concepts

## File Structure

### Assets
- `/assets/css/main.css` - Global styles and custom utilities
- `/assets/fonts/` - Web font files
- `/images/` - Optimized images
- `/lottie/` - Animation JSON files

### Components
- `/components/Section/` - Page sections
- `/components/Nav/` - Navigation components
- `/components/Svg/` - SVG icons and graphics

### Configuration
- `tailwind.config.js` - Design tokens and theme extensions
- `nuxt.config.ts` - Meta tags and global settings