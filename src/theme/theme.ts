import {
  createTheme,
  DEFAULT_THEME,
  type MantineColorShade,
  type MantineThemeOverride,
} from "@mantine/core";

// Edit any value here to change the look of the entire app.

/** Primary brand colour — used for buttons, links, highlights, etc. */
const PRIMARY_COLOR = "indigo" as const;

/**
 * Colour shade index (0–9) used as the "default" shade.
 * 6 = standard Mantine default; lower = lighter, higher = darker.
 */
const PRIMARY_SHADE: { light: MantineColorShade; dark: MantineColorShade } = {
  light: 6,
  dark: 7,
};

/** Base border radius applied to all components. */
const DEFAULT_RADIUS = "md" as const;

/** Default font size scale. */
const FONT_SIZE_BASE = "md" as const;

export const theme: MantineThemeOverride = createTheme({
  // Brand
  primaryColor: PRIMARY_COLOR,
  primaryShade: PRIMARY_SHADE,

  // Shape
  defaultRadius: DEFAULT_RADIUS,

  // Typography
  fontFamily: `var(--font-geist-sans), ${DEFAULT_THEME.fontFamily}`,
  fontFamilyMonospace: `var(--font-geist-mono), ${DEFAULT_THEME.fontFamilyMonospace}`,
  fontSizes: {
    xs: "0.75rem",
    sm: "0.875rem",
    md: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
  },
  lineHeights: {
    xs: "1.4",
    sm: "1.45",
    md: "1.55",
    lg: "1.6",
    xl: "1.65",
  },
  headings: {
    fontFamily: `var(--font-geist-sans), ${DEFAULT_THEME.fontFamily}`,
    fontWeight: "700",
    sizes: {
      h1: { fontSize: "2.25rem", lineHeight: "1.2" },
      h2: { fontSize: "1.75rem", lineHeight: "1.25" },
      h3: { fontSize: "1.375rem", lineHeight: "1.3" },
      h4: { fontSize: "1.125rem", lineHeight: "1.35" },
      h5: { fontSize: "1rem", lineHeight: "1.4" },
      h6: { fontSize: "0.875rem", lineHeight: "1.45" },
    },
  },

  // Spacing
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
  },

  // Shadows
  shadows: {
    xs: "0 1px 2px rgba(0,0,0,.06)",
    sm: "0 1px 4px rgba(0,0,0,.08)",
    md: "0 4px 12px rgba(0,0,0,.1)",
    lg: "0 8px 24px rgba(0,0,0,.12)",
    xl: "0 16px 48px rgba(0,0,0,.14)",
  },

  // Component defaults
  components: {
    Button: {
      defaultProps: {
        radius: DEFAULT_RADIUS,
        size: FONT_SIZE_BASE,
      },
    },
    TextInput: {
      defaultProps: {
        radius: DEFAULT_RADIUS,
        size: FONT_SIZE_BASE,
      },
    },
    Select: {
      defaultProps: {
        radius: DEFAULT_RADIUS,
        size: FONT_SIZE_BASE,
      },
    },
    Paper: {
      defaultProps: {
        radius: DEFAULT_RADIUS,
        shadow: "sm",
      },
    },
    Badge: {
      defaultProps: {
        radius: "sm",
      },
    },
    Notification: {
      defaultProps: {
        radius: DEFAULT_RADIUS,
      },
    },
    Progress: {
      defaultProps: {
        radius: "xl",
      },
    },
  },
});
