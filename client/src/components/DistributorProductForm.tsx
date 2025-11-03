// src/components/DistributorProductForm.tsx
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

interface DistributorProductFormProps {
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

export const DistributorProductForm: React.FC<DistributorProductFormProps> = ({
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
  const [quantity, setQuantity] = useState(productData?.quantity || "");
  const [unit, setUnit] = useState(productData?.unit || "");
  const [distributorName, setDistributorName] = useState("");
  const [warehouseLocation, setWarehouseLocation] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (productData) {
      setName(productData.name || "");
      setCategory(productData.category || "");
      setDescription(productData.description || "");
      setQuantity(productData.quantity ? String(productData.quantity) : "");
      setUnit(productData.unit || "");
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
    if (!quantity.trim()) return "Quantity is required";
    if (!unit) return "Unit is required";
    if (!distributorName.trim()) return "Distributor name is required";
    if (!warehouseLocation.trim()) return "Warehouse location is required";
    if (!dispatchDate) return "Dispatch date is required";
    if (!price.trim()) return "Product purchase price is required";
    if (!paymentProofFile) return "Payment proof photo is required";
    if (!transferId) return "Missing transfer id";
    return null;
  };

  const handleSubmit = async () => {
    console.log("DistributorProductForm handleSubmit called");
    console.log("transferId:", transferId);
    console.log("productId:", productId);
    console.log("firebaseUser:", firebaseUser ? firebaseUser.uid : "null");

    const err = validate();
    if (err) {
      console.log("Validation error:", err);
      toast?.({
        title: "Validation error",
        description: err,
        variant: "destructive",
      });
      return;
    }

    if (!firebaseUser) {
      console.log("No firebaseUser");
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
      console.log("idToken obtained");

      const formData = new FormData();
      formData.append("name", name);
      formData.append("category", category);
      formData.append("description", description);
      formData.append("quantity", quantity);
      formData.append("unit", unit);
      formData.append("distributorName", distributorName);
      formData.append("warehouseLocation", warehouseLocation);
      formData.append("dispatchDate", dispatchDate);
      formData.append("certifications", JSON.stringify(certifications));
      formData.append("price", price);
      formData.append("paymentProof", paymentProofFile as Blob);
      formData.append("productId", productId || "");
      formData.append("transferId", transferId || "");

      console.log("FormData entries:");
      Array.from(formData.entries()).forEach(([key, value]) => {
        console.log(key, value);
      });

      const res = await fetch(`/api/ownership-transfers/${transferId}/accept`, {
        method: "PUT",
        headers: {
          "firebase-uid": firebaseUser.uid,
          Authorization: `Bearer ${idToken}`,
          // Do NOT set Content-Type, browser will set it for FormData
        },
        body: formData,
      });

      console.log("Fetch response status:", res.status, res.statusText);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.log("Response body:", body);
        const msg = body?.message || `${res.status} ${res.statusText}`;
        toast?.({ title: "Failed", description: msg, variant: "destructive" });
        throw new Error(msg);
      }

      const data = await res.json();
      console.log("Success data:", data);
      toast?.({
        title: "Success",
        description: "Product registered and ownership accepted.",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });

      onClose({ submitted: true, productId: productId ?? data.productId });
    } catch (e: any) {
      console.error("Error submitting distributor registration:", e);
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
          Distributor Product Registration
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
                  placeholder="e.g., Premium Packaged Grains"
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
                    <SelectItem value="supplements">Supplements</SelectItem>
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
                  placeholder="Brief description of the product..."
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

          {/* Distribution Information */}
          <div>
            <h3 className="font-semibold mb-2">Distribution Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Distributor Name *</Label>
                <Input
                  value={distributorName}
                  onChange={(e) => setDistributorName(e.target.value)}
                  placeholder="e.g., GreenField Distributors"
                />
              </div>

              <div>
                <Label>Warehouse Location *</Label>
                <Input
                  value={warehouseLocation}
                  onChange={(e) => setWarehouseLocation(e.target.value)}
                  placeholder="Search for a city or location..."
                />
              </div>

              <div>
                <Label>Dispatch Date *</Label>
                <Input
                  type="date"
                  value={dispatchDate}
                  onChange={(e) => setDispatchDate(e.target.value)}
                />
              </div>

              <div>
                <Label>Certifications (Optional)</Label>
                <div className="flex gap-4 mt-2">
                  <div>
                    <input
                      type="checkbox"
                      id="cert1"
                      checked={certifications.includes("Certified Distributor")}
                      onChange={() =>
                        toggleCertification("Certified Distributor")
                      }
                    />
                    <label htmlFor="cert1" className="ml-2">
                      Certified Distributor
                    </label>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="cert2"
                      checked={certifications.includes(
                        "Temperature Controlled"
                      )}
                      onChange={() =>
                        toggleCertification("Temperature Controlled")
                      }
                    />
                    <label htmlFor="cert2" className="ml-2">
                      Temperature Controlled
                    </label>
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      id="cert3"
                      checked={certifications.includes(
                        "Eco-Friendly Packaging"
                      )}
                      onChange={() =>
                        toggleCertification("Eco-Friendly Packaging")
                      }
                    />
                    <label htmlFor="cert3" className="ml-2">
                      Eco-Friendly Packaging
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

export default DistributorProductForm;