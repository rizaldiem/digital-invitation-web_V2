"use client";

import { useEffect, useState } from "react";

interface ThemeDebugProps {
  visible?: boolean;
}

export function ThemeDebug({ visible = false }: ThemeDebugProps) {
  const [vars, setVars] = useState<Record<string, string>>({});

  useEffect(() => {
    const updateVars = () => {
      const root = document.documentElement;
      const newVars: Record<string, string> = {};
      
      const keys = [
        '--primary', '--secondary', '--accent', '--background', '--text',
        '--theme-primary', '--theme-secondary', '--theme-accent', '--theme-background',
        '--color-primary', '--color-foreground', '--color-background'
      ];
      
      keys.forEach(key => {
        const value = root.style.getPropertyValue(key);
        if (value) {
          newVars[key] = value;
        }
      });
      
      setVars(newVars);
    };

    updateVars();
    
    const interval = setInterval(updateVars, 500);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
      <div className="font-bold mb-2 text-yellow-400">🎨 Theme Debug</div>
      <div className="space-y-1">
        {Object.entries(vars).map(([key, value]) => (
          <div key={key} className="flex items-center gap-2">
            <span className="text-gray-400">{key}:</span>
            <span 
              className="px-2 py-0.5 rounded" 
              style={{ 
                backgroundColor: key.includes('primary') || key.includes('accent') || key.includes('background') 
                  ? `rgb(${value})` 
                  : 'transparent',
                color: 'white'
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThemeColorsDebug() {
  const [colors, setColors] = useState<{primary: string, accent: string, bg: string} | null>(null);

  useEffect(() => {
    const checkColors = () => {
      const root = document.documentElement;
      const primary = root.style.getPropertyValue('--primary');
      const accent = root.style.getPropertyValue('--accent');
      const bg = root.style.getPropertyValue('--background');
      
      if (primary || accent || bg) {
        setColors({
          primary: primary || 'not set',
          accent: accent || 'not set',
          bg: bg || 'not set'
        });
      }
    };

    checkColors();
    const interval = setInterval(checkColors, 500);
    return () => clearInterval(interval);
  }, []);

  if (!colors) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex gap-2">
      <div 
        className="w-8 h-8 rounded-full border-2 border-white shadow-lg" 
        style={{ backgroundColor: colors.primary !== 'not set' ? `rgb(${colors.primary})` : '#ccc' }}
        title={`Primary: ${colors.primary}`}
      />
      <div 
        className="w-8 h-8 rounded-full border-2 border-white shadow-lg" 
        style={{ backgroundColor: colors.accent !== 'not set' ? `rgb(${colors.accent})` : '#ccc' }}
        title={`Accent: ${colors.accent}`}
      />
      <div 
        className="w-8 h-8 rounded-full border-2 border-white shadow-lg" 
        style={{ backgroundColor: colors.bg !== 'not set' ? `rgb(${colors.bg})` : '#ccc' }}
        title={`Background: ${colors.bg}`}
      />
    </div>
  );
}
