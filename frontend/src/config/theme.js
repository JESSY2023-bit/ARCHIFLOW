import tenant from "./tenant";

export function applyTheme() {
  const root = document.documentElement;
  root.style.setProperty("--color-primary",     tenant.primaryColor);
  root.style.setProperty("--color-primary-dark", darken(tenant.primaryColor, 10));
  root.style.setProperty("--color-accent",      tenant.accentColor);
}

// Assombrit une couleur hex de N%
function darken(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r   = Math.max(0, (num >> 16)       - Math.round(2.55 * percent));
  const g   = Math.max(0, (num >> 8 & 0xff) - Math.round(2.55 * percent));
  const b   = Math.max(0, (num & 0xff)      - Math.round(2.55 * percent));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export default tenant;