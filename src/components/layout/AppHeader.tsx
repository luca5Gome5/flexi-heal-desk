import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const { signOut, user } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{user?.email}</span>
        <Button variant="ghost" size="icon" onClick={signOut}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
