export const THEMES = [
  { id: 'minimal',     lbl: 'Minimal',      bg: '#F7F6F3', ac: '#1A1916', tx: '#1A1916' },
  { id: 'darkpro',     lbl: 'Dark Pro',     bg: '#0D0F14', ac: '#7C6FF5', tx: '#E8EAF0' },
  { id: 'colorful',    lbl: 'Colorful',     bg: '#EDE8FF', ac: '#5B3FE8', tx: '#1E1450' },
  { id: 'warm',        lbl: 'Warm Studio',  bg: '#F9F3EC', ac: '#C25A1A', tx: '#2D1A00' },
  { id: 'noir',        lbl: 'Noir',         bg: '#111111', ac: '#F2F2F2', tx: '#F2F2F2' },
  { id: 'blueprint',   lbl: 'Blueprint',    bg: '#E8F2FB', ac: '#0A5FD6', tx: '#032044' },
  { id: 'y2k',         lbl: 'Y2K Chrome',   bg: '#C8D8E8', ac: '#0060CC', tx: '#0A1828' },
  { id: 'cottagecore', lbl: 'Cottagecore',  bg: '#F0EBE1', ac: '#5C7A3E', tx: '#2C1E0F' },
  { id: 'vaporwave',   lbl: 'Vaporwave',    bg: '#0D0520', ac: '#FF40A0', tx: '#F0E0FF' },
  { id: 'brutalist',   lbl: 'Brutalist',    bg: '#F5F0E8', ac: '#FF2200', tx: '#1A1A1A' },
  { id: 'terminal',    lbl: 'Terminal',     bg: '#030D03', ac: '#00FF55', tx: '#00DD44' },
  { id: 'risograph',   lbl: 'Risograph',    bg: '#FFF8E8', ac: '#E83A00', tx: '#1A0A00' },
  { id: 'glass',       lbl: 'Glass',        bg: '#1A2A4A', ac: '#60B0FF', tx: '#FFFFFF' },
  { id: 'solarized',   lbl: 'Solarized',    bg: '#FDF6E3', ac: '#268BD2', tx: '#073642' },
  { id: 'harajuku',    lbl: 'Harajuku',     bg: '#FFE8F5', ac: '#FF1493', tx: '#2A0040' },
  { id: 'mushroom',    lbl: 'Mushroom',     bg: '#EAE4DC', ac: '#7A6A50', tx: '#1C160E' },
]

export function applyTheme(name) {
  document.body.setAttribute('data-theme', name)
}
