import { useState } from 'react';
import { useRecentScans } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { QrCode, Camera, Eye, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function QuickActionsPanel() {
  const { user } = useAuth();
  const { data: recentScans, isLoading } = useRecentScans(user?.id);
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScanning = () => {
    setIsScanning(!isScanning);
  };

  return (
    <div className="space-y-6">
      
      {/* QR Code Scanner Card */}
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <QrCode className="w-5 h-5 text-accent" />
            QR Scanner
          </h3>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="bg-muted rounded-lg p-8 text-center relative overflow-hidden">
            <div className="relative z-10">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Point camera at QR code to scan product information
              </p>
              <Link href="/qr-scanner">
                <Button 
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  data-testid="button-start-scanning"
                >
                  Start Scanning
                </Button>
              </Link>
            </div>
            
            {/* Scanning animation overlay */}
            {isScanning && (
              <div className="absolute inset-0 opacity-60">
                <div className="scan-line h-1 bg-gradient-to-r from-transparent via-accent to-transparent"></div>
              </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <Info className="w-4 h-4" />
              Scan any KrishiSetu QR code to instantly view product journey and verification details
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      <Card className="shadow-sm border border-border overflow-hidden">
        <CardHeader className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Scans</h3>
        </CardHeader>
        
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : recentScans?.length === 0 ? (
            <div className="text-center py-6">
              <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-recent-scans">
                No recent scans yet. Start scanning QR codes to see them here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentScans?.map((scan: any) => (
                <div key={scan.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg transition-colors hover:bg-muted/40" data-testid={`scan-item-${scan.id}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-verified/10 rounded-full flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-verified" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground" data-testid={`text-scan-product-${scan.id}`}>
                        {scan.product?.name || 'Unknown Product'}
                      </div>
                      <div className="text-xs text-muted-foreground" data-testid={`text-scan-time-${scan.id}`}>
                        {formatDistanceToNow(new Date(scan.timestamp!), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  {scan.product && (
                    <Link href={`/product/${scan.product.id}`}>
                      <Button 
                        variant="link" 
                        className="text-accent hover:text-accent/80 text-xs font-medium p-0"
                        data-testid={`button-view-scan-${scan.id}`}
                      >
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
