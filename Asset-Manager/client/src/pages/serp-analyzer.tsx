import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Search, Loader2, Sparkles, TrendingUp, Eye,
  DollarSign, Target, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, SerpAnalysis } from "@shared/schema";

export default function SerpAnalyzer() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [keyword, setKeyword] = useState("");
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: analyses, isLoading } = useQuery<SerpAnalysis[]>({
    queryKey: ["/api/projects", projectId, "serp-analyses"],
    enabled: !!projectId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ projectId, keyword }: { projectId: number; keyword: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/analyze-serp`, { keyword });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "serp-analyses"] });
      toast({ title: "SERP analyzed", description: "Keyword SERP analysis complete." });
      setKeyword("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div>
      <PageHeader
        title="SERP Analyzer"
        description="Analyze search engine results pages for any keyword"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="md:w-64" data-testid="select-project-serp">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Enter keyword to analyze..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && keyword.trim() && projectId) {
                    analyzeMutation.mutate({ projectId, keyword: keyword.trim() });
                  }
                }}
                className="flex-1"
                data-testid="input-serp-keyword"
              />
              <Button
                onClick={() => projectId && analyzeMutation.mutate({ projectId, keyword: keyword.trim() })}
                disabled={!keyword.trim() || !projectId || analyzeMutation.isPending}
                data-testid="button-analyze-serp"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze SERP"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={Search}
            title="Select a project"
            description="Choose a project and enter a keyword to analyze its SERP."
            testId="empty-serp-select"
          />
        ) : isLoading ? (
          <TableLoadingSkeleton rows={3} />
        ) : !analyses || analyses.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No SERP analyses yet"
            description="Enter a keyword above to get AI-powered SERP analysis."
            testId="empty-serp"
          />
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <SerpCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SerpCard({ analysis }: { analysis: SerpAnalysis }) {
  const [open, setOpen] = useState(false);

  const difficultyColor = (d: number) => {
    if (d < 30) return "text-emerald-600 dark:text-emerald-400";
    if (d < 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const difficultyBg = (d: number) => {
    if (d < 30) return "bg-emerald-500";
    if (d < 60) return "bg-amber-500";
    return "bg-red-500";
  };

  const intentColors: Record<string, string> = {
    informational: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    commercial: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    transactional: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    navigational: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  };

  const serpFeatureLabels: Record<string, string> = {
    featured_snippet: "Featured Snippet",
    people_also_ask: "People Also Ask",
    video_results: "Video Results",
    image_pack: "Image Pack",
    local_pack: "Local Pack",
    knowledge_panel: "Knowledge Panel",
    shopping_results: "Shopping",
    news_results: "News",
    site_links: "Site Links",
  };

  return (
    <Card className="border border-card-border" data-testid={`card-serp-${analysis.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{analysis.keyword}</h3>
            <div className="flex items-center gap-3 mt-1">
              {analysis.intent && (
                <Badge variant="outline" className={`text-xs ${intentColors[analysis.intent] || ""}`}>
                  {analysis.intent}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Difficulty</span>
            </div>
            <div className={`text-xl font-bold ${difficultyColor(analysis.difficulty ?? 0)}`}>
              {analysis.difficulty ?? "N/A"}
            </div>
            {analysis.difficulty != null && (
              <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${difficultyBg(analysis.difficulty)}`} style={{ width: `${analysis.difficulty}%` }} />
              </div>
            )}
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Volume</span>
            </div>
            <div className="text-xl font-bold">
              {analysis.searchVolume ? analysis.searchVolume.toLocaleString() : "N/A"}
            </div>
            <span className="text-xs text-muted-foreground">monthly</span>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">CPC</span>
            </div>
            <div className="text-xl font-bold">
              {analysis.cpc ? `$${analysis.cpc.toFixed(2)}` : "N/A"}
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Features</span>
            </div>
            <div className="text-xl font-bold">
              {(analysis.serpFeatures as string[])?.length ?? 0}
            </div>
          </div>
        </div>

        {(analysis.serpFeatures as string[])?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">SERP Features</p>
            <div className="flex flex-wrap gap-1.5">
              {(analysis.serpFeatures as string[]).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {serpFeatureLabels[feature] || feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid={`button-toggle-results-${analysis.id}`}>
              <span className="text-sm">Top Search Results ({(analysis.topResults as any[])?.length ?? 0})</span>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 mt-2">
              {(analysis.topResults as { position: number; title: string; url: string; description: string }[])?.map((result, i) => (
                <div key={i} className="p-3 rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-primary/10 text-primary text-xs font-bold">
                      {result.position}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate">{result.url}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{result.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
