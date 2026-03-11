import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  BarChart3, FolderOpen, Search, Network, FileText,
  TrendingUp, Target, Layers, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatsLoadingSkeleton } from "@/components/loading-skeleton";
import { StatCard } from "@/components/stat-card";
import type { Project } from "@shared/schema";

interface DashboardStats {
  totalProjects: number;
  totalKeywords: number;
  totalClusters: number;
  totalContentPlans: number;
  recentProjects: Project[];
}

export default function Report() {
  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard-stats"],
  });

  const { data: projects, isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  if (loadingStats || loadingProjects) {
    return (
      <div>
        <PageHeader title="SEO Report" description="Comprehensive overview of your SEO strategy" />
        <StatsLoadingSkeleton />
      </div>
    );
  }

  if (!stats || stats.totalProjects === 0) {
    return (
      <div>
        <PageHeader title="SEO Report" description="Comprehensive overview of your SEO strategy" />
        <EmptyState
          icon={BarChart3}
          title="No data to report"
          description="Create projects and generate clusters to see your SEO report."
          action={
            <Link href="/projects">
              <Button data-testid="button-go-projects">Get Started</Button>
            </Link>
          }
          testId="empty-report"
        />
      </div>
    );
  }

  const topicalCoverage = stats.totalClusters > 0
    ? Math.min(100, Math.round((stats.totalContentPlans / stats.totalClusters) * 100))
    : 0;

  const keywordCoverage = stats.totalKeywords > 0
    ? Math.min(100, Math.round((stats.totalClusters > 0 ? (stats.totalKeywords / stats.totalClusters) : 0)))
    : 0;

  return (
    <div>
      <PageHeader
        title="SEO Report"
        description="Comprehensive overview of your SEO strategy"
      />

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={FolderOpen}
            color="blue"
            testId="report-stat-projects"
          />
          <StatCard
            title="Keywords Collected"
            value={stats.totalKeywords}
            icon={Search}
            color="green"
            testId="report-stat-keywords"
          />
          <StatCard
            title="Topic Clusters"
            value={stats.totalClusters}
            icon={Network}
            color="purple"
            testId="report-stat-clusters"
          />
          <StatCard
            title="Content Plans"
            value={stats.totalContentPlans}
            icon={FileText}
            color="orange"
            testId="report-stat-plans"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Topical Authority Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Content Coverage</span>
                  <span className="text-sm font-medium">{topicalCoverage}%</span>
                </div>
                <Progress value={topicalCoverage} className="h-2" data-testid="progress-coverage" />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.totalContentPlans} of {stats.totalClusters} clusters have content plans
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Keyword Depth</span>
                  <span className="text-sm font-medium">
                    {stats.totalClusters > 0 ? Math.round(stats.totalKeywords / stats.totalClusters) : 0} avg/cluster
                  </span>
                </div>
                <Progress
                  value={Math.min(100, stats.totalClusters > 0 ? (stats.totalKeywords / stats.totalClusters) * 10 : 0)}
                  className="h-2"
                  data-testid="progress-depth"
                />
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">
                    {topicalCoverage >= 80 ? "Excellent" : topicalCoverage >= 50 ? "Good" : topicalCoverage >= 25 ? "Building" : "Getting Started"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    - {topicalCoverage >= 80 ? "Strong topical authority" : topicalCoverage >= 50 ? "Good coverage, keep building" : "Create more content plans"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Project Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {projects?.map((project) => (
                  <ProjectReportRow key={project.id} project={project} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-card-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {stats.totalKeywords < 20 && (
                <RecommendationCard
                  title="Collect More Keywords"
                  description="Aim for at least 20+ keywords per project for effective clustering."
                  priority="high"
                />
              )}
              {stats.totalClusters === 0 && stats.totalKeywords > 0 && (
                <RecommendationCard
                  title="Generate Clusters"
                  description="You have keywords but no clusters. Generate semantic groupings."
                  priority="high"
                />
              )}
              {topicalCoverage < 100 && stats.totalClusters > 0 && (
                <RecommendationCard
                  title="Complete Content Plans"
                  description={`${stats.totalClusters - stats.totalContentPlans} clusters still need content plans.`}
                  priority="medium"
                />
              )}
              {stats.totalProjects === 1 && (
                <RecommendationCard
                  title="Add More Projects"
                  description="Expand your topical authority across multiple websites."
                  priority="low"
                />
              )}
              {topicalCoverage === 100 && (
                <RecommendationCard
                  title="Great Coverage!"
                  description="All clusters have content plans. Consider adding more seed keywords."
                  priority="success"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ProjectReportRow({ project }: { project: Project }) {
  const { data: stats } = useQuery<{ keywordCount: number; clusterCount: number; contentPlanCount: number }>({
    queryKey: ["/api/projects", project.id, "stats"],
  });

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
        data-testid={`report-project-${project.id}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FolderOpen className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium">{project.name}</p>
            <p className="text-xs text-muted-foreground">{project.domain}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-xs gap-1">
            <Search className="h-3 w-3" /> {stats?.keywordCount ?? 0}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <Network className="h-3 w-3" /> {stats?.clusterCount ?? 0}
          </Badge>
          <Badge variant="secondary" className="text-xs gap-1">
            <FileText className="h-3 w-3" /> {stats?.contentPlanCount ?? 0}
          </Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </Link>
  );
}

function RecommendationCard({
  title,
  description,
  priority,
}: {
  title: string;
  description: string;
  priority: "high" | "medium" | "low" | "success";
}) {
  const colors: Record<string, string> = {
    high: "border-red-500/20 bg-red-500/5",
    medium: "border-amber-500/20 bg-amber-500/5",
    low: "border-blue-500/20 bg-blue-500/5",
    success: "border-emerald-500/20 bg-emerald-500/5",
  };

  const badgeColors: Record<string, string> = {
    high: "bg-red-500/10 text-red-600 border-red-500/20",
    medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[priority]}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">{title}</h4>
        <Badge variant="outline" className={`text-xs ${badgeColors[priority]}`}>
          {priority === "success" ? "done" : priority}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
