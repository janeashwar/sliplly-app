/**
 * Icon System — Sliplly
 *
 * ONE consistent icon style throughout: Ionicons outline/thin style
 * For BOTTOM TAB BAR: outline icons for unselected, FILLED for selected
 *
 * Standardized sizes:
 *   tiny: 12   — inline badges, very small indicators
 *   small: 14  — meta items, inline info, list secondary
 *   medium: 18 — standalone info icons, nav arrows, input prefixes
 *   large: 20  — action icons, drawer items, card icons
 *   xl: 24     — back buttons, prominent actions
 *   xxl: 48    — empty states, error states, feature icons
 *
 * Colors should always come from the theme system:
 *   colors.text.primary    — prominent icons
 *   colors.text.secondary  — standard icons
 *   colors.text.tertiary   — muted/decorative icons
 *   colors.accent.primary  — active/selected icons
 *   colors.semantic.*      — status icons
 */

export const iconSizes = {
  tiny: 12,
  small: 14,
  medium: 18,
  large: 20,
  xl: 24,
  xxl: 48,
} as const;

// Common icon names — use these for consistency
export const icons = {
  // Navigation
  back: 'arrow-back-outline' as const,
  forward: 'arrow-forward-outline' as const,
  chevronRight: 'chevron-forward' as const,
  chevronLeft: 'chevron-back' as const,
  close: 'close-outline' as const,
  closeCircle: 'close-circle-outline' as const,

  // Actions
  add: 'add-outline' as const,
  edit: 'create-outline' as const,
  delete: 'trash-outline' as const,
  search: 'search-outline' as const,
  filter: 'filter-outline' as const,
  share: 'share-outline' as const,
  download: 'download-outline' as const,
  copy: 'copy-outline' as const,
  refresh: 'sync-outline' as const,

  // Status
  checkmark: 'checkmark-outline' as const,
  checkmarkCircle: 'checkmark-circle-outline' as const,
  alert: 'alert-circle-outline' as const,
  warning: 'warning-outline' as const,
  info: 'information-circle-outline' as const,

  // Entities
  person: 'person-outline' as const,
  people: 'people-outline' as const,
  car: 'car-outline' as const,
  calendar: 'calendar-outline' as const,
  time: 'time-outline' as const,
  location: 'location-outline' as const,
  call: 'call-outline' as const,
  mail: 'mail-outline' as const,
  wallet: 'wallet-outline' as const,
  briefcase: 'briefcase-outline' as const,
  document: 'document-text-outline' as const,
  receipt: 'receipt-outline' as const,
  star: 'star-outline' as const,
  starFilled: 'star' as const,
  settings: 'settings-outline' as const,
  notifications: 'notifications-outline' as const,
  home: 'home-outline' as const,
  grid: 'grid-outline' as const,
  menu: 'menu-outline' as const,

  // Data
  trendingUp: 'trending-up-outline' as const,
  barChart: 'bar-chart-outline' as const,
  pieChart: 'pie-chart-outline' as const,
} as const;
