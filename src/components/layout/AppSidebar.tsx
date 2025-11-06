import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Building2, 
  Stethoscope,
  Syringe,
  Image,
  MessageSquare,
  Shield
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Pacientes", url: "/patients", icon: Users },
  { title: "Agenda", url: "/calendar", icon: Calendar },
  { title: "Unidades", url: "/units", icon: Building2 },
  { title: "Médicos", url: "/doctors", icon: Stethoscope },
  { title: "Procedimentos", url: "/procedures", icon: Syringe },
  { title: "Mídias", url: "/media", icon: Image },
  { title: "Mensagens", url: "/messages", icon: MessageSquare },
  { title: "Usuários", url: "/users", icon: Shield },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="px-6 py-8">
          <h1 className={`font-bold transition-all ${collapsed ? "text-lg text-center" : "text-2xl"} text-accent`}>
            {collapsed ? "FS" : "Franklin Sampaio"}
          </h1>
          {!collapsed && (
            <p className="text-xs text-muted-foreground mt-1">Sistema de Gestão Médica</p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-6">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={`flex items-center gap-3 px-6 py-3 transition-smooth ${
                          active
                            ? "text-accent font-medium bg-accent/10 border-r-4 border-accent"
                            : "text-sidebar-foreground hover:text-accent hover:bg-accent/5"
                        }`}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
