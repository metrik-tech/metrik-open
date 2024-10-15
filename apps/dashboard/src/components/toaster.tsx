import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  const { theme } = useTheme();
  return (
    <Sonner
      position="top-center"
      theme={theme !== "light" ? "dark" : "light"}
      
    />
  );
}
