import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  Search, Network, FileText, Sparkles, ArrowLeft, Loader2, Plus, Globe
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { StatsLoadingSkeleton, TableLoadingSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, Keyword, Cluster, ContentPlan } from "@shared/schema";

export default function ProjectDetail() {
  const params = useParams<{ id: string }>();
  const projectId = Number(params.id);
  const { toast } = useToast();
  const [seedKeyword, setSeedKeyword] = useState("");

  const { data: project, isLoading: loadingProject } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
  });

  const { data: stats } = useQuery<{ keywordCount: number; clusterCount: number; contentPlanCount: number }>({
    queryKey: ["/api/projects", projectId, "stats"],
  });

  const { data: keywords, isLoading: loadingKeywords } = useQuery<Keyword[]>({
    queryKey: ["/api/projects", projectId, "keywords"],
  });

  const { data: clusters, isLoading: loadingClusters } = useQuery<Cluster[]>({
    queryKey: ["/api/projects", projectId, "clusters"],
  });

  const { data: contentPlans, isLoading: loadingPlans } = useQuery<(ContentPlan & { clusterName: string })[]>({
    queryKey: ["/api/projects", projectId, "content-plans"],
  });

  const collectMutation = useMutation({
    mutationFn: async (seed: string) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/collect-keywords`, { seedKeyword: seed });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "keywords"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      const count = Array.isArray(data) ? data.length : 0;
      toast({ title: "Keywords collected", description: `${count} new keywords added.` });
      setSeedKeyword("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const clusterMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/generate-clusters`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "clusters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      const count = Array.isArray(data) ? data.length : 0;
      toast({ title: "Clusters generated", description: `${count} topic clusters created.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const contentPlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/generate-all-content-plans`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "content-plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard-stats"] });
      toast({ title: "Content plans generated", description: "All cluster content plans have been created." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (loadingProject) {
    return (
      <div>
        <PageHeader title="Loading..." />
        <StatsLoadingSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <PageHeader title="Project Not Found" />
        <EmptyState
          icon={Search}
          title="Project not found"
          description="The project you're looking for doesn't exist."
          action={<Link href="/projects"><Button>Back to Projects</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.domain}
        actions={
          <Link href="/projects">
            <Button variant="outline" size="sm" data-testid="button-back-projects">
              <ArrowLeft className="h-4 w-4 mr-1" /> All Projects
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          title="Keywords"
          value={stats?.keywordCount ?? 0}
          icon={Search}
          color="green"
          testId="stat-keywords"
        />
        <StatCard
          title="Clusters"
          value={stats?.clusterCount ?? 0}
          icon={Network}
          color="purple"
          testId="stat-clusters"
        />
        <StatCard
          title="Content Plans"
          value={stats?.contentPlanCount ?? 0}
          icon={FileText}
          color="orange"
          testId="stat-plans"
        />
      </div>

      <Tabs defaultValue="keywords" className="space-y-4">
        <TabsList data-testid="tabs-project">
          <TabsTrigger value="keywords" data-testid="tab-keywords">
            <Search className="h-4 w-4 mr-1" /> Keywords
          </TabsTrigger>
          <TabsTrigger value="clusters" data-testid="tab-clusters">
            <Network className="h-4 w-4 mr-1" /> Clusters
          </TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">
            <FileText className="h-4 w-4 mr-1" /> Content Plans
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="space-y-4">
          <Card className="border border-card-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Collect Keywords with AI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input
                  placeholder="Enter a seed keyword (e.g., 'SEO tools')"
                  value={seedKeyword}
                  onChange={(e) => setSeedKeyword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && seedKeyword.trim()) {
                      collectMutation.mutate(seedKeyword.trim());
                    }
                  }}
                  data-testid="input-seed-keyword"
                />
                <Button
                  onClick={() => collectMutation.mutate(seedKeyword.trim())}
                  disabled={!seedKeyword.trim() || collectMutation.isPending}
                  data-testid="button-collect-keywords"
                >
                  {collectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {collectMutation.isPending ? "Collecting..." : "Collect"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {loadingKeywords ? (
            <TableLoadingSkeleton rows={5} />
          ) : !keywords || keywords.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No keywords yet"
              description="Enter a seed keyword above to collect relevant long-tail keywords using AI."
              testId="empty-keywords"
            />
          ) : (
            <Card className="border border-card-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{keywords.length} Keywords</CardTitle>
                  <Button
                    onClick={() => clusterMutation.mutate()}
                    disabled={keywords.length < 3 || clusterMutation.isPending}
                    size="sm"
                    data-testid="button-generate-clusters"
                  >
                    {clusterMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Network className="h-4 w-4 mr-2" />
                    )}
                    {clusterMutation.isPending ? "Clustering..." : "Generate Clusters"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Badge
                      key={kw.id}
                      variant="secondary"
                      className="text-xs py-1.5 px-3"
                      data-testid={`badge-keyword-${kw.id}`}
                    >
                      {kw.keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clusters" className="space-y-4">
          {loadingClusters ? (
            <TableLoadingSkeleton rows={4} />
          ) : !clusters || clusters.length === 0 ? (
            <EmptyState
              icon={Network}
              title="No clusters yet"
              description="Collect keywords first, then generate semantic clusters."
              testId="empty-clusters"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{clusters.length} topic clusters</p>
                <Button
                  onClick={() => contentPlanMutation.mutate()}
                  disabled={contentPlanMutation.isPending}
                  size="sm"
                  data-testid="button-generate-all-plans"
                >
                  {contentPlanMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {contentPlanMutation.isPending ? "Generating..." : "Generate All Content Plans"}
                </Button>
              </div>
              {clusters.map((cluster) => (
                <ClusterCard key={cluster.id} cluster={cluster} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          {loadingPlans ? (
            <TableLoadingSkeleton rows={4} />
          ) : !contentPlans || contentPlans.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No content plans yet"
              description="Generate clusters first, then create content plans for each cluster."
              testId="empty-content-plans"
            />
          ) : (
            <div className="space-y-4">
              {contentPlans.map((plan) => (
                <ContentPlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ClusterCard({ cluster }: { cluster: Cluster }) {
  const { data: clusterData } = useQuery<Cluster & { keywords: { keyword: string }[] }>({
    queryKey: ["/api/clusters", cluster.id],
  });

  const kws = clusterData?.keywords || [];

  return (
    <Card className="border border-card-border" data-testid={`card-cluster-${cluster.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-primary" />
              {cluster.clusterName}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{cluster.topic}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {kws.length} keywords
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {kws.map((kw, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {kw.keyword}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentPlanCard({ plan }: { plan: ContentPlan & { clusterName: string } }) {
  const intentColors: Record<string, string> = {
    informational: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    commercial: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    transactional: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    navigational: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  };

  return (
    <Card className="border border-card-border" data-testid={`card-plan-${plan.id}`}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cluster: {plan.clusterName}</p>
            <h3 className="text-base font-semibold">{plan.pillarTitle}</h3>
          </div>
          <Badge className={`text-xs border ${intentColors[plan.searchIntent] || intentColors.informational}`} variant="outline">
            {plan.searchIntent}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Supporting Articles</p>
            <ul className="space-y-1.5">
              {(plan.supportingTitles as string[]).map((title, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  {title}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recommended Headings</p>
            <ul className="space-y-1.5">
              {(plan.headings as string[]).map((heading, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  H2: {heading}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <div className="grid gap-2 md:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Meta Title</p>
              <p className="text-sm">{plan.metaTitle}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Meta Description</p>
              <p className="text-sm">{plan.metaDescription}</p>
            </div>
          </div>
        </div>

        {(plan.internalLinks as { from: string; to: string; anchor: string }[]).length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Internal Linking Strategy</p>
            <div className="space-y-1.5">
              {(plan.internalLinks as { from: string; to: string; anchor: string }[]).map((link, i) => (
                <div key={i} className="text-xs flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium text-foreground">{link.from}</span>
                  <ArrowLeft className="h-3 w-3 rotate-180" />
                  <span className="font-medium text-foreground">{link.to}</span>
                  <span className="text-muted-foreground">({link.anchor})</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
