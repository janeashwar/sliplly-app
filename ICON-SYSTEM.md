# Sliplly Icon System

## Style
**ONE consistent icon library: Ionicons (outline/thin style)**

All icons across the app use `@expo/vector-icons` Ionicons with the `-outline` suffix for consistency. This gives a clean, modern, premium look.

## Bottom Tab Bar
- **Unselected**: Outline icons (`grid-outline`, `car-outline`, `calendar-outline`)
- **Selected**: Filled icons (`grid`, `car`, `calendar`)
- This provides premium visual feedback that even Apple doesn't do

## Standardized Sizes
| Size | Pixels | Use Case |
|------|--------|----------|
| tiny | 12 | Inline badges, very small indicators |
| small | 14 | Meta items, inline info, list secondary |
| medium | 18 | Standalone info icons, nav arrows, input prefixes |
| large | 20 | Action icons, drawer items, card icons |
| xl | 24 | Back buttons, prominent actions |
| xxl | 48 | Empty states, error states, feature icons |

## Color Rules
Always use theme system colors:
- `colors.text.primary` — prominent icons
- `colors.text.secondary` — standard icons  
- `colors.text.tertiary` — muted/decorative icons
- `colors.accent.primary` — active/selected icons
- `colors.semantic.*` — status icons

## Common Icon Names
See `src/theme/icons.ts` for the full icon constants.

## Haptic Feedback
Every interactive element has haptic feedback:
- **Light**: Text input, typing, scrolling, navigation arrows
- **Medium**: Card taps, button presses, tab switches
- **Heavy**: FAB press, booking confirmation, destructive actions
- **Success**: Booking created, form submitted
- **Warning**: Validation errors, missing fields
- **Error**: API failures, critical errors
- **Selection**: Dropdown, segmented control, toggle, picker

## Adding New Icons
1. Always use `-outline` suffix
2. Use standardized sizes from the table above
3. Use theme colors, never hardcode colors
4. Add haptic feedback to any pressable element
