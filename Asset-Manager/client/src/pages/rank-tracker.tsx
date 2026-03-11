import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  TrendingUp, TrendingDown, Minus, Loader2, Sparkles, BarChart3, ArrowUp, ArrowDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton } from "@/components/loading-skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, RankEntry } from "@shared/schema";

export default function RankTracker() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });

  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: entries, isLoading } = useQuery<RankEntry[]>({
    queryKey: ["/api/projects", projectId, "rank-entries"],
    enabled: !!projectId,
  });

  const trackMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/track-rankings`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "rank-entries"] });
      const count = Array.isArray(data) ? data.length : 0;
      toast({ title: "Rankings tracked", description: `${count} keyword positions updated.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const latestEntries = entries?.reduce<Map<string, RankEntry>>((map, entry) => {
    if (!map.has(entry.keyword)) {
      map.set(entry.keyword, entry);
    }
    return map;
  }, new Map());

  const latestList = latestEntries ? Array.from(latestEntries.values()) : [];

  const withPosition = latestList.filter(e => e.position);
  const avgPosition = withPosition.length > 0
    ? withPosition.reduce((sum, e) => sum + (e.position || 0), 0) / withPosition.length
    : 0;

  const improved = latestList.filter(e => e.position && e.previousPosition && e.position < e.previousPosition).length;
  const declined = latestList.filter(e => e.position && e.previousPosition && e.position > e.previousPosition).length;
  const top10 = latestList.filter(e => e.position && e.position <= 10).length;

  return (
    <div>
      <PageHeader
        title="Rank Tracker"
        description="Track keyword rankings over time"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger data-testid="select-project-rank">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.domain})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => projectId && trackMutation.mutate(projectId)}
                disabled={!projectId || trackMutation.isPending}
                data-testid="button-track-rankings"
              >
                {trackMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {trackMutation.isPending ? "Tracking..." : "Check Rankings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={BarChart3}
            title="Select a project"
            description="Choose a project to track keyword rankings."
            testId="empty-rank-select"
          />
        ) : isLoading ? (
          <TableLoadingSkeleton rows={5} />
        ) : latestList.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No ranking data"
            description="Click 'Check Rankings' to track your keyword positions."
            testId="empty-rank"
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border border-card-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Avg. Position</p>
                  <p className="text-2xl font-bold">{avgPosition.toFixed(1)}</p>
                </CardContent>
              </Card>
              <Card className="border border-card-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Top 10</p>
                  <p className="text-2xl font-bold text-emerald-600">{top10}</p>
                </CardContent>
              </Card>
              <Card className="border border-card-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Improved</p>
                  <p className="text-2xl font-bold text-emerald-600">{improved}</p>
                </CardContent>
              </Card>
              <Card className="border border-card-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Declined</p>
                  <p className="text-2xl font-bold text-red-600">{declined}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-card-border">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead className="text-center">Position</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                      <TableHead>URL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestList.map((entry) => {
                      const change = entry.previousPosition && entry.position
                        ? entry.previousPosition - entry.position
                        : null;
                      return (
                        <TableRow key={entry.id} data-testid={`row-rank-${entry.id}`}>
                          <TableCell className="font-medium">{entry.keyword}</TableCell>
                          <TableCell className="text-center">
                            {entry.position ? (
                              <Badge
                                variant={entry.position <= 10 ? "default" : entry.position <= 30 ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                #{entry.position}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">Not ranking</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {change !== null ? (
                              <div className={`flex items-center justify-center gap-1 text-sm ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-muted-foreground"}`}>
                                {change > 0 ? <ArrowUp className="h-3.5 w-3.5" /> : change < 0 ? <ArrowDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                                {change !== 0 ? Math.abs(change) : "-"}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">New</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground truncate max-w-48">
                            {entry.url || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
