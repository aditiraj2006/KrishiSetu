import type { Product } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  History,
  MapPin,
  Package,
  Star,
  Shield,
  ShieldCheck,
  Truck,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "wouter";
import { NavigationHeader } from "@/components/NavigationHeader";
import { OwnershipHistoryList } from "@/components/OwnershipHistoryList";
import { ProductHistory } from "@/components/ProductHistory";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { SupplyChainMap } from "@/components/SupplyChainMap";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProduct, useProductRatings, useSubmitProductRating } from "@/hooks/useProducts";

interface ProductEvent {
  id: string;
  eventType: string;
  message: string;
  userId: string;
  createdAt: string;
  extra?: any;
}

// Add this interface for enhanced product data
interface EnhancedProduct extends Product {
  registeredBy?: string;
  registrationType?: "farmer" | "distributor" | "retailer";
  registrationDate?: Date;
  priceHistory?: Array<{
    price: string;
    setBy: string;
    date: Date;
    role: string;
  }>;
}

export default function ProductDetails() {
  const params = useParams();
  const productId = params.id as string;
  const { data: product, isLoading, error } = useProduct(productId);
  const { data: ratingsData, isLoading: ratingsLoading } = useProductRatings(productId);
  const submitRating = useSubmitProductRating(productId);
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedRating, setSelectedRating] = useState(0);

  // --- Add this state for the selected product in the supply chain map ---
  const [selectedProductIdForMap, setSelectedProductIdForMap] = useState<string>(productId);

  // Update selected product when productId changes
  useEffect(() => {
    setSelectedProductIdForMap(productId);
  }, [productId]);

  // --- Add this state and effect for events ---
  const [events, setEvents] = useState<ProductEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setEventsLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}/events`);
        if (res.ok) {
          const data = await res.json();
          setEvents(data);
        } else {
          setEvents([]);
        }
      } catch (e) {
        setEvents([]);
      }
      setEventsLoading(false);
    }
    fetchEvents();
  }, [productId]);
  // --------------------------------------------

  // --- Enhanced product info state ---
  const [enhancedProduct, setEnhancedProduct] = useState<EnhancedProduct | null>(null);

  useEffect(() => {
    async function fetchEnhancedProductData() {
      if (!product) return;
      try {
        // Fetch ownership history to get who registered what
        const ownersRes = await fetch(`/api/products/${productId}/owners`);
        const owners = await ownersRes.json();

        // Fetch product events for registration history (optional)
        // const eventsRes = await fetch(`/api/products/${productId}/events`);
        // const events = await eventsRes.json();

        const enhanced: EnhancedProduct = {
          ...product,
          registeredBy: owners.length > 0 ? owners[0].name : "Unknown",
          registrationType: owners.length > 0 ? owners[0].role : "farmer",
        };
        setEnhancedProduct(enhanced);
      } catch (error) {
        console.error("Error fetching enhanced product data:", error);
        setEnhancedProduct(product as EnhancedProduct);
      }
    }
    if (product) {
      fetchEnhancedProductData();
    }
  }, [product, productId]);
  // --- end enhanced info ---

  const currentUserRating = ratingsData?.ratings.find((rating) => rating.userId === user?.id);
  const ratingSummary = ratingsData?.summary ?? {
    averageRating: product?.averageRating ?? 0,
    ratingCount: product?.ratingCount ?? 0,
    ratingSum: product?.ratingSum ?? 0,
  };

  const handleRatingSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to rate products.",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const review = String(formData.get("review") ?? "").trim();
    const ratingValue = selectedRating || currentUserRating?.rating || 0;

    if (!ratingValue) {
      toast({
        title: "Choose a rating",
        description: "Select 1 to 5 stars before submitting.",
      });
      return;
    }

    try {
      await submitRating.mutateAsync({
        rating: ratingValue,
        review: review || undefined,
      });
      setSelectedRating(0);
      event.currentTarget.reset();
      toast({
        title: currentUserRating ? "Rating updated" : "Rating submitted",
        description: `Saved your ${ratingValue}-star rating for ${product?.name}.`,
      });
    } catch (submitError) {
      toast({
        title: "Failed to save rating",
        description: submitError instanceof Error ? submitError.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  const displayedRating = selectedRating || currentUserRating?.rating || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <NavigationHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-8 w-64 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <NavigationHeader />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-destructive mb-4">Product not found</div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <NavigationHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex gap-2 mb-4">
            {new URLSearchParams(window.location.search).get("from") === "dashboard" ? (
              <Link href="/dashboard">
                <Button variant="outline" className="primary-btn">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/registered-products">
                <Button variant="outline" className="primary-btn">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Registered Products
                </Button>
              </Link>
            )}
          </div>
          <h2 className="text-3xl font-bold text-foreground" data-testid="text-product-title">
            {product.name}
          </h2>
          <p className="text-muted-foreground mt-1">
            Batch #{product.batchId} • Registered{" "}
            {formatDistanceToNow(new Date(product.createdAt!), {
              addSuffix: true,
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Product Overview */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <h3 className="text-xl font-semibold text-foreground">Product Overview</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Category</div>
                        <div
                          className="text-sm text-muted-foreground capitalize"
                          data-testid="text-product-category"
                        >
                          {product.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Quantity</div>
                        <div
                          className="text-sm text-muted-foreground"
                          data-testid="text-product-quantity"
                        >
                          {product.quantity} {product.unit}
                        </div>
                      </div>
                    </div>
                    {enhancedProduct?.registeredBy && (
                      <div className="flex items-start gap-3">
                        <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-foreground">Registered by</div>
                          <div className="text-sm text-muted-foreground">
                            {enhancedProduct.registeredBy}
                            {enhancedProduct.registrationType && (
                              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                {enhancedProduct.registrationType}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Price */}
                    {product.price && (
                      <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                        <div className="flex items-start gap-3">
                          <DollarSign className="w-5 h-5 text-primary mt-0.5" />
                          <div>
                            <div className="text-sm font-medium text-foreground">Direct Price</div>
                            <div className="text-lg font-bold text-primary">₹{product.price}</div>
                          </div>
                        </div>
                        <Button
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => {
                            toast({
                              title: "Order Placed!",
                              description: `Your order for ${product.name} has been sent to the farmer.`,
                            });
                          }}
                        >
                          Buy Now
                        </Button>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Farm/Producer</div>
                        <div className="text-sm text-muted-foreground" data-testid="text-farm-name">
                          {product.farmName}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Origin Location</div>
                        <div
                          className="text-sm text-muted-foreground"
                          data-testid="text-product-location"
                        >
                          {product.location}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Harvest Date</div>
                        <div
                          className="text-sm text-muted-foreground"
                          data-testid="text-harvest-date"
                        >
                          {new Date(product.harvestDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <div className="text-sm font-medium text-foreground">Status</div>
                        <Badge
                          variant="secondary"
                          className={`${
                            product.status === "delivered"
                              ? "bg-verified/10 text-verified border-verified/20"
                              : product.status === "in_transit"
                                ? "bg-accent/10 text-accent border-accent/20"
                                : "bg-warning/10 text-warning border-warning/20"
                          }`}
                          data-testid="badge-product-status"
                        >
                          {product.status === "in_transit"
                            ? "In Transit"
                            : product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {product.description && (
                  <div className="pt-4 border-t border-border">
                    <div className="text-sm font-medium text-foreground mb-2">Description</div>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-product-description"
                    >
                      {product.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            <ProductHistory productId={productId} />
            {/* 2. Product Event Timeline */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Product Event Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsLoading ? (
                  <div className="text-muted-foreground">Loading events...</div>
                ) : events.length === 0 ? (
                  <div className="text-muted-foreground">No events yet.</div>
                ) : (
                  <ol className="space-y-4">
                    {events.map((ev) => (
                      <li key={ev.id} className="flex items-start gap-3">
                        <span>
                          {ev.eventType === "ownership_request" && (
                            <User className="w-4 h-4 text-accent" />
                          )}
                          {ev.eventType === "ownership_transfer" && (
                            <Shield className="w-4 h-4 text-verified" />
                          )}
                          {ev.eventType === "product_out_for_delivery" && (
                            <Truck className="w-4 h-4 text-primary" />
                          )}
                          {ev.eventType === "product_received" && (
                            <Package className="w-4 h-4 text-success" />
                          )}
                          {/* Add more icons as needed */}
                        </span>
                        <div>
                          <div className="font-medium">{ev.message}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ev.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            {/* 3. Supply Chain Journey */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Supply Chain Journey
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SupplyChainMap
                  product={product}
                  showProductSelector={false}
                  onProductSelect={(newProductId) => {
                    // If a different product is selected, navigate to that product's page
                    if (newProductId !== productId) {
                      window.location.href = `/product/${newProductId}`;
                    }
                  }}
                />
              </CardContent>
            </Card>

            {/* 4. Ownership Blockchain */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Ownership Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <OwnershipHistoryList productId={productId} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <h3 className="text-xl font-semibold text-foreground">Ratings & Reviews</h3>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="text-4xl font-bold text-foreground">
                    {(ratingSummary.averageRating ?? 0).toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-4 w-4 ${index < Math.round(ratingSummary.averageRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {ratingSummary.ratingCount ?? 0} review
                      {(ratingSummary.ratingCount ?? 0) === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleRatingSubmit} className="space-y-3">
                  {user ? (
                    <>
                      <div>
                        <div className="text-sm font-medium text-foreground mb-2">Your rating</div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const value = index + 1;
                            const isActive = value <= displayedRating;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setSelectedRating(value)}
                                className="rounded-full p-1 transition-colors hover:bg-muted"
                                aria-label={`Rate ${value} star${value === 1 ? "" : "s"}`}
                              >
                                <Star
                                  className={`h-5 w-5 ${isActive ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Textarea
                        key={currentUserRating?.id ?? "new-rating"}
                        name="review"
                        defaultValue={currentUserRating?.review ?? ""}
                        placeholder="Share your experience with this product"
                        rows={4}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={submitRating.isPending}
                      >
                        {submitRating.isPending ? "Saving..." : currentUserRating ? "Update rating" : "Submit rating"}
                      </Button>
                    </>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                      Sign in to leave a rating or review.
                    </div>
                  )}
                </form>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-foreground">Recent reviews</h4>
                    <span className="text-xs text-muted-foreground">
                      {ratingsData?.ratings.length ?? 0} total
                    </span>
                  </div>

                  {ratingsLoading ? (
                    <div className="text-sm text-muted-foreground">Loading reviews...</div>
                  ) : ratingsData?.ratings.length ? (
                    <div className="space-y-3">
                      {ratingsData.ratings.slice(0, 3).map((rating) => (
                        <div key={rating.id} className="rounded-lg border border-border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="font-medium text-sm text-foreground">{rating.userName}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {rating.userRole ?? "user"}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, index) => (
                                <Star
                                  key={index}
                                  className={`h-3.5 w-3.5 ${index < rating.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {rating.review ? (
                            <p className="text-sm text-muted-foreground">{rating.review}</p>
                          ) : null}
                          <div className="text-xs text-muted-foreground">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No reviews yet.</div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 5. QR Code */}
            <QRCodeGenerator product={product} />

            {/* 6. Certifications */}
            {product.certifications && product.certifications.length > 0 && (
              <Card className="shadow-sm border border-border">
                <CardHeader>
                  <h3 className="text-xl font-semibold text-foreground">Certifications</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.certifications.map((cert) => (
                      <Badge
                        key={cert}
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                        data-testid={`badge-certification-${cert.toLowerCase().replace(" ", "-")}`}
                      >
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 7. Quick Stats */}
            <Card className="shadow-sm border border-border">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">Quick Stats</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Scans</span>
                  <span className="font-medium text-foreground" data-testid="text-scan-count">
                    142
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span
                    className="font-medium text-foreground"
                    data-testid="text-transaction-count"
                  >
                    5
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quality Score</span>
                  <span className="font-medium text-verified" data-testid="text-quality-score">
                    95%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
