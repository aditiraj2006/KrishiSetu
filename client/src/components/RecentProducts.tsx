import { useUserProducts } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Eye, ShieldCheck, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentProducts() {
  const { user } = useAuth();
  const { data: products, isLoading, error } = useUserProducts(user);

  if (isLoading) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <h3 className="text-lg font-semibold text-foreground">
            Recent Products
          </h3>
        </CardHeader>
        <CardContent>
          <div className="text-destructive text-sm">
            Failed to load products. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentProducts = products
    ? [...products]
        .sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        })
        .slice(0, 5)
    : [];

  return (
    <Card className="lg:col-span-2 shadow-sm border border-border overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Recent Products
          </h3>
          <Link href="/registered-products">
            <Button
              variant="link"
              className="text-primary hover:text-primary/80 text-sm font-medium p-0"
              data-testid="link-view-all-products"
            >
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {recentProducts.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground" data-testid="text-no-products">
              No products registered yet.
              <Link href="/product-registration">
                <Button
                  variant="link"
                  className="p-0 ml-1"
                  data-testid="link-register-first"
                >
                  Register your first product
                </Button>
              </Link>
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentProducts.map((product) => (
              <div
                key={product.id}
                className="p-6 hover:bg-muted/30 transition-colors"
                data-testid={`card-product-${product.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center">
                      <span className="text-2xl">🌱</span>
                    </div>

                    <div>
                      <h4
                        className="font-medium text-foreground"
                        data-testid={`text-product-name-${product.id}`}
                      >
                        {product.name}
                      </h4>
                      <p
                        className="text-sm text-muted-foreground"
                        data-testid={`text-product-batch-${product.id}`}
                      >
                        Batch #{product.batchId}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge
                          variant="secondary"
                          className={`text-xs font-medium flex items-center gap-1 ${
                            product.blockchainHash
                              ? "bg-verified/10 text-verified border-verified/20"
                              : "bg-warning/10 text-warning border-warning/20"
                          }`}
                          data-testid={`badge-verification-${product.id}`}
                        >
                          {product.blockchainHash ? (
                            <>
                              <ShieldCheck className="w-3 h-3" />
                              Verified
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              Pending
                            </>
                          )}
                        </Badge>
                        <span
                          className="text-xs text-muted-foreground"
                          data-testid={`text-product-location-${product.id}`}
                        >
                          {product.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className="text-sm font-medium text-foreground"
                      data-testid={`text-product-date-${product.id}`}
                    >
                      {product.createdAt
                        ? formatDistanceToNow(new Date(product.createdAt), {
                            addSuffix: true,
                          })
                        : "Unknown date"}
                    </div>
                    <div
                      className="text-xs text-muted-foreground"
                      data-testid={`text-product-status-${product.id}`}
                    >
                      {product.status}
                    </div>
                    <Link href={`/product/${product.id}?from=dashboard`}>
                      <Button
                        variant="link"
                        className="mt-2 text-accent hover:text-accent/80 text-xs font-medium flex items-center gap-1 p-0"
                        data-testid={`button-view-product-${product.id}`}
                      >
                        <Eye className="w-3 h-3" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
