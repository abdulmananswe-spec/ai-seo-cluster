import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" data-testid="button-sidebar-trigger" />
        <Separator orientation="vertical" className="h-5" />
        <div className="flex items-center justify-between w-full">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-page-description">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
