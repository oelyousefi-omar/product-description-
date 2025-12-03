import { useLocation, Link } from "wouter";
import { Upload, Package, ShoppingCart, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();
  const { t, language, isRTL } = useLanguage();

  const menuItems = [
    {
      title: t.dashboard,
      url: "/",
      icon: LayoutDashboard,
      testId: "nav-link-home",
    },
    {
      title: t.products,
      url: "/products",
      icon: Package,
      testId: "nav-link-products",
    },
    {
      title: t.orders,
      url: "/orders",
      icon: ShoppingCart,
      testId: "nav-link-orders",
    },
  ];

  const menuLabel = {
    ar: "القائمة الرئيسية",
    en: "Main Menu",
    fr: "Menu Principal",
  };

  const assistantLabel = {
    ar: "مساعد المنتجات",
    en: "Product Assistant",
    fr: "Assistant Produits",
  };

  return (
    <Sidebar side={isRTL ? "right" : "left"}>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold" data-testid="text-app-title">ProductAI</h1>
            <p className="text-xs text-muted-foreground" data-testid="text-app-subtitle">
              {assistantLabel[language]}
            </p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel data-testid="text-menu-label">
            {menuLabel[language]}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <p className="text-xs text-muted-foreground text-center" data-testid="text-app-version">
          ProductAI v1.0
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
