import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Link2, Loader2, Sparkles, ChevronDown, ChevronUp
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton, StatsLoadingSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, BacklinkAnalysis } from "@shared/schema";

export default function BacklinkAnalyzer() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [domain, setDomain] = useState("");
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: analyses, isLoading } = useQuery<BacklinkAnalysis[]>({
    queryKey: ["/api/projects", projectId, "backlink-analyses"],
    enabled: !!projectId,
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ projectId, domain }: { projectId: number; domain: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/analyze-backlinks`, { domain });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "backlink-analyses"] });
      toast({ title: "Backlinks analyzed" });
      setDomain("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const selectedProjectData = projects?.find(p => p.id === projectId);

  return (
    <div>
      <PageHeader
        title="Backlink Analyzer"
        description="Analyze backlink profiles for any domain"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={selectedProject} onValueChange={(v) => {
                setSelectedProject(v);
                const proj = projects?.find(p => p.id === Number(v));
                if (proj) setDomain(proj.domain);
              }}>
                <SelectTrigger className="md:w-64" data-testid="select-project-backlinks">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="domain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex-1"
                data-testid="input-backlink-domain"
              />
              <Button
                onClick={() => projectId && analyzeMutation.mutate({ projectId, domain: domain.trim() })}
                disabled={!domain.trim() || !projectId || analyzeMutation.isPending}
                data-testid="button-analyze-backlinks"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {analyzeMutation.isPending ? "Analyzing..." : "Analyze Backlinks"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={Link2}
            title="Select a project"
            description="Choose a project to analyze backlinks."
            testId="empty-backlinks-select"
          />
        ) : isLoading ? (
          <StatsLoadingSkeleton />
        ) : !analyses || analyses.length === 0 ? (
          <EmptyState
            icon={Link2}
            title="No backlink analyses"
            description="Analyze a domain above to see its backlink profile."
            testId="empty-backlinks"
          />
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <BacklinkCard key={analysis.id} analysis={analysis} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BacklinkCard({ analysis }: { analysis: BacklinkAnalysis }) {
  const [expanded, setExpanded] = useState(false);

  const daColor = (da: number) => {
    if (da >= 60) return "text-emerald-600";
    if (da >= 30) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card className="border border-card-border" data-testid={`card-backlink-${analysis.id}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">{analysis.domain}</h3>
            <p className="text-xs text-muted-foreground">
              Analyzed {new Date(analysis.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Domain Authority</p>
            <p className={`text-2xl font-bold ${daColor(analysis.domainAuthority ?? 0)}`}>
              {analysis.domainAuthority?.toFixed(0) ?? "N/A"}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Total Backlinks</p>
            <p className="text-2xl font-bold">{analysis.totalBacklinks?.toLocaleString() ?? "N/A"}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-1">Referring Domains</p>
            <p className="text-2xl font-bold">{analysis.referringDomains?.toLocaleString() ?? "N/A"}</p>
          </div>
        </div>

        {(analysis.anchorDistribution as { anchor: string; count: number; percentage: number }[])?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Anchor Text Distribution</p>
            <div className="space-y-2">
              {(analysis.anchorDistribution as { anchor: string; count: number; percentage: number }[]).map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate max-w-48">{item.anchor}</span>
                    <span className="text-muted-foreground">{item.percentage.toFixed(1)}% ({item.count})</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, item.percentage)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between">
              <span className="text-sm">Top Backlinks ({(analysis.topBacklinks as any[])?.length ?? 0})</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Anchor</TableHead>
                    <TableHead className="text-center">Authority</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(analysis.topBacklinks as { source: string; target: string; anchor: string; authority: number; type: string }[])?.map((bl, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs max-w-48 truncate">{bl.source}</TableCell>
                      <TableCell className="text-xs max-w-32 truncate">{bl.anchor}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="text-xs">{bl.authority}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={bl.type === "dofollow" ? "default" : "secondary"} className="text-xs">
                          {bl.type}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
