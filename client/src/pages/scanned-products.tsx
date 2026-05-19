import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { NavigationHeader } from "@/components/NavigationHeader";
import { getAuthHeaders } from "@/lib/authHeaders";
import type { Product } from "@shared/schema";

export default function ScannedProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScannedProducts = async () => {
      if (!user?.id || user.role !== "consumer") return;
      setIsLoading(true);

      const firebaseUid = user.firebaseUid;
      if (!firebaseUid) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/user/products/scanned`, { headers });
        if (!res.ok) throw new Error("Failed to fetch scanned products");
        const data = await res.json();
        setProducts(data);
      } catch (err: any) {
        setError(err?.message || "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchScannedProducts();
  }, [user]);

  return (
    <>
      <NavigationHeader />
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Scanned Products</h1>
        <p className="mb-4 text-muted-foreground">
          {user?.role === "consumer"
            ? "Here are the products you have scanned as a consumer."
            : "This page is for consumers to see their scanned products."}
        </p>
        {isLoading && (
          <div className="text-center text-muted-foreground">
            Loading scanned products...
          </div>
        )}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!isLoading && !error && products.length === 0 && (
          <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
            No scanned products yet.
          </div>
        )}
        <div className="space-y-6">
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent className="flex flex-col md:flex-row gap-6 items-center py-6">
                <div>
                  {product.qrCode ? (
                    <img
                      src={product.qrCode}
                      alt="QR Code"
                      className="w-32 h-32 rounded bg-white border"
                    />
                  ) : (
                    <QRCodeGenerator product={product} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold">
                      {product.name}
                    </span>
                    <Badge>{product.category}</Badge>
                    <Badge variant="outline">{product.status}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Quantity:</span>{" "}
                    {product.quantity} {product.unit}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Farm:</span>{" "}
                    {product.farmName}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Location:</span>{" "}
                    {product.location}
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">
                    <span className="font-medium">Harvest Date:</span>{" "}
                    {product.harvestDate
                      ? new Date(product.harvestDate).toLocaleDateString()
                      : "N/A"}
                  </div>
                  {product.batchId && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-medium">Batch ID:</span>{" "}
                      {product.batchId}
                    </div>
                  )}
                  {product.blockchainHash && (
                    <div className="text-xs text-muted-foreground break-all">
                      <span className="font-medium">Blockchain Hash:</span>{" "}
                      {product.blockchainHash}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
