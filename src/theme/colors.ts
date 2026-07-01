// Design System — Sliplly
// Supports both Dark and Light themes
// Dark: #0A0A0A base, #d6ed6a green accent
// Light: Warm premium luxury — Linear / Notion / Things 3 inspired

// ============================================
// DARK THEME (Default) — Green accent
// ============================================
export const darkColors = {
  bg: {
    base: '#0A0A0A',
    surface: '#141414',
    elevated: '#1C1C1C',
    overlay: '#242424',
  },
  border: {
    subtle: '#1F1F1F',
    default: '#2A2A2A',
    focus: '#d6ed6a',
  },
  text: {
    primary: '#F5F5F5',
    secondary: '#A0A0A0',
    tertiary: '#666666',
    inverse: '#0A0A0A',
  },
  accent: {
    primary: '#d6ed6a',
    muted: '#a8b88a',
    dim: '#2a2e1e',
  },
  semantic: {
    success: '#34D399',
    warning: '#FBBF24',
    error: '#EF4444',
    info: '#60A5FA',
  },
  status: {
    confirmed: '#34D399',
    pending: '#FBBF24',
    cancelled: '#EF4444',
    inProgress: '#60A5FA',
  },
}

// ============================================
// LIGHT THEME — Premium Luxury (Warm Minimal)
// Inspired by Linear, Notion, Things 3, Apple Notes
//
// Key principles:
//   - No pure white (#FFF) — always warm off-white
//   - No pure black (#000) — always rich dark
//   - Muted, sophisticated colors — never bright/flashy
//   - Warm cream tints in backgrounds
//   - Subtle color variation between surfaces
//   - Human-designed feel, not AI-generated
// ============================================
export const lightColors = {
  bg: {
    base: '#F8F7F4',          // Warm linen — not sterile white
    surface: '#FEFEFE',        // Cards — barely off-white, warm
    elevated: '#FFFFFF',       // Modals — brightest surface (with shadow)
    overlay: '#F3F2EF',        // Hover/pressed states
    hover: '#EEEEE9',          // Hover state — warm gray
    pressed: '#E8E7E2',        // Pressed — deeper warm gray
  },
  border: {
    subtle: '#E6E5E0',        // Dividers — warm, barely visible
    default: '#D8D7D2',       // Input borders — soft warm gray
    focus: '#2C2C2E',         // Focus ring — warm dark, not harsh
    card: '#EDECE8',          // Card borders — very subtle
  },
  text: {
    primary: '#1C1C1E',       // Rich warm dark — Apple's dark
    secondary: '#636366',     // Muted warm gray — readable
    tertiary: '#AEAEB2',      // Placeholder — soft, not depressing
    inverse: '#FAFAF8',       // On dark surfaces — warm white
    disabled: '#C7C7CC',      // Disabled — Apple's disabled gray
  },
  accent: {
    primary: '#2C2C2E',       // Warm near-black — primary actions
    muted: '#48484A',         // Medium warm dark — hover
    dim: '#F0EFEB',           // Very light warm — subtle highlight
    subtle: '#E8E7E2',        // Subtle accent background
  },
  semantic: {
    success: '#2D8A5E',       // Muted forest green — calming
    warning: '#C4841D',       // Warm amber — not screaming yellow
    error: '#D64045',         // Warm red — not pure red
    info: '#3A7CC3',          // Muted blue — trustworthy
  },
  status: {
    confirmed: '#2D8A5E',     // Forest green
    pending: '#C4841D',       // Warm amber
    cancelled: '#8E8E93',     // Muted gray — de-emphasized
    inProgress: '#3A7CC3',    // Muted blue
  },
  // Premium gradient washes
  gradient: {
    subtle: ['#F8F7F4', '#F3F2EF'],    // Base to slightly darker
    card: ['#FEFEFE', '#F8F7F4'],       // Card top to bottom
    warm: ['#F8F7F4', '#F0EFEB'],       // Warm section wash
  },
}

// ============================================
// SHADOWS — Premium multi-layered shadows
// Shadow color is warm-tinted (not pure black)
// ============================================
export const shadows = {
  low: {
    shadowColor: '#2C2C2E',    // Warm-tinted shadow
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  medium: {
    shadowColor: '#2C2C2E',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  high: {
    shadowColor: '#2C2C2E',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
}

// ============================================
// STATUS BADGE COLORS (theme-aware)
// ============================================
export const darkStatusBadges = {
  confirmed: { bg: '#34D39918', text: '#34D399', ring: '#34D39930' },
  pending:   { bg: '#FBBF2418', text: '#FBBF24', ring: '#FBBF2430' },
  cancelled: { bg: '#EF444418', text: '#EF4444', ring: '#EF444430' },
  inProgress:{ bg: '#60A5FA18', text: '#60A5FA', ring: '#60A5FA30' },
}

// Light theme: sophisticated muted badges
export const lightStatusBadges = {
  confirmed: { bg: '#E8F5EE', text: '#2D8A5E', ring: '#2D8A5E20' },   // Soft green tint
  pending:   { bg: '#FFF3E0', text: '#C4841D', ring: '#C4841D20' },   // Warm amber tint
  cancelled: { bg: '#F2F2F7', text: '#8E8E93', ring: '#8E8E9320' },   // Neutral gray
  inProgress:{ bg: '#E3F0FF', text: '#3A7CC3', ring: '#3A7CC320' },   // Soft blue tint
}

// ============================================
// SEARCH BAR COLORS (theme-aware)
// ============================================
export const darkSearchColors = {
  barBg: '#141414',
  barBorder: '#2A2A2A',
  barBorderFocus: '#d6ed6a',
  gradientColors: ['#2a2e1e', '#0A0A0A'],
  cancelText: '#d6ed6a',
  placeholder: '#666666',
}

export const lightSearchColors = {
  barBg: '#F0EFEB',            // Warm gray — not sterile
  barBorder: '#E0DFDB',        // Subtle warm border
  barBorderFocus: '#2C2C2E',   // Warm dark focus
  gradientColors: ['#F3F2EF', '#F8F7F4'],  // Warm gradient wash
  cancelText: '#2C2C2E',       // Warm dark text
  placeholder: '#AEAEB2',      // Soft muted placeholder
}

// ============================================
// DEFAULT EXPORT (backward compatible)
// ============================================
export const colors = darkColors;
export const statusBadges = darkStatusBadges;

// ============================================
// SPACING — Premium generous spacing
// ============================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  // Premium additions
  section: 28,    // Between sections
  card: 20,       // Card internal padding
  screen: 16,     // Screen edge padding
}

// ============================================
// RADIUS — Premium refined corners
// ============================================
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
  // Premium additions
  card: 14,       // Card radius — consistent 12-16px range
  button: 10,     // Button radius
  input: 10,      // Input radius
  badge: 8,       // Badge radius
}

// ============================================
// FONT FAMILY — Poppins
// ============================================
const fontFamily = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
}

// ============================================
// TYPOGRAPHY — Premium refined type scale (Poppins)
// Proper hierarchy: not just bold everywhere
// Letter spacing and line heights refined
// ============================================
export const typography = {
  h1: { fontFamily: fontFamily.bold, fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 34 },
  h2: { fontFamily: fontFamily.semiBold, fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 28 },
  h3: { fontFamily: fontFamily.semiBold, fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.1, lineHeight: 22 },
  bodyMedium: { fontFamily: fontFamily.medium, fontSize: 15, fontWeight: '500' as const, letterSpacing: -0.1, lineHeight: 22 },
  caption: { fontFamily: fontFamily.regular, fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 18 },
  label: { fontFamily: fontFamily.semiBold, fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.6, lineHeight: 14 },
  stat: { fontFamily: fontFamily.bold, fontSize: 32, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 38 },
  statSmall: { fontFamily: fontFamily.semiBold, fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 26 },
  // Premium additions
  tiny: { fontFamily: fontFamily.medium, fontSize: 10, fontWeight: '500' as const, letterSpacing: 0.4, lineHeight: 12 },
  button: { fontFamily: fontFamily.semiBold, fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.1, lineHeight: 20 },
}

export { fontFamily }

// ============================================
// THEME TYPES
// ============================================
export type ThemeMode = 'dark' | 'light';
export type Colors = typeof darkColors;
export type StatusBadges = typeof darkStatusBadges;
