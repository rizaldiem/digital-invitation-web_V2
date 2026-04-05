export type InvitationTheme = {
  name: string
  label: string
  preview: string
  variables: Record<string, string>
}

export const invitationThemes: InvitationTheme[] = [
  {
    name: "greenery",
    label: "Classic Greenery",
    preview: "/themes/greenery.jpg",
    variables: {
      "--primary": "107 142 115",
      "--accent": "163 177 138",
      "--background": "255 255 255",
      "--text": "47 62 52"
    }
  },
  {
    name: "rose",
    label: "Elegant Rose",
    preview: "/themes/rose.jpg",
    variables: {
      "--primary": "232 160 191",
      "--accent": "199 106 138",
      "--background": "255 255 255",
      "--text": "74 44 55"
    }
  },
  {
    name: "gold",
    label: "Modern Gold",
    preview: "/themes/gold.jpg",
    variables: {
      "--primary": "201 162 39",
      "--accent": "166 124 0",
      "--background": "255 255 255",
      "--text": "43 43 43"
    }
  },
  {
    name: "dark",
    label: "Dark Romance",
    preview: "/themes/dark.jpg",
    variables: {
      "--primary": "122 62 72",
      "--accent": "183 110 121",
      "--background": "18 18 18",
      "--text": "245 245 245"
    }
  }
]

export function applyThemeVariables(theme: InvitationTheme) {
  const root = document.documentElement
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  
  // Also set --theme-* variables that CSS classes expect
  if (theme.variables["--primary"]) {
    const primaryRgb = theme.variables["--primary"]
    root.style.setProperty("--theme-primary", `${parseInt(primaryRgb.split(' ')[0])}, ${parseInt(primaryRgb.split(' ')[1])}, ${parseInt(primaryRgb.split(' ')[2])}`)
  }
  if (theme.variables["--accent"]) {
    const accentRgb = theme.variables["--accent"]
    root.style.setProperty("--theme-accent", `${parseInt(accentRgb.split(' ')[0])}, ${parseInt(accentRgb.split(' ')[1])}, ${parseInt(accentRgb.split(' ')[2])}`)
  }
  if (theme.variables["--background"]) {
    const bgRgb = theme.variables["--background"]
    root.style.setProperty("--theme-background", `${parseInt(bgRgb.split(' ')[0])}, ${parseInt(bgRgb.split(' ')[1])}, ${parseInt(bgRgb.split(' ')[2])}`)
  }
  // Derive secondary from primary (darkened version)
  if (theme.variables["--primary"]) {
    const primaryRgb = theme.variables["--primary"].split(' ').map(Number)
    const secondaryRgb = [
      Math.round(primaryRgb[0] * 0.7),
      Math.round(primaryRgb[1] * 0.7),
      Math.round(primaryRgb[2] * 0.7)
    ]
    root.style.setProperty("--theme-secondary", secondaryRgb.join(' '))
  }
}

export function convertHexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return hex
  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
}
