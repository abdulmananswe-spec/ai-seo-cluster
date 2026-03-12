import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { FolderOpen, Search, Network, FileText, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatsLoadingSkeleton } from "@/components/loading-skeleton";

interface DashboardStats {
  totalProjects: number;
  totalKeywords: number;
  totalClusters: number;
  totalContentPlans: number;
  recentProjects: Array<{ id: number; name: string; domain: string; createdAt: string }>;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
  });

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your SEO automation projects"
      />

      {isLoading ? (
        <StatsLoadingSkeleton />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Projects"
              value={stats?.totalProjects ?? 0}
              icon={FolderOpen}
              color="blue"
              description="Active SEO projects"
              testId="stat-total-projects"
            />
            <StatCard
              title="Keywords Collected"
              value={stats?.totalKeywords ?? 0}
              icon={Search}
              color="green"
              description="Across all projects"
              testId="stat-total-keywords"
            />
            <StatCard
              title="Topic Clusters"
              value={stats?.totalClusters ?? 0}
              icon={Network}
              color="purple"
              description="Semantic groupings"
              testId="stat-total-clusters"
            />
            <StatCard
              title="Content Plans"
              value={stats?.totalContentPlans ?? 0}
              icon={FileText}
              color="orange"
              description="Generated strategies"
              testId="stat-total-plans"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
                  <Link href="/projects">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" data-testid="link-view-all-projects">
                      View All <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {stats?.recentProjects && stats.recentProjects.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentProjects.map((project) => (
                      <Link key={project.id} href={`/projects/${project.id}`}>
                        <div
                          className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                          data-testid={`card-project-${project.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <FolderOpen className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground">{project.domain}</p>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-3">
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
                    <Link href="/projects">
                      <Button size="sm" data-testid="button-create-first-project">Create Your First Project</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border border-card-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: "1",
                      title: "Create a Project",
                      desc: "Set up your website project with a name and domain",
                      icon: FolderOpen,
                      color: "bg-blue-500/10 text-blue-600",
                    },
                    {
                      step: "2",
                      title: "Collect Keywords",
                      desc: "Use AI to discover relevant long-tail keywords",
                      icon: Search,
                      color: "bg-emerald-500/10 text-emerald-600",
                    },
                    {
                      step: "3",
                      title: "Generate Clusters",
                      desc: "AI groups keywords into semantic topic clusters",
                      icon: Network,
                      color: "bg-violet-500/10 text-violet-600",
                    },
                    {
                      step: "4",
                      title: "Create Content Plans",
                      desc: "Generate pillar pages, supporting articles & linking strategy",
                      icon: FileText,
                      color: "bg-amber-500/10 text-amber-600",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-card-border bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold">Build Topical Authority with AI</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Automatically discover keywords, cluster topics, and generate SEO content strategies Powered by Abdul Manan.
                  </p>
                </div>
                <Link href="/projects">
                  <Button data-testid="button-get-started">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Get Started
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
