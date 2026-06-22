const tenant = {
  name: import.meta.env.VITE_APP_NAME || "ArchiFlow",
  tagline: import.meta.env.VITE_APP_TAGLINE || "Gestion documentaire",
  logoIcon: import.meta.env.VITE_APP_LOGO || "AF",
  primaryColor: import.meta.env.VITE_PRIMARY || "#0f766e",
  accentColor: import.meta.env.VITE_ACCENT || "#1e293b",
  footerText: import.meta.env.VITE_FOOTER || `ArchiFlow © ${new Date().getFullYear()} - Accès réservé`,
  language: import.meta.env.VITE_LANG || "fr",
};

export default tenant;
