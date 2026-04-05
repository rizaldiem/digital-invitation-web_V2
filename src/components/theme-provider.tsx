"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { fetchThemeConfig, applyThemeColors, ThemeColors } from "@/lib/theme";

import { Theme } from "@/types/section";

interface ThemeProviderProps {
  children: React.ReactNode;
  theme?: Theme;
}

export function ThemeProvider({ children, theme }: ThemeProviderProps) {
  const [themeLoaded, setThemeLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      // If theme is passed as prop, use it directly
      if (theme) {
        const themeConfig = {
          colors: {
            primary: theme.primary_color || "#a18a55",
            secondary: theme.secondary_color || "#8b7355",
            accent: theme.accent_color || "#d4af37",
            background: theme.background_color || "#fafafa",
          },
          preset: "default"
        };
        applyThemeColors(themeConfig.colors);
        setThemeLoaded(true);
        return;
      }

      // Otherwise, load from database
      const { data } = await supabase
        .from("wedding_config")
        .select("key, value");

      if (!data) {
        setThemeLoaded(true);
        return;
      }

      const config: Record<string, string> = {};
      data.forEach((item) => {
        config[item.key] = item.value;
      });
      
      const themeConfig = await fetchThemeConfig();
      if (themeConfig) {
        applyThemeColors(themeConfig.colors);
        
        const presetClass = `theme-${themeConfig.preset}`;
        if (themeConfig.preset !== "default") {
          document.documentElement.classList.add(presetClass);
        }
      } else {
        const defaultColors: ThemeColors = {
          primary: "#a18a55",
          secondary: "#8b7355",
          accent: "#d4af37",
          background: "#fafafa",
        };
        applyThemeColors(defaultColors);
      }
      setThemeLoaded(true);
    }

    loadTheme();

    const channel = supabase
      .channel("theme-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wedding_config",
        },
        async (payload: any) => {
          if (
            payload.new &&
            (payload.new.key === "theme_preset" ||
              payload.new.key === "primary_color" ||
              payload.new.key === "secondary_color" ||
              payload.new.key === "accent_color" ||
              payload.new.key === "bg_color")
          ) {
            fetchThemeConfig().then((config) => {
              if (config) {
                applyThemeColors(config.colors);
              }
            });
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (!themeLoaded) {
    return null;
  }

  return <>{children}</>;
}
