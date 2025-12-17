import { Sun, Menu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export function Header() {
  const { isAdmin } = useUserRole();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Sun className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-semibold">PatioPro</span>
        </Link>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
              >
                <Sun className="h-5 w-5" />
                Find Patios
              </Link>
              <Link
                to="/submit"
                className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
              >
                Submit a Patio
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-lg font-medium hover:text-primary transition-colors"
                >
                  <Shield className="h-5 w-5" />
                  Admin
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
