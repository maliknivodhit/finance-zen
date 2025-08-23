import { useEffect } from "react";

// On mount, ensure 'dark' class is removed from <html>
export const ThemeToggle = () => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // No UI rendered
  return null;
};
