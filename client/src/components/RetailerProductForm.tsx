// src/components/RetailerProductForm.tsx
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface RetailerProductFormProps {
  isVisible: boolean;
  transferId?: string;
  productId?: string;
  productData?: {
    name: string;
    category: string;
    description?: string;
    quantity: string;
    unit: string;
  };
  onClose: (result?: { submitted?: boolean; productId?: string }) => void;
}

export const RetailerProductForm: React.FC<RetailerProductFormProps> = ({
  isVisible,
  onClose,
  transferId,
  productId,
  productData,
}) => {
  if (!isVisible) return null;

  const { firebaseUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize form fields with productData if available
  const [name, setName] = useState(productData?.name || "");
  const [category, setCategory] = useState(productData?.category || "");
  const [description, setDescription] = useState(
    productData?.description || ""
  );
  const [quantity, setQuantity] = useState(String(productData?.quantity || ""));
  const [unit, setUnit] = useState(productData?.unit || "");
  const [storeName, setStoreName] = useState("");
  const [storeLocation, setStoreLocation] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Update form fields when productData changes
  useEffect(() => {
    if (productData) {
      setName(productData.name);
      setCategory(productData.category);
      setDescription(productData.description || "");
      setQuantity(String(productData.quantity));
      setUnit(productData.unit);
    }
  }, [productData]);

  const toggleCertification = (cert: string) => {
    setCertifications((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose({ submitted: false });
    }
  };

  const validate = () => {
    if (!name.trim()) return "Product name is required";
    if (!category) return "Category is required";
    if (typeof quantity === "string" && !quantity.trim())
      return "Quantity is required";
    if (!unit) return "Unit is required";
    if (!storeName.trim()) return "Store name is required";
    if (!storeLocation.trim()) return "Store location is required";
    if (!arrivalDate) return "Arrival date is required";
    if (!price.trim()) return "Product purchase price is required";
    if (!paymentProofFile) return "Payment proof photo is required";
    if (!transferId) return "Missing transfer id";
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      toast?.({
        title: "Validation error",
        description: err,
        variant: "destructive",
      });
      return;
    }

    if (!firebaseUser) {
      toast?.({
        title: "Not authenticated",
        description: "Please sign in and try again.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const idToken = await firebaseUser.getIdToken();

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("quantity", quantity);
      formData.append("unit", unit);
      formData.append("storeName", storeName);
      formData.append("storeLocation", storeLocation);
      formData.append("arrivalDate", arrivalDate);
      formData.append("price", price);
      formData.append("paymentProof", paymentProofFile as Blob);
      formData.append("certifications", JSON.stringify(certifications));
      formData.append("productId", productId || "");
      formData.append("transferId", transferId || "");

      const res = await fetch(`/api/ownership-transfers/${transferId}/accept`, {
        method: "PUT",
        headers: {
          "firebase-uid": firebaseUser.uid,
          Authorization: `Bearer ${idToken}`,
          // Do NOT set Content-Type, browser will set it for FormData
        },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const msg = body?.message || `${res.status} ${res.statusText}`;
        toast?.({ title: "Failed", description: msg, variant: "destructive" });
        throw new Error(msg);
      }

      const data = await res.json();
      toast?.({
        title: "Success",
        description: "Product registered and ownership accepted.",
      });

      // Invalidate queries to refresh registered products
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      onClose({ submitted: true, productId: productId ?? data.productId });
    } catch (e: any) {
      console.error("Error submitting retailer registration:", e);
      if (!e?.message) {
        toast?.({
          title: "Error",
          description: "Failed to register product. Try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black bg-opacity-50 overflow-y-auto"
      onClick={handleOverlayClick}
    >
      <div 
        className="mt-12 bg-white p-6 rounded-lg shadow-md max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">
          Retailer Product Registration
        </h2>

        {productData && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Existing Product:</strong> {productData.name} (
              {productData.category})
            </p>
            <p className="text-sm text-blue-800">
              <strong>Quantity:</strong> {productData.quantity}{" "}
              {productData.unit}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Information */}
          <div>
            <h3 className="font-semibold mb-2">Product Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Product Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Packaged Grains - Retail Pack"
                  disabled={!!productData}
                />
                {productData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Inherited from previous owner
                  </p>
                )}
              </div>

              <div>
                <Label>Category *</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v)}
                  disabled={!!productData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="packaged-food">Packaged Food</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                  </SelectContent>
                </Select>
                {productData && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Inherited from previous owner
                  </p>
                )}
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full rounded-md border border-gray-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Amount"
                  />
                </div>
                <div>
                  <Label>Unit *</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ltr">ltr</SelectItem>
                      <SelectItem value="pack">pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Price *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Enter purchase price"
                    required
                  />
                </div>
                <div>
                  <Label>Payment Proof (Photo) *</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setPaymentProofFile(e.target.files?.[0] || null)
                    }
                    required
                  />
                  {paymentProofFile && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Selected: {paymentProofFile.name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Retailer Information */}
          <div>
            <h3 className="font-semibold mb-2">Retailer Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Store Name *</Label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g., Local Mart"
                />
              </div>

              <div>
                <Label>Store Location *</Label>
                <Input
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  placeholder="City, area..."
                />
              </div>

              <div>
                <Label>Arrival Date *</Label>
                <Input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                />
              </div>

              <div>
                <Label>Certifications (Optional)</Label>
                <div className="flex gap-4 mt-2">
                  <div>
                    <input
                      type="checkbox"
                      id="rcert1"
                      checked={certifications.includes("Retail Certified")}
                      onChange={() => toggleCertification("Retail Certified")}
                    />
                    <label htmlFor="rcert1" className="ml-2">
                      Retail Certified
                    </label>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="rcert2"
                      checked={certifications.includes("Cold Storage")}
                      onChange={() => toggleCertification("Cold Storage")}
                    />
                    <label htmlFor="rcert2" className="ml-2">
                      Cold Storage
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => onClose({ submitted: false })}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Registering..." : "Register & Accept Ownership"}
          </Button>
        </div>
      </div>
    </div>
  );
};