import { Package } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export default function EmptyState({
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/30 rounded-lg border border-dashed">
      <Package className="w-12 h-12 text-muted-foreground mb-4" />

      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          {description}
        </p>
      )}
    </div>
  );
}