import { Card, CardContent } from '@/components/ui/card';
import { Sprout } from 'lucide-react';

export function LoadingStates() {
  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
      data-testid="loading-overlay"
    >
      <Card className="shadow-lg border border-border">
        <CardContent className="p-8 text-center">
          <div className="loading-pulse w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-medium mb-2" data-testid="text-processing">
            Processing on Blockchain
          </p>
          <p className="text-sm text-muted-foreground" data-testid="text-wait-message">
            This may take a few moments...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
