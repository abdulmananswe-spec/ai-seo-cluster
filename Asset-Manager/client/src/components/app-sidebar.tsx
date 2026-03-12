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
          <div className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-500/20 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white drop-shadow-sm">
                <path d="M12 3L4 9V15L12 21L20 15V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3V21" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round"/>
                <path d="M4 9L20 15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round"/>
                <path d="M20 9L4 15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" strokeLinecap="round"/>
                <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.2"/>
                <path d="M12 9L15 12L12 15L9 12L12 9Z" fill="white"/>
              </svg>
              <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">AI SEO ANALYZER</h1>
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 transition-all group-hover:translate-x-1">Precision Toolkit</p>
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
