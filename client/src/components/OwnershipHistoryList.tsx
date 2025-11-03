import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, User, Calendar, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';

interface ProductOwner {
  _id: string;
  productId: string;
  ownerId: string;
  username: string;
  name: string;
  addedBy: string;
  role: string;
  transferType: string;
  blockNumber: number;
  previousOwnerHash: string | null;
  ownershipHash: string;
  createdAt: string;
}

interface OwnershipHistoryListProps {
  productId: string;
}

export function OwnershipHistoryList({ productId }: OwnershipHistoryListProps) {
  const [owners, setOwners] = useState<ProductOwner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOwnershipHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/${productId}/owners`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch ownership history');
        }
        
        const data = await response.json();
        setOwners(data);
        
        // Verify the ownership chain
        const verificationResponse = await fetch(`/api/products/${productId}/verify-ownership`);
        const verificationData = await verificationResponse.json();
        
        if (!verificationData.ownershipValid) {
          toast({
            title: "Warning: Ownership Chain Compromised",
            description: "The blockchain validation has detected integrity issues with this product's ownership history.",
            variant: "destructive"
          });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load ownership history');
        console.error('Error fetching ownership history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOwnershipHistory();
  }, [productId, toast]);
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/50 rounded-md text-center">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }
  
  if (owners.length === 0) {
    return (
      <div className="text-center py-6">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No ownership records found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {owners.map((owner, index) => (
        <Card key={owner._id} className={`overflow-hidden ${index === owners.length - 1 ? 'border-primary/50' : ''}`}>
          <CardContent className="p-4 relative">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center 
                ${index === owners.length - 1 ? 'bg-primary text-primary-foreground' : 'text-primary'}`}
              >
                <User className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{owner.name}</h4>
                  <span className="text-xs text-muted-foreground">@{owner.username}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {owner.role.charAt(0).toUpperCase() + owner.role.slice(1)}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(owner.createdAt), 'MMM d, yyyy')}
                  </span>
                  <Badge 
                    variant={index === 0 ? "default" : "outline"} 
                    className={index === 0 ? "bg-primary" : ""}
                  >
                    {owner.transferType.charAt(0).toUpperCase() + owner.transferType.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                  Block #{owner.blockNumber}
                </Badge>
              </div>
            </div>
            
            {/* Show connection arrows between blocks */}
            {index < owners.length - 1 && (
              <div className="h-8 w-0.5 bg-border absolute left-7 bottom-0 transform translate-x-1/2 translate-y-full">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground absolute -right-1.5 -top-1.5 transform -rotate-45" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}