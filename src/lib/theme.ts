"use client";

import { supabase } from "@/lib/supabase/client";

export type ThemePreset =
  | "default"
  | "rose"
  | "sage"
  | "navy"
  | "burgundy"
  | "gold"
  | "forest"
  | "twilight";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeColors> = {
  default: {
    primary: "#a18a55",
    secondary: "#8b7355",
    accent: "#d4af37",
    background: "#fafafa",
  },
  rose: {
    primary: "#c9a4a4",
    secondary: "#a67c7c",
    accent: "#e8c4c4",
    background: "#fdf5f5",
  },
  sage: {
    primary: "#8da399",
    secondary: "#6b8076",
    accent: "#b5c4b9",
    background: "#f5f8f6",
  },
  navy: {
    primary: "#2c3e50",
    secondary: "#1a252f",
    accent: "#34495e",
    background: "#f8f9fa",
  },
  burgundy: {
    primary: "#722f37",
    secondary: "#4a1f24",
    accent: "#943a42",
    background: "#fdf8f8",
  },
  gold: {
    primary: "#c9a227",
    secondary: "#8b6914",
    accent: "#e6c552",
    background: "#fdfbf0",
  },
  forest: {
    primary: "#2d5a3d",
    secondary: "#1e3d29",
    accent: "#4a7c59",
    background: "#f4f8f5",
  },
  twilight: {
    primary: "#4a4063",
    secondary: "#2e2840",
    accent: "#6b5b8c",
    background: "#f5f4f8",
  },
};

const THEME_CONFIG_KEYS = [
  "theme_preset",
  "primary_color",
  "secondary_color",
  "accent_color",
  "bg_color",
];

export async function fetchThemeConfig(): Promise<{
  preset: ThemePreset;
  colors: ThemeColors;
} | null> {
  const { data } = await supabase
    .from("wedding_config")
    .select("key, value")
    .in("key", THEME_CONFIG_KEYS);

  if (!data || data.length === 0) return null;

  const config: Record<string, string> = {};
  data.forEach((item) => {
    config[item.key] = item.value;
  });

  const preset = (config.theme_preset || "default") as ThemePreset;
  const colors: ThemeColors = {
    primary: config.primary_color || THEME_PRESETS[preset].primary,
    secondary: config.secondary_color || THEME_PRESETS[preset].secondary,
    accent: config.accent_color || THEME_PRESETS[preset].accent,
    background: config.bg_color || THEME_PRESETS[preset].background,
  };

  return { preset, colors };
}

export function applyThemeColors(colors: ThemeColors) {
  const root = document.documentElement;
  
  // Convert HEX to RGB space-separated format
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;
    return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
  };
  
  // Set Tailwind CSS variables with rgb() function
  root.style.setProperty("--primary", `rgb(${hexToRgb(colors.primary)})`);
  root.style.setProperty("--secondary", `rgb(${hexToRgb(colors.secondary)})`);
  root.style.setProperty("--accent", `rgb(${hexToRgb(colors.accent)})`);
  root.style.setProperty("--background", `rgb(${hexToRgb(colors.background)})`);
  
  // Also set theme-* variables for backward compatibility
  root.style.setProperty("--theme-primary", colors.primary);
  root.style.setProperty("--theme-secondary", colors.secondary);
  root.style.setProperty("--theme-accent", colors.accent);
  root.style.setProperty("--theme-background", colors.background);
}

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}
