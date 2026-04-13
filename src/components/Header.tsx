import { Sun, Menu, Shield, Beer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

export function Header() {
  const { isAdmin } = useUserRole();

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1C1C1A]">
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C87533]">
            <Sun className="h-5 w-5 text-white" />
          </div>
          <span className="font-sans text-lg font-semibold text-white">PatioPro</span>
        </Link>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <nav className="flex flex-col gap-4 mt-8">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg font-medium hover:text-[#C87533] transition-colors"
              >
                <Sun className="h-5 w-5" />
                Find Patios
              </Link>
              <Link
                to="/happy-hours"
                className="flex items-center gap-2 text-lg font-medium hover:text-[#C87533] transition-colors"
              >
                <Beer className="h-5 w-5" />
                Happy Hours
              </Link>
              <Link
                to="/report"
                className="flex items-center gap-2 text-lg font-medium hover:text-[#C87533] transition-colors"
              >
                Submit a Report
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 text-lg font-medium hover:text-[#C87533] transition-colors"
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
