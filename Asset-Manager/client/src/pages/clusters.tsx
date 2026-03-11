import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Network, FolderOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { CardLoadingSkeleton } from "@/components/loading-skeleton";
import type { Project } from "@shared/schema";

export default function Clusters() {
  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  return (
    <div>
      <PageHeader
        title="Clusters"
        description="View semantic keyword clusters across all projects"
      />

      {isLoading ? (
        <CardLoadingSkeleton count={4} />
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon={Network}
          title="No projects yet"
          description="Create a project and collect keywords to generate clusters."
          action={
            <Link href="/projects">
              <Button data-testid="button-go-projects">Go to Projects</Button>
            </Link>
          }
          testId="empty-clusters-page"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ClusterProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClusterProjectCard({ project }: { project: Project }) {
  const { data: stats } = useQuery<{ keywordCount: number; clusterCount: number; contentPlanCount: number }>({
    queryKey: ["/api/projects", project.id, "stats"],
  });

  return (
    <Card className="border border-card-border" data-testid={`card-clusters-project-${project.id}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
            <Network className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{project.domain}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {stats?.clusterCount ?? 0} clusters
          </Badge>
          <Link href={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm" className="gap-1 text-xs" data-testid={`button-manage-clusters-${project.id}`}>
              View <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
