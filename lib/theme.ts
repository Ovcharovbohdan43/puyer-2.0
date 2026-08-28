export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "puyer-theme";

export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}}catch(e){}})();`;

export function parseStoredTheme(value: string | null): Theme {
  return value === "dark" || value === "light" ? value : "light";
}
