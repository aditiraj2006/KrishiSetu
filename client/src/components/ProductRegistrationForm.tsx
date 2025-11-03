import { useRef, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProduct } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { insertProductSchema } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { LoadingStates } from "./LoadingStates";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, X, Plus, MapPin, Loader2 } from "lucide-react";

// Create a stricter schema with required fields
const formSchema = insertProductSchema.extend({
  harvestDate: z.string().min(1, "Harvest date is required"),
  quantity: z.string().min(1, "Quantity is required"),
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  farmName: z.string().min(1, "Farm name is required"),
  location: z.string().min(1, "Location is required"),
  unit: z.string().min(1, "Unit is required"),
  price: z.string().min(1, "Product price is required"), // <-- add this
  certifications: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof formSchema>;

const categories = ["vegetables", "fruits", "grains", "dairy", "meat"];

const certificationOptions = [
  "Organic",
  "Non-GMO",
  "Fair Trade",
  "Sustainable",
];

const units = ["kg", "lbs", "units", "boxes"];

interface ProductRegistrationFormProps {
  isVisible: boolean;
  onClose: () => void;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id?: number;
  osm_id?: number;
}

export function ProductRegistrationForm({
  isVisible,
  onClose,
}: ProductRegistrationFormProps) {
  const { user } = useAuth();
  const { mutate: createProduct, isPending } = useCreateProduct();
  const { toast } = useToast();

  const formRef = useRef<HTMLDivElement>(null);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (isVisible && formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isVisible]);

  // Debounced search for locations
  useEffect(() => {
    const handler = setTimeout(() => {
      if (locationQuery.length > 2) {
        fetchLocationSuggestions(locationQuery);
      } else {
        setLocationSuggestions([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [locationQuery]);

  const fetchLocationSuggestions = async (query: string) => {
    setIsLoadingSuggestions(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setLocationSuggestions(data);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch location suggestions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      quantity: "",
      unit: "kg",
      farmName: "",
      location: "",
      harvestDate: "",
      certifications: [],
      status: "registered",
      ownerId: user?.id || "",
      price:"",
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to register products",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare the data in the format expected by the API
      const productData = {
        name: data.name,
        category: data.category,
        description: data.description || "",
        quantity: String(data.quantity),
        unit: data.unit,
        farmName: data.farmName,
        location: data.location,
        harvestDate: new Date(data.harvestDate),
        certifications: data.certifications,
        status: "registered" as const,
        ownerId: user.id,
        price: String(data.price),
      };

      // Call the mutation - check if the hook expects a different parameter format
      if (typeof createProduct === "function") {
        createProduct(productData, {
          onSuccess: (product: any) => {
            toast({
              title: "Success!",
              description: `Product successfully registered with Batch ID: ${product.batchId}`,
            });
            form.reset();
            setLocationQuery("");
            onClose();
          },
          onError: (error: any) => {
            toast({
              title: "Registration Failed",
              description:
                error.message ||
                "Failed to register product. Please try again.",
              variant: "destructive",
            });
          },
        });
      } else {
        // Fallback: try calling the mutation directly
        try {
          const response = await fetch("/api/products", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productData),
          });

          if (!response.ok) {
            throw new Error("Failed to create product");
          }

          const product = await response.json();
          toast({
            title: "Success!",
            description: `Product successfully registered with Batch ID: ${product.batchId}`,
          });
          form.reset();
          setLocationQuery("");
          onClose();
        } catch (error) {
          toast({
            title: "Registration Failed",
            description: "Failed to register product. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    form.setValue("location", suggestion.display_name);
    setLocationQuery(suggestion.display_name);
    setShowSuggestions(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="mt-8" id="product-registration-section" ref={formRef}>
        <Card className="shadow-sm border border-border overflow-hidden">
          <CardHeader className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-primary" />
                Register New Product Batch
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                data-testid="button-close-registration"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Product Information */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">
                      Product Information
                    </h4>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Organic Cherry Tomatoes"
                              {...field}
                              data-testid="input-product-name"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            required
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category.charAt(0).toUpperCase() +
                                    category.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Brief description of the product..."
                              className="min-h-20"
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Amount"
                                {...field}
                                data-testid="input-quantity"
                                required
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="unit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              required
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-unit">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Price *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Enter price"
                              {...field}
                              required
                              data-testid="input-product-price"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Origin & Location */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">
                      Origin Information
                    </h4>

                    <FormField
                      control={form.control}
                      name="farmName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Farm/Producer Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Sunny Acres Organic Farm"
                              {...field}
                              data-testid="input-farm-name"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <div className="relative">
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search for a city or location..."
                            value={locationQuery}
                            onChange={(e) => {
                              setLocationQuery(e.target.value);
                              setShowSuggestions(true);
                              form.setValue("location", e.target.value);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            className="pl-10"
                            required
                          />
                          {isLoadingSuggestions && (
                            <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                        </div>

                        {showSuggestions && locationSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-popover text-popover-foreground shadow-md rounded-md border max-h-60 overflow-y-auto">
                            {locationSuggestions.map((suggestion, index) => (
                              <div
                                key={
                                  suggestion.place_id ||
                                  suggestion.osm_id ||
                                  index
                                }
                                className="px-4 py-2 cursor-pointer hover:bg-accent"
                                onClick={() => handleLocationSelect(suggestion)}
                              >
                                {suggestion.display_name}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <FormMessage>
                        {form.formState.errors.location?.message}
                      </FormMessage>
                    </FormItem>

                    <FormField
                      control={form.control}
                      name="harvestDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Harvest/Production Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              data-testid="input-harvest-date"
                              required
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Certifications */}
                <FormField
                  control={form.control}
                  name="certifications"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-base">
                        Certifications (Optional)
                      </FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {certificationOptions.map((certification) => (
                          <FormField
                            key={certification}
                            control={form.control}
                            name="certifications"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={certification}
                                  className="flex flex-row items-center space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(
                                        certification
                                      )}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([
                                              ...field.value,
                                              certification,
                                            ])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) =>
                                                  value !== certification
                                              )
                                            );
                                      }}
                                      data-testid={`checkbox-${certification
                                        .toLowerCase()
                                        .replace(" ", "-")}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal">
                                    {certification}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isPending}
                    data-testid="button-cancel-registration"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2"
                    data-testid="button-submit-registration"
                  >
                    <Plus className="w-4 h-4" />
                    Register & Generate QR Code
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Loading Overlay */}
      {isPending && <LoadingStates />}
    </>
  );
}
