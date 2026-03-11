import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Users, Plus, Trash2, Loader2, Sparkles, Globe, TrendingUp,
  Shield, AlertTriangle, Target, ChevronDown, ChevronUp, Search
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import type { Project, Competitor, CompetitorAnalysis } from "@shared/schema";

export default function CompetitorAnalysisPage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [domain, setDomain] = useState("");
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: competitors, isLoading } = useQuery<Competitor[]>({
    queryKey: ["/api/projects", projectId, "competitors"],
    enabled: !!projectId,
  });

  const addMutation = useMutation({
    mutationFn: async ({ projectId, domain }: { projectId: number; domain: string }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/competitors`, { domain });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "competitors"] });
      toast({ title: "Competitor added" });
      setDomain("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/competitors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "competitors"] });
      toast({ title: "Competitor removed" });
    },
  });

  return (
    <div>
      <PageHeader
        title="Competitor Analysis"
        description="Track and analyze your SEO competitors"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3">
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="md:w-64" data-testid="select-project-competitor">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="competitor-domain.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex-1"
                data-testid="input-competitor-domain"
              />
              <Button
                onClick={() => projectId && addMutation.mutate({ projectId, domain: domain.trim() })}
                disabled={!domain.trim() || !projectId || addMutation.isPending}
                data-testid="button-add-competitor"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Competitor
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={Users}
            title="Select a project"
            description="Choose a project to manage competitors."
            testId="empty-competitor-select"
          />
        ) : isLoading ? (
          <TableLoadingSkeleton rows={3} />
        ) : !competitors || competitors.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No competitors added"
            description="Add competitor domains to start analyzing them."
            testId="empty-competitors"
          />
        ) : (
          <div className="space-y-4">
            {competitors.map((comp) => (
              <CompetitorCard
                key={comp.id}
                competitor={comp}
                onDelete={() => deleteMutation.mutate(comp.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitorCard({ competitor, onDelete }: { competitor: Competitor; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();

  const { data: analysis } = useQuery<CompetitorAnalysis | null>({
    queryKey: ["/api/competitors", competitor.id, "analysis"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/competitors/${competitor.id}/analysis`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch analysis");
        return res.json();
      } catch {
        return null;
      }
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/competitors/${competitor.id}/analyze`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/competitors", competitor.id, "analysis"] });
      toast({ title: "Analysis complete", description: `${competitor.domain} analyzed.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border border-card-border" data-testid={`card-competitor-${competitor.id}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">{competitor.domain}</h3>
              {analysis && (
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">DA: {analysis.domainAuthority?.toFixed(0)}</Badge>
                  <Badge variant="secondary" className="text-xs">{analysis.organicKeywords?.toLocaleString()} keywords</Badge>
                  <Badge variant="secondary" className="text-xs">{analysis.organicTraffic?.toLocaleString()} traffic/mo</Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              data-testid={`button-analyze-${competitor.id}`}
            >
              {analyzeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              {analyzeMutation.isPending ? "Analyzing..." : analysis ? "Re-analyze" : "Analyze"}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Competitor</AlertDialogTitle>
                  <AlertDialogDescription>Remove {competitor.domain} and all its analysis data?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {analysis && (
          <Collapsible open={expanded} onOpenChange={setExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between">
                <span className="text-sm">Full Analysis</span>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-3 space-y-4">
                {(analysis.topKeywords as { keyword: string; position: number; volume: number }[])?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Search className="h-3 w-3" /> Top Keywords
                    </p>
                    <div className="grid gap-1.5">
                      {(analysis.topKeywords as { keyword: string; position: number; volume: number }[]).map((kw, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 rounded bg-muted/50">
                          <span>{kw.keyword}</span>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs">#{kw.position}</Badge>
                            <span className="text-xs text-muted-foreground">{kw.volume.toLocaleString()} vol</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  {(analysis.contentGaps as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Target className="h-3 w-3" /> Content Gaps
                      </p>
                      <ul className="space-y-1">
                        {(analysis.contentGaps as string[]).map((gap, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="text-amber-500 mt-1.5 shrink-0 h-1 w-1 rounded-full bg-amber-500" />
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(analysis.strengths as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Strengths
                      </p>
                      <ul className="space-y-1">
                        {(analysis.strengths as string[]).map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-1.5 shrink-0 h-1 w-1 rounded-full bg-emerald-500" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {(analysis.weaknesses as string[])?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Weaknesses
                      </p>
                      <ul className="space-y-1">
                        {(analysis.weaknesses as string[]).map((w, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                            <span className="mt-1.5 shrink-0 h-1 w-1 rounded-full bg-red-500" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
