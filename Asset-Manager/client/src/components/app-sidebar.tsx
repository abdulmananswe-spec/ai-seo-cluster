import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  FolderOpen,
  Search,
  Network,
  FileText,
  BarChart3,
  Sparkles,
  TrendingUp,
  Users,
  Link2,
  Globe,
  FileSearch,
  Scan,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const clusterTools = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Projects", url: "/projects", icon: FolderOpen },
  { title: "Keywords", url: "/keywords", icon: Search },
  { title: "Clusters", url: "/clusters", icon: Network },
  { title: "Content Plans", url: "/content-plans", icon: FileText },
  { title: "SEO Report", url: "/report", icon: BarChart3 },
];

const siteAnalysisTools = [
  { title: "Site Analyzer", url: "/site-analyzer", icon: Scan },
  { title: "Site Audit", url: "/site-audit", icon: FileSearch },
];

const seoTools = [
  { title: "SERP Analyzer", url: "/serp-analyzer", icon: Globe },
  { title: "Rank Tracker", url: "/rank-tracker", icon: TrendingUp },
  { title: "Competitors", url: "/competitors", icon: Users },
  { title: "Backlinks", url: "/backlinks", icon: Link2 },
  { title: "Search Console", url: "/search-console", icon: BarChart3 },
];

export function AppSidebar() {
  const [location] = useLocation();

  const renderNavItems = (items: typeof clusterTools) => (
    <SidebarMenu>
      {items.map((item) => {
        const isActive = location === item.url ||
          (item.url !== "/" && location.startsWith(item.url));
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <Link href={item.url}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-5">
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight">AI SEO Analyzer</h1>
              <p className="text-xs text-muted-foreground">Full SEO Toolkit</p>
            </div>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3 mb-1">
            Cluster Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(clusterTools)}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3 mb-1">
            Site Analysis
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(siteAnalysisTools)}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 px-3 mb-1">
            SEO Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {renderNavItems(seoTools)}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-3">
        <p className="text-xs text-muted-foreground text-center">
          Powered by AI
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
