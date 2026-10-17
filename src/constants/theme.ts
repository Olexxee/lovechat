export const colors = {
  background: "#FAF7F5",
  surface: "#FFFFFF",
  surfaceSoft: "#F4E5E5",
  surfaceWarm: "#F7EFEB",

  primary: "#B85C70",
  primaryDark: "#873E52",
  primarySoft: "#F1DDE0",

  text: "#292326",
  textSecondary: "#74696D",
  textMuted: "#9B9094",

  border: "#EAE1E0",
  divider: "#F0E8E6",
  success: "#2F806A",
  warning: "#A66D2B",
  danger: "#B54658",

  white: "#FFFFFF",
  black: "#000000",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  huge: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  round: 999,
} as const;

export const typography = {
  title: 34,
  heading: 30,
  subheading: 21,
  body: 16,
  bodySmall: 14,
  label: 13,
  caption: 12,
} as const;
