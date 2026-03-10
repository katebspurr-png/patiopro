import { Sun, Menu, Shield, Moon, SunMedium } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useTheme } from "@/hooks/useTheme";

export function Header() {
  const { isAdmin } = useUserRole();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-gradient-to-r from-amber-50/95 via-orange-50/95 to-yellow-50/95 dark:from-background/95 dark:via-background/95 dark:to-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-transparent">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50 dark:shadow-amber-900/30 group-hover:shadow-lg group-hover:shadow-amber-200/60 dark:group-hover:shadow-amber-900/40 transition-all duration-300 group-hover:scale-105">
            <Sun className="h-5 w-5 text-white drop-shadow-sm" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-lg font-semibold leading-tight bg-gradient-to-r from-amber-700 to-orange-600 dark:from-amber-300 dark:to-orange-400 bg-clip-text text-transparent">
              PatioPro
            </span>
            <span className="text-[10px] font-medium text-muted-foreground/70 leading-tight tracking-wide uppercase">
              Halifax
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <SunMedium className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl">
              <nav className="flex flex-col gap-2 mt-8">
                <Link
                  to="/"
                  className="flex items-center gap-3 text-base font-medium px-3 py-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-700 dark:hover:text-amber-400 transition-all duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                    <Sun className="h-4 w-4" />
                  </div>
                  Find Patios
                </Link>
                <Link
                  to="/report"
                  className="flex items-center gap-3 text-base font-medium px-3 py-2.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/30 hover:text-blue-700 dark:hover:text-blue-400 transition-all duration-200"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                    <SunMedium className="h-4 w-4" />
                  </div>
                  Submit a Report
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 text-base font-medium px-3 py-2.5 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-400 transition-all duration-200"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    Admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
