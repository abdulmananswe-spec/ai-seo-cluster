import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileSearch, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatsLoadingSkeleton } from "@/components/loading-skeleton";
import { StatCard } from "@/components/stat-card";
import type { Project, SiteAnalysis, CrawledPage } from "@shared/schema";

export default function SiteAudit() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedAnalysis, setSelectedAnalysis] = useState<string>("");

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: analyses } = useQuery<SiteAnalysis[]>({
    queryKey: ["/api/projects", projectId, "site-analyses"],
    enabled: !!projectId,
  });

  const completedAnalyses = analyses?.filter(a => a.status === "complete") || [];
  const analysisId = selectedAnalysis ? Number(selectedAnalysis) : null;

  const { data: pages, isLoading } = useQuery<CrawledPage[]>({
    queryKey: ["/api/site-analyses", analysisId, "pages"],
    enabled: !!analysisId,
  });

  const totalIssues = pages?.reduce((sum, p) => sum + ((p.seoIssues as any[])?.length ?? 0), 0) ?? 0;
  const highIssues = pages?.reduce((sum, p) => {
    return sum + ((p.seoIssues as any[])?.filter((i: any) => i.severity === "high").length ?? 0);
  }, 0) ?? 0;
  const medIssues = pages?.reduce((sum, p) => {
    return sum + ((p.seoIssues as any[])?.filter((i: any) => i.severity === "medium").length ?? 0);
  }, 0) ?? 0;
  const lowIssues = totalIssues - highIssues - medIssues;

  const avgScore = pages && pages.length > 0
    ? Math.round(pages.reduce((sum, p) => sum + (p.pageAuthority ?? 0), 0) / pages.length)
    : 0;

  return (
    <div>
      <PageHeader
        title="Site Audit"
        description="Page-by-page SEO audit with detailed issues and recommendations"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={selectedProject} onValueChange={(v) => {
                setSelectedProject(v);
                setSelectedAnalysis("");
              }}>
                <SelectTrigger className="md:w-64" data-testid="select-project-audit">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedAnalysis} onValueChange={setSelectedAnalysis} disabled={completedAnalyses.length === 0}>
                <SelectTrigger className="flex-1" data-testid="select-analysis-audit">
                  <SelectValue placeholder={completedAnalyses.length === 0 ? "No analyses available" : "Select analysis"} />
                </SelectTrigger>
                <SelectContent>
                  {completedAnalyses.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.url} — {new Date(a.createdAt).toLocaleDateString()} ({a.totalPages} pages)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={FileSearch}
            title="Select a project"
            description="Choose a project and analysis to view the site audit."
            testId="empty-audit-select"
          />
        ) : !selectedAnalysis ? (
          <EmptyState
            icon={FileSearch}
            title="Select an analysis"
            description={completedAnalyses.length === 0 ? "Run a site analysis first from the Site Analyzer page." : "Choose a completed analysis to view the audit."}
            testId="empty-audit-analysis"
          />
        ) : isLoading ? (
          <StatsLoadingSkeleton />
        ) : !pages || pages.length === 0 ? (
          <EmptyState
            icon={FileSearch}
            title="No pages found"
            description="This analysis has no crawled pages."
            testId="empty-audit-pages"
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <StatCard title="Avg. Page Score" value={avgScore} icon={CheckCircle2} color="green" testId="audit-avg-score" />
              <StatCard title="High Issues" value={highIssues} icon={AlertTriangle} color="orange" testId="audit-high" />
              <StatCard title="Medium Issues" value={medIssues} icon={Info} color="purple" testId="audit-med" />
              <StatCard title="Low Issues" value={lowIssues} icon={Info} color="blue" testId="audit-low" />
            </div>

            <div className="space-y-3">
              {pages.map((page) => (
                <AuditPageCard key={page.id} page={page} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AuditPageCard({ page }: { page: CrawledPage }) {
  const [open, setOpen] = useState(false);
  const issues = (page.seoIssues as { issue: string; severity: string; description: string }[]) || [];
  const highCount = issues.filter(i => i.severity === "high").length;

  const scoreColor = (s: number) => {
    if (s >= 70) return "text-emerald-600";
    if (s >= 40) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card className="border border-card-border" data-testid={`card-audit-${page.id}`}>
      <CardContent className="p-0">
        <button
          className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          onClick={() => setOpen(!open)}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${scoreColor(page.pageAuthority ?? 0)} bg-muted/50`}>
              {page.pageAuthority?.toFixed(0) ?? "-"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{page.title || "Untitled Page"}</p>
              <p className="text-xs text-muted-foreground truncate">{page.url}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            <Badge variant="outline" className="text-xs">{page.wordCount} words</Badge>
            {issues.length > 0 && (
              <Badge variant={highCount > 0 ? "destructive" : "secondary"} className="text-xs">
                {issues.length} issues
              </Badge>
            )}
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>

        {open && (
          <div className="border-t border-border p-4 space-y-4">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Meta Information</p>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-muted-foreground">Title: </span>
                    <span className={page.title ? "" : "text-red-500"}>{page.title || "Missing"}</span>
                    {page.title && <span className="text-xs text-muted-foreground ml-1">({page.title.length} chars)</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description: </span>
                    <span className={page.metaDescription ? "" : "text-red-500"}>{page.metaDescription || "Missing"}</span>
                    {page.metaDescription && <span className="text-xs text-muted-foreground ml-1">({page.metaDescription.length} chars)</span>}
                  </div>
                  <div>
                    <span className="text-muted-foreground">H1: </span>
                    <span className={page.h1 ? "" : "text-red-500"}>{page.h1 || "Missing"}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Content</p>
                <div className="space-y-1.5">
                  <p><span className="text-muted-foreground">Word Count:</span> {page.wordCount?.toLocaleString()}</p>
                  <p><span className="text-muted-foreground">Keyword Density:</span> {page.keywordDensity?.toFixed(2)}%</p>
                  <p><span className="text-muted-foreground">H2 Headings:</span> {(page.h2s as string[])?.length ?? 0}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Links</p>
                <div className="space-y-1.5">
                  <p><span className="text-muted-foreground">Internal Links:</span> {(page.internalLinks as string[])?.length ?? 0}</p>
                  <p><span className="text-muted-foreground">External Links:</span> {(page.externalLinks as string[])?.length ?? 0}</p>
                </div>
              </div>
            </div>

            {(page.h2s as string[])?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Heading Structure</p>
                <div className="flex flex-wrap gap-1.5">
                  {(page.h2s as string[]).map((h2, i) => (
                    <Badge key={i} variant="outline" className="text-xs">{h2}</Badge>
                  ))}
                </div>
              </div>
            )}

            {issues.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">SEO Issues</p>
                <div className="space-y-2">
                  {issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30">
                      <Badge
                        variant={issue.severity === "high" ? "destructive" : issue.severity === "medium" ? "secondary" : "outline"}
                        className="text-xs shrink-0 mt-0.5"
                      >
                        {issue.severity}
                      </Badge>
                      <div>
                        <span className="font-medium">{issue.issue}</span>
                        <p className="text-xs text-muted-foreground">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
