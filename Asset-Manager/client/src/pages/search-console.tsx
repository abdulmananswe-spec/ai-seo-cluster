import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  BarChart3, Loader2, Sparkles, MousePointerClick, Eye,
  TrendingUp, Target, Upload, Database
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { TableLoadingSkeleton, StatsLoadingSkeleton } from "@/components/loading-skeleton";
import { StatCard } from "@/components/stat-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Project, SearchConsoleData } from "@shared/schema";

export default function SearchConsolePage() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [csvData, setCsvData] = useState("");
  const { toast } = useToast();

  const { data: projects } = useQuery<Project[]>({ queryKey: ["/api/projects"] });
  const projectId = selectedProject ? Number(selectedProject) : null;

  const { data: scData, isLoading } = useQuery<SearchConsoleData[]>({
    queryKey: ["/api/projects", projectId, "search-console"],
    enabled: !!projectId,
  });

  const simulateMutation = useMutation({
    mutationFn: async (projectId: number) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/search-console/simulate`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "search-console"] });
      const count = Array.isArray(data) ? data.length : 0;
      toast({ title: "Data generated", description: `${count} search console entries created.` });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ projectId, data }: { projectId: number; data: any[] }) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/search-console/import`, { data });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "search-console"] });
      toast({ title: "Data imported" });
      setCsvData("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleImport = () => {
    if (!projectId || !csvData.trim()) return;
    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        const obj: any = {};
        headers.forEach((h, i) => {
          if (h === "query" || h === "page" || h === "date") obj[h] = values[i] || "";
          else obj[h] = Number(values[i]) || 0;
        });
        return obj;
      }).filter(d => d.query);
      importMutation.mutate({ projectId, data });
    } catch {
      toast({ title: "Error", description: "Invalid CSV format", variant: "destructive" });
    }
  };

  const totalClicks = scData?.reduce((sum, d) => sum + (d.clicks ?? 0), 0) ?? 0;
  const totalImpressions = scData?.reduce((sum, d) => sum + (d.impressions ?? 0), 0) ?? 0;
  const avgCtr = scData && scData.length > 0
    ? scData.reduce((sum, d) => sum + (d.ctr ?? 0), 0) / scData.length
    : 0;
  const avgPosition = scData && scData.length > 0
    ? scData.reduce((sum, d) => sum + (d.position ?? 0), 0) / scData.length
    : 0;

  return (
    <div>
      <PageHeader
        title="Search Console"
        description="Google Search Console data and performance metrics"
      />

      <div className="space-y-6">
        <Card className="border border-card-border">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row gap-3 items-end">
              <div className="flex-1">
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger data-testid="select-project-gsc">
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
                variant="outline"
                onClick={() => projectId && simulateMutation.mutate(projectId)}
                disabled={!projectId || simulateMutation.isPending}
                data-testid="button-simulate-gsc"
              >
                {simulateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                {simulateMutation.isPending ? "Generating..." : "Generate Sample Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!selectedProject ? (
          <EmptyState
            icon={BarChart3}
            title="Select a project"
            description="Choose a project to view Search Console data."
            testId="empty-gsc-select"
          />
        ) : isLoading ? (
          <StatsLoadingSkeleton />
        ) : (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview" data-testid="tab-gsc-overview">Overview</TabsTrigger>
              <TabsTrigger value="queries" data-testid="tab-gsc-queries">Queries</TabsTrigger>
              <TabsTrigger value="import" data-testid="tab-gsc-import">Import Data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Total Clicks" value={totalClicks.toLocaleString()} icon={MousePointerClick} color="blue" testId="gsc-stat-clicks" />
                <StatCard title="Impressions" value={totalImpressions.toLocaleString()} icon={Eye} color="green" testId="gsc-stat-impressions" />
                <StatCard title="Avg. CTR" value={`${(avgCtr * 100).toFixed(1)}%`} icon={TrendingUp} color="purple" testId="gsc-stat-ctr" />
                <StatCard title="Avg. Position" value={avgPosition.toFixed(1)} icon={Target} color="orange" testId="gsc-stat-position" />
              </div>

              {(!scData || scData.length === 0) && (
                <EmptyState
                  icon={Database}
                  title="No Search Console data"
                  description="Generate sample data or import from Google Search Console CSV export."
                  testId="empty-gsc-data"
                />
              )}
            </TabsContent>

            <TabsContent value="queries" className="mt-4">
              {!scData || scData.length === 0 ? (
                <EmptyState
                  icon={Database}
                  title="No query data"
                  description="Generate sample data or import from CSV."
                  testId="empty-gsc-queries"
                />
              ) : (
                <Card className="border border-card-border">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Query</TableHead>
                          <TableHead className="text-right">Clicks</TableHead>
                          <TableHead className="text-right">Impressions</TableHead>
                          <TableHead className="text-right">CTR</TableHead>
                          <TableHead className="text-right">Position</TableHead>
                          <TableHead>Page</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scData.map((row) => (
                          <TableRow key={row.id} data-testid={`row-gsc-${row.id}`}>
                            <TableCell className="font-medium text-sm">{row.query}</TableCell>
                            <TableCell className="text-right text-sm">{row.clicks}</TableCell>
                            <TableCell className="text-right text-sm">{row.impressions?.toLocaleString()}</TableCell>
                            <TableCell className="text-right text-sm">{((row.ctr ?? 0) * 100).toFixed(1)}%</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={
                                (row.position ?? 100) <= 10 ? "default" :
                                (row.position ?? 100) <= 30 ? "secondary" : "outline"
                              } className="text-xs">
                                {(row.position ?? 0).toFixed(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground truncate max-w-32">{row.page || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="import" className="mt-4">
              <Card className="border border-card-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Upload className="h-4 w-4" /> Import CSV Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Paste CSV data from Google Search Console export. Expected columns: query, clicks, impressions, ctr, position, page, date
                  </p>
                  <Textarea
                    placeholder={`query,clicks,impressions,ctr,position,page,date\nbest seo tools,150,5000,0.03,4.2,/blog/seo-tools,2024-03-01`}
                    value={csvData}
                    onChange={(e) => setCsvData(e.target.value)}
                    rows={8}
                    className="font-mono text-xs"
                    data-testid="textarea-csv-import"
                  />
                  <Button
                    onClick={handleImport}
                    disabled={!csvData.trim() || importMutation.isPending}
                    data-testid="button-import-csv"
                  >
                    {importMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {importMutation.isPending ? "Importing..." : "Import Data"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
