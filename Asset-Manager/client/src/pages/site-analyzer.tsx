import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Globe, Loader2, Search, TrendingUp, AlertTriangle, FileText,
  CheckCircle2, XCircle, Clock, Sparkles, ChevronDown, ChevronUp,
  ExternalLink, BarChart3, Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { StatsLoadingSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, SiteAnalysis, CrawledPage, ExtractedKeyword } from "@shared/schema";

export default function SiteAnalyzer() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [url, setUrl] = useState("");
  const [activeAnalysisId, setActiveAnalysisId] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: analyses, isLoading: loadingAnalyses } = useQuery<SiteAnalysis[]>({
    queryKey: ["/api/projects", projectId, "site-analyses"],
    enabled: !!projectId,
  });

  const { data: activeAnalysis, isLoading: loadingActive } = useQuery<SiteAnalysis>({
    queryKey: ["/api/site-analyses", activeAnalysisId],
    enabled: !!activeAnalysisId,
    refetchInterval: (query) => {
      const data = query.state.data as SiteAnalysis | undefined;
      if (data && (data.status === "crawling" || data.status === "analyzing")) {
        return 3000;
      }
      return false;
    },
  });

  const { data: crawledPages } = useQuery<CrawledPage[]>({
    queryKey: ["/api/site-analyses", activeAnalysisId, "pages"],
    enabled: !!activeAnalysisId && activeAnalysis?.status === "complete",
  });

  const { data: extractedKeywords } = useQuery<ExtractedKeyword[]>({
    queryKey: ["/api/site-analyses", activeAnalysisId, "keywords"],
    enabled: !!activeAnalysisId && activeAnalysis?.status === "complete",
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ projectId, url }: { projectId: number; url: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/analyze-site`, { url });
      return res.json();
    },
    onSuccess: (data: SiteAnalysis) => {
      setActiveAnalysisId(data.id);
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "site-analyses"] });
      toast({ title: "Analysis started", description: "Crawling website..." });
      setUrl("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [contentIdeas, setContentIdeas] = useState<any[]>([]);
  const contentIdeasMutation = useMutation({
    mutationFn: async (analysisId: number) => {
      const res = await apiRequest("POST", `/api/site-analyses/${analysisId}/generate-content-ideas`);
      return res.json();
    },
    onSuccess: (data) => {
      setContentIdeas(data);
      toast({ title: "Content ideas generated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const selectedProjectData = projects?.find(p => p.id === projectId);

  useEffect(() => {
    if (selectedProjectData) {
      setUrl(selectedProjectData.domain);
    }
  }, [selectedProjectData]);

  const statusIcon = (status: string) => {
    switch (status) {
      case "crawling": return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "analyzing": return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
      case "complete": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const scoreBg = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div>
      <PageHeader
        title="Site Analyzer"
        description="Crawl and analyze any website for SEO performance"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={selectedProject} onValueChange={(v) => {
                setSelectedProject(v);
                setActiveAnalysisId(null);
                setContentIdeas([]);
              }}>
                <SelectTrigger className="md:w-64" data-testid="select-project-site">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
                data-testid="input-site-url"
              />
              <Button
                onClick={() => projectId && analyzeMutation.mutate({ projectId, url: url.trim() })}
                disabled={!url.trim() || !projectId || analyzeMutation.isPending}
                data-testid="button-analyze-site"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {analyzeMutation.isPending ? "Starting..." : "Analyze Site"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={Globe}
            title="Select a project"
            description="Choose a project and enter a URL to start a site analysis."
            testId="empty-site-select"
          />
        ) : activeAnalysis ? (
          <div className="space-y-6">
            <Card className="border border-card-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  {statusIcon(activeAnalysis.status)}
                  <div>
                    <h3 className="font-semibold">{activeAnalysis.url}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{activeAnalysis.status === "crawling" ? "Crawling pages..." : activeAnalysis.status === "analyzing" ? "Analyzing content & SEO..." : activeAnalysis.status}</p>
                  </div>
                </div>

                {(activeAnalysis.status === "crawling" || activeAnalysis.status === "analyzing") && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <div>
                      <p className="text-sm font-medium">
                        {activeAnalysis.status === "crawling" ? "Crawling website pages..." : "Running SEO analysis & keyword extraction..."}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeAnalysis.totalPages ? `${activeAnalysis.totalPages} pages found` : "This may take a minute"}
                      </p>
                    </div>
                  </div>
                )}

                {activeAnalysis.status === "complete" && (
                  <div className="grid gap-4 md:grid-cols-4 mb-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">SEO Score</p>
                      <p className={`text-2xl font-bold ${scoreColor(activeAnalysis.seoScore ?? 0)}`}>
                        {activeAnalysis.seoScore?.toFixed(0) ?? "N/A"}
                      </p>
                      <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${scoreBg(activeAnalysis.seoScore ?? 0)}`} style={{ width: `${activeAnalysis.seoScore ?? 0}%` }} />
                      </div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Domain Authority</p>
                      <p className={`text-2xl font-bold ${scoreColor(activeAnalysis.domainAuthority ?? 0)}`}>
                        {activeAnalysis.domainAuthority?.toFixed(0) ?? "N/A"}
                      </p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Pages Crawled</p>
                      <p className="text-2xl font-bold">{activeAnalysis.totalPages ?? 0}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">Keywords Found</p>
                      <p className="text-2xl font-bold">{activeAnalysis.totalKeywordsFound ?? 0}</p>
                    </div>
                  </div>
                )}

                {activeAnalysis.status === "failed" && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive">
                    <XCircle className="h-5 w-5" />
                    <p className="text-sm">Analysis failed. The site may be unreachable or blocking crawlers.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {activeAnalysis.status === "complete" && (
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview" data-testid="tab-site-overview">Overview</TabsTrigger>
                  <TabsTrigger value="pages" data-testid="tab-site-pages">Pages ({crawledPages?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="keywords" data-testid="tab-site-keywords">Keywords ({extractedKeywords?.length ?? 0})</TabsTrigger>
                  <TabsTrigger value="issues" data-testid="tab-site-issues">Issues</TabsTrigger>
                  <TabsTrigger value="content" data-testid="tab-site-content">Content Ideas</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  {activeAnalysis.summary && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <Card className="border border-card-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" /> Top Issues
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {(activeAnalysis.summary as any).topIssues?.map((issue: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-amber-500" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                      <Card className="border border-card-border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-blue-500" /> Content Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {(activeAnalysis.summary as any).contentOpportunities?.map((opp: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-blue-500" />
                                {opp}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pages" className="mt-4">
                  {crawledPages && crawledPages.length > 0 ? (
                    <Card className="border border-card-border">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Page</TableHead>
                              <TableHead className="text-center">Score</TableHead>
                              <TableHead className="text-center">Words</TableHead>
                              <TableHead className="text-center">Issues</TableHead>
                              <TableHead className="text-center">Links</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {crawledPages.map((page) => (
                              <PageRow key={page.id} page={page} />
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <EmptyState icon={FileText} title="No pages" description="No crawled pages found." testId="empty-pages" />
                  )}
                </TabsContent>

                <TabsContent value="keywords" className="mt-4">
                  {extractedKeywords && extractedKeywords.length > 0 ? (
                    <Card className="border border-card-border">
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Keyword</TableHead>
                              <TableHead className="text-center">Score</TableHead>
                              <TableHead className="text-center">Freq</TableHead>
                              <TableHead className="text-center">Difficulty</TableHead>
                              <TableHead className="text-center">Volume</TableHead>
                              <TableHead>Cluster</TableHead>
                              <TableHead className="text-center">Type</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {extractedKeywords.map((kw) => (
                              <TableRow key={kw.id} data-testid={`row-keyword-${kw.id}`}>
                                <TableCell className="font-medium text-sm">{kw.keyword}</TableCell>
                                <TableCell className="text-center text-sm">{kw.tfidfScore?.toFixed(1)}</TableCell>
                                <TableCell className="text-center text-sm">{kw.frequency}</TableCell>
                                <TableCell className="text-center">
                                  {kw.difficulty != null ? (
                                    <Badge variant={kw.difficulty < 30 ? "default" : kw.difficulty < 60 ? "secondary" : "destructive"} className="text-xs">
                                      {kw.difficulty.toFixed(0)}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-sm">
                                  {kw.searchVolume ? kw.searchVolume.toLocaleString() : "-"}
                                </TableCell>
                                <TableCell>
                                  {kw.cluster ? (
                                    <Badge variant="outline" className="text-xs">{kw.cluster}</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  {kw.isLongTail ? (
                                    <Badge variant="secondary" className="text-xs">Long Tail</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Short</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ) : (
                    <EmptyState icon={Target} title="No keywords" description="No keywords extracted." testId="empty-kws" />
                  )}
                </TabsContent>

                <TabsContent value="issues" className="mt-4">
                  {crawledPages && crawledPages.length > 0 ? (
                    <div className="space-y-3">
                      {crawledPages
                        .filter(p => (p.seoIssues as any[])?.length > 0)
                        .map((page) => (
                          <Card key={page.id} className="border border-card-border">
                            <CardContent className="p-4">
                              <p className="text-sm font-medium mb-2 truncate">{page.url}</p>
                              <div className="space-y-1.5">
                                {(page.seoIssues as { issue: string; severity: string; description: string }[]).map((issue, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <Badge
                                      variant={issue.severity === "high" ? "destructive" : issue.severity === "medium" ? "secondary" : "outline"}
                                      className="text-xs shrink-0 mt-0.5"
                                    >
                                      {issue.severity}
                                    </Badge>
                                    <div>
                                      <span className="font-medium">{issue.issue}</span>
                                      <span className="text-muted-foreground"> — {issue.description}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      {crawledPages.every(p => !(p.seoIssues as any[])?.length) && (
                        <EmptyState icon={CheckCircle2} title="No issues found" description="All pages passed SEO checks." testId="empty-issues" />
                      )}
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="content" className="mt-4 space-y-4">
                  <Button
                    onClick={() => activeAnalysisId && contentIdeasMutation.mutate(activeAnalysisId)}
                    disabled={contentIdeasMutation.isPending}
                    data-testid="button-generate-ideas"
                  >
                    {contentIdeasMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {contentIdeasMutation.isPending ? "Generating..." : "Generate Content Ideas"}
                  </Button>

                  {contentIdeas.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-3">
                      {contentIdeas.map((idea: any, i: number) => (
                        <Card key={i} className="border border-card-border" data-testid={`card-idea-${i}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-semibold">{idea.title}</h4>
                              <Badge variant={idea.priority === "high" ? "default" : idea.priority === "medium" ? "secondary" : "outline"} className="text-xs shrink-0 ml-2">
                                {idea.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">{idea.type}</Badge>
                              <span className="text-xs text-muted-foreground">Target: {idea.targetKeyword}</span>
                            </div>
                            {idea.outline && (
                              <ul className="space-y-0.5 text-xs text-muted-foreground">
                                {idea.outline.slice(0, 4).map((h: string, j: number) => (
                                  <li key={j} className="flex items-start gap-1">
                                    <span className="mt-1 shrink-0 h-1 w-1 rounded-full bg-muted-foreground" />
                                    {h}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {loadingAnalyses ? (
              <StatsLoadingSkeleton />
            ) : analyses && analyses.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Previous Analyses</h3>
                {analyses.map((a) => (
                  <Card
                    key={a.id}
                    className="border border-card-border cursor-pointer hover:border-primary/30 transition-colors"
                    onClick={() => setActiveAnalysisId(a.id)}
                    data-testid={`card-analysis-${a.id}`}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {statusIcon(a.status)}
                        <div>
                          <p className="text-sm font-medium">{a.url}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(a.createdAt).toLocaleDateString()} — {a.totalPages ?? 0} pages
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.seoScore != null && (
                          <Badge variant={a.seoScore >= 70 ? "default" : a.seoScore >= 40 ? "secondary" : "destructive"}>
                            Score: {a.seoScore.toFixed(0)}
                          </Badge>
                        )}
                        {a.domainAuthority != null && (
                          <Badge variant="outline">DA: {a.domainAuthority.toFixed(0)}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Globe}
                title="No site analyses yet"
                description="Enter a URL above to crawl and analyze a website."
                testId="empty-site"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PageRow({ page }: { page: CrawledPage }) {
  const [open, setOpen] = useState(false);
  const issues = (page.seoIssues as { issue: string; severity: string; description: string }[]) || [];

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setOpen(!open)}
        data-testid={`row-page-${page.id}`}
      >
        <TableCell className="max-w-64">
          <div className="flex items-center gap-2">
            {open ? <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            <div className="truncate">
              <p className="text-sm font-medium truncate">{page.title || page.url}</p>
              <p className="text-xs text-muted-foreground truncate">{page.url}</p>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center">
          <Badge variant={(page.pageAuthority ?? 0) >= 70 ? "default" : (page.pageAuthority ?? 0) >= 40 ? "secondary" : "destructive"} className="text-xs">
            {page.pageAuthority?.toFixed(0) ?? "-"}
          </Badge>
        </TableCell>
        <TableCell className="text-center text-sm">{page.wordCount?.toLocaleString()}</TableCell>
        <TableCell className="text-center">
          {issues.length > 0 ? (
            <Badge variant="destructive" className="text-xs">{issues.length}</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">0</Badge>
          )}
        </TableCell>
        <TableCell className="text-center text-xs">
          {(page.internalLinks as string[])?.length ?? 0} / {(page.externalLinks as string[])?.length ?? 0}
        </TableCell>
      </TableRow>
      {open && (
        <TableRow>
          <TableCell colSpan={5} className="bg-muted/30 p-4">
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Meta</p>
                <p><span className="text-muted-foreground">Title:</span> {page.title || "Missing"}</p>
                <p><span className="text-muted-foreground">Description:</span> {page.metaDescription || "Missing"}</p>
                <p><span className="text-muted-foreground">H1:</span> {page.h1 || "Missing"}</p>
                {(page.h2s as string[])?.length > 0 && (
                  <p><span className="text-muted-foreground">H2s:</span> {(page.h2s as string[]).join(", ")}</p>
                )}
              </div>
              <div>
                {issues.length > 0 && (
                  <>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Issues</p>
                    {issues.map((issue, i) => (
                      <p key={i} className="text-xs mb-0.5">
                        <Badge variant={issue.severity === "high" ? "destructive" : "secondary"} className="text-xs mr-1">{issue.severity}</Badge>
                        {issue.description}
                      </p>
                    ))}
                  </>
                )}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
