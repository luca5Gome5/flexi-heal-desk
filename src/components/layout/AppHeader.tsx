import { Search, Bell, User } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex h-16 items-center gap-4 px-6">
        <SidebarTrigger className="text-foreground hover:text-accent transition-smooth" />
        
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar pacientes, consultas..."
              className="pl-9 rounded-full bg-secondary border-none focus-visible:ring-accent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 hover:text-accent">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
