import Lottie from "lottie-react";
import type React from "react";
import defaultAnimation from "../../assets/lottie/empty-state.json";

interface EmptyStateProps {
  title: string;
  description?: string;
  animationData?: any;
  action?: React.ReactNode;
}

export default function EmptyState({
  title,
  description,
  animationData = defaultAnimation,
  action,
}: EmptyStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center py-10 px-4 text-center bg-muted/30 rounded-lg border border-dashed transition-colors"
      aria-label={`Empty state: ${title}`}
    >
      <div className="w-48 h-48 mb-4 flex items-center justify-center" aria-hidden="true">
        <Lottie
          animationData={animationData}
          loop={true}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      {description && <p className="text-sm text-muted-foreground mt-2 max-w-sm">{description}</p>}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
