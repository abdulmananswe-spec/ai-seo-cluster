import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Projects from "@/pages/projects";
import ProjectDetail from "@/pages/project-detail";
import Keywords from "@/pages/keywords";
import Clusters from "@/pages/clusters";
import ContentPlans from "@/pages/content-plans";
import Report from "@/pages/report";
import SerpAnalyzer from "@/pages/serp-analyzer";
import RankTracker from "@/pages/rank-tracker";
import CompetitorAnalysis from "@/pages/competitor-analysis";
import BacklinkAnalyzer from "@/pages/backlink-analyzer";
import SearchConsole from "@/pages/search-console";
import SiteAnalyzer from "@/pages/site-analyzer";
import SiteAudit from "@/pages/site-audit";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/projects" component={Projects} />
      <Route path="/projects/:id" component={ProjectDetail} />
      <Route path="/keywords" component={Keywords} />
      <Route path="/clusters" component={Clusters} />
      <Route path="/content-plans" component={ContentPlans} />
      <Route path="/report" component={Report} />
      <Route path="/serp-analyzer" component={SerpAnalyzer} />
      <Route path="/rank-tracker" component={RankTracker} />
      <Route path="/competitors" component={CompetitorAnalysis} />
      <Route path="/backlinks" component={BacklinkAnalyzer} />
      <Route path="/search-console" component={SearchConsole} />
      <Route path="/site-analyzer" component={SiteAnalyzer} />
      <Route path="/site-audit" component={SiteAudit} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <div className="p-6 max-w-7xl mx-auto w-full">
              <Router />
            </div>
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
