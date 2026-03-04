"use client"

import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"

const storageKey = "theme"

export function ThemeToggle() {
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark")
    window.localStorage.setItem(storageKey, isDark ? "dark" : "light")
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  )
}
