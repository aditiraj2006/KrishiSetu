import { useState, useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Sprout, Factory, Warehouse, Store, Calendar, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@shared/schema';

interface JourneyStep {
  id: string;
  name: string;
  location: string;
  date: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  textColor: string;
}

interface SupplyChainMapProps {
  productId?: string;
  product?: Product; // Add product prop
  onProductSelect?: (productId: string) => void;
  showProductSelector?: boolean; // Add this prop to control visibility of the selector
}

// Create an extended interface that includes the missing properties
interface ExtendedProduct extends Product {
  distributorName?: string;
  warehouseLocation?: string;
  storeName?: string;
  storeLocation?: string;
}

export function SupplyChainMap({ productId, product, onProductSelect, showProductSelector = true }: SupplyChainMapProps = {}) {
  const { user } = useAuth();
  const { data: products, isLoading } = useProducts(user?.id);
  const [selectedProductId, setSelectedProductId] = useState<string>(productId || '');
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  
  // Update selectedProductId when productId prop changes
  useEffect(() => {
    if (productId && productId !== selectedProductId) {
      setSelectedProductId(productId);
    }
  }, [productId]);

  // If a product prop is provided, use it, otherwise find the product from the list
  const selectedProduct = product || products?.find(p => p.id === selectedProductId);

  // Update journey steps when selected product changes
  useEffect(() => {
    if (selectedProduct) {
      console.log('Selected product data:', selectedProduct);
      
      // Cast to ExtendedProduct to access the additional properties
      const extendedProduct = selectedProduct as ExtendedProduct;
      
      // Get farm data from the selected product
      const farmLocation = extendedProduct.location?.trim() || 'Haryana';
      const farmName = extendedProduct.farmName?.trim() || 'Sunny Acres Farm';
      
      // Get distributor data from the selected product
      const distributorName = extendedProduct.distributorName?.trim() || 'Fresh Pack Co.';
      const distributorLocation = extendedProduct.warehouseLocation?.trim() || 'Chandigarh';
      
      // Get retailer data from the selected product
      const retailerName = extendedProduct.storeName?.trim() || 'Green Market';
      const retailerLocation = extendedProduct.storeLocation?.trim() || 'Bangalore';
      
      console.log('Retailer data from product:', { retailerName, retailerLocation });
      
      // Corrected journey steps with retailer in the proper position
      const updatedJourneySteps: JourneyStep[] = [
        { 
          id: '1', 
          name: farmName, 
          location: farmLocation, 
          date: 'Jan 10', 
          status: 'Harvested', 
          icon: Sprout, 
          bgColor: 'bg-primary', 
          textColor: 'text-primary-foreground'
        },
        { 
          id: '2', 
          name: distributorName, 
          location: distributorLocation, 
          date: 'Jan 12', 
          status: 'Processed', 
          icon: Factory, 
          bgColor: 'bg-accent', 
          textColor: 'text-accent-foreground'
        },
        { 
          id: '3', 
          name: retailerName, // Retailer name goes here
          location: retailerLocation, // Retailer location goes here
          date: 'Jan 14', 
          status: 'Available at Store', 
          icon: Store, // Using Store icon for retailer
          bgColor: 'bg-secondary', 
          textColor: 'text-secondary-foreground'
        },
        { 
          id: '4', 
          name: 'Consumer', 
          location: 'Bengaluru', // Fixed to Bengaluru
          date: 'Jan 16', 
          status: 'Purchased', 
          icon: Warehouse, // Using Warehouse icon for consumer
          bgColor: 'bg-warning', 
          textColor: 'text-white'
        }
      ];
      
      setJourneySteps(updatedJourneySteps);
    } else if (products && products.length > 0 && !selectedProductId && !product) {
      // If no product is selected and no product prop provided, use the first product
      const firstProduct = products[0];
      setSelectedProductId(firstProduct.id);
      if (onProductSelect) {
        onProductSelect(firstProduct.id);
      }
    } else {
      // If no products are available, show empty state
      setJourneySteps([]);
    }
  }, [selectedProduct, products, selectedProductId, onProductSelect, product]);

  const journeyStats = {
    verifiedStages: journeySteps.length, // Dynamic based on actual steps
    totalDistance: '2,100 km',
    journeyTime: '6 days',
    avgTemperature: '28°C'
  };

  // Function to open Google Maps with the route using city/state names
  const openGoogleMapsRoute = () => {
    if (journeySteps.length < 2) return;
    
    // Create waypoints for the route (all intermediate points)
    const waypoints = journeySteps
      .slice(1, -1)
      .map(step => step.location)
      .filter(Boolean)
      .join('|');
    
    // Create origin and destination
    const origin = journeySteps[0].location;
    const destination = journeySteps[journeySteps.length - 1].location; // This will be Bengaluru
    
    if (!origin || !destination) return;
    
    // Construct the Google Maps URL with city/state names
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints)}&travelmode=driving`;
    
    // Open in a new tab
    window.open(mapsUrl, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border border-border">
      {/* Header */}
      <CardHeader className="px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="flex items-center text-lg font-semibold text-foreground gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          Supply Chain Journey
        </h3>
        {showProductSelector ? (
          <div className="flex items-center gap-3">
            <Select 
              value={selectedProductId} 
              onValueChange={(value) => {
                console.log('Product selected:', value);
                setSelectedProductId(value);
                if (onProductSelect) {
                  onProductSelect(value);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select a product">
                  {selectedProductId ? (
                    products?.find(p => p.id === selectedProductId)?.batchId + ' – ' + 
                    products?.find(p => p.id === selectedProductId)?.name
                  ) : (
                    "Select a product"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {products?.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.batchId} – {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={openGoogleMapsRoute}
              variant="outline"
              className="flex items-center gap-2"
              disabled={journeySteps.length === 0}
            >
              <ExternalLink className="w-4 h-4" />
              View on Map
            </Button>
          </div>
        ) : (
          <Button 
            onClick={openGoogleMapsRoute}
            variant="outline"
            className="flex items-center gap-2"
            disabled={journeySteps.length === 0}
          >
            <ExternalLink className="w-4 h-4" />
            View on Map
          </Button>
        )}
      </CardHeader>

      {/* Map & Steps */}
      <CardContent className="p-0">
        {journeySteps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a product to view its supply chain journey</p>
          </div>
        ) : (
          <>
            <div className="relative bg-gradient-to-b from-blue-50/50 to-green-50/50 dark:from-blue-950/20 dark:to-green-950/20">
              {/* Mobile: Vertical layout with arrows for ALL items */}
              <div className="sm:hidden p-4">
                <div className="flex flex-col gap-4">
                  {journeySteps.map((step, idx) => {
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className="flex items-center justify-between w-full">
                        {/* Step content */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`${step.bgColor} rounded-full p-3 shadow-lg flex-shrink-0`}>
                            <Icon className={`w-5 h-5 ${step.textColor}`} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-foreground truncate">{step.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{step.location}</div>
                            <div className="flex items-center text-xs text-green-600 gap-1 mt-1">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span>{step.date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Arrow - Show for all except last item */}
                        {idx !== journeySteps.length - 1 && (
                          <div className="flex-shrink-0 ml-3">
                            <svg 
                              className="w-5 h-5 text-blue-600" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop: Original horizontal layout */}
              <div className="hidden sm:block py-4">
                <div className="flex items-center justify-center gap-6 px-8">
                  {journeySteps.map((step, idx) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.id} className="flex items-center gap-4">
                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <div className={`${step.bgColor} rounded-full p-3 shadow-lg transition-transform group-hover:scale-110`}>
                            <Icon className={`w-5 h-5 ${step.textColor}`} />
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-foreground">{step.name}</div>
                            <div className="text-xs text-muted-foreground">{step.location}</div>
                            <div className="flex items-center justify-center text-xs text-green-600 gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              <span>{step.date}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Desktop connector - only between steps */}
                        {idx !== journeySteps.length - 1 && (
                          <div className="h-px bg-border w-12 relative">
                            <div className="absolute inset-0 bg-primary animate-pulse opacity-60"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-4 border-t border-border">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="text-xl font-bold text-green-600">{journeyStats.verifiedStages}</div>
                  <div className="text-xs text-muted-foreground">Verified Stages</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{journeyStats.totalDistance}</div>
                  <div className="text-xs text-muted-foreground">Total Distance</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-accent">{journeyStats.journeyTime}</div>
                  <div className="text-xs text-muted-foreground">Journey Time</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-primary">{journeyStats.avgTemperature}</div>
                  <div className="text-xs text-muted-foreground">Avg Temperature</div>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}