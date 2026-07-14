"use client";

import { Button } from "@heroui/react/button";
import { Tooltip } from "@heroui/react/tooltip";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

interface ThemeToggleProps {
  readonly label: string;
}

export function ThemeToggle({ label }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Tooltip.Root delay={350}>
      <Button
        aria-label={label}
        className="header-icon-button"
        isIconOnly
        onPress={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        size="sm"
        variant="ghost"
      >
        <Moon aria-hidden="true" className="theme-icon theme-icon-moon" />
        <Sun aria-hidden="true" className="theme-icon theme-icon-sun" />
      </Button>
      <Tooltip.Content placement="bottom">{label}</Tooltip.Content>
    </Tooltip.Root>
  );
}
