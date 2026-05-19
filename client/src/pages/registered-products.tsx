import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/hooks/useAuth";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface Owner {
  id: string;
  ownerId: string;
  username: string;
  role: string;
  canEditFields: string[];
}

export default function RegisteredProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: products, isLoading, isError, refetch } = useProducts(user?.id);
  const [ownersMap, setOwnersMap] = useState<Record<string, Owner[]>>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  // Fetch owners for each product
  useEffect(() => {
    if (!products) return;
    const fetchOwners = async () => {
      const promises = products.map(async (product) => {
        const res = await fetch(`/api/products/${product.id}/owners`);
        const owners = await res.json();
        return { productId: product.id, owners };
      });
      useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery]);
      const results = await Promise.all(promises);
      const map: Record<string, Owner[]> = {};
      results.forEach(({ productId, owners }) => {
        map[productId] = owners;
      });
      setOwnersMap(map);
    };
    fetchOwners();
  }, [products]);

  // Handle edit
  const handleEdit = (product: any) => {
    setEditingProductId(product.id);
    setEditData(product);
  };

  const handleEditChange = (field: string, value: string) => {
    setEditData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error("Failed to update product");
      toast.success("Product updated! All owners notified.");
      setEditingProductId(null);
      refetch?.();
    } catch {
      toast.error("Could not update product");
    }
  };

  if (authLoading) {
    return (
      <>
        <NavigationHeader />
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center text-muted-foreground">
            Loading products...
          </div>
        </div>
      </>
    );
  }

const filteredProducts =
  products?.filter((product) => {
    const query = debouncedSearch.toLowerCase();

    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.farmName.toLowerCase().includes(query);

    const matchesCategory =
      !selectedCategory ||
      product.category === selectedCategory;

    const matchesStatus =
      !selectedStatus ||
      product.status.toLowerCase() === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];
  return (
    <>
      <NavigationHeader />
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-4">Registered Products</h1>
        <p className="mb-2 px-8  text-muted-foreground">
          {user?.role === "farmer" &&
            "Here are all the products you have registered as a farmer."}
          {user?.role === "distributor" &&
            "Here are all the products you have registered as a distributor."}
          {user?.role === "retailer" &&
            "Here are all the products you have registered as a retailer."}
        </p>
        <div className="mb-4 px-8">
          <Input
            type="text"
            placeholder="Search products by name, category, or farm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="flex flex-col md:flex-row gap-4 mb-4 px-8">
  <select
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className="border rounded-lg px-4 py-2 bg-background"
  >
    <option value="">All Categories</option>

    {[...new Set(products?.map((p) => p.category))].map((category: string) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>

  <select
    value={selectedStatus}
    onChange={(e) => setSelectedStatus(e.target.value)}
    className="border rounded-lg px-4 py-2 bg-background"
  >
    <option value="">All Status</option>
    <option value="verified">Verified</option>
    <option value="pending">Pending</option>
  </select>
  <Button
  variant="outline"
  onClick={() => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedStatus("");
  }}
>
  Clear Filters
</Button>
</div>
        </div>
        {isLoading && (
          <div className="text-center text-muted-foreground">
            Loading products...
          </div>
        )}
        {isError && (
          <div className="text-center text-red-500">
            Failed to load products.
          </div>
        )}
       {!isLoading && !isError && filteredProducts.length === 0 && (
  <div className="bg-muted p-8 rounded-lg text-center">
    <h3 className="text-lg font-semibold mb-2">
      No matching results found
    </h3>

    <p className="text-muted-foreground mb-4">
      Try adjusting your search or filters.
    </p>

    <Button
      variant="outline"
      onClick={() => {
        setSearchQuery("");
        setSelectedCategory("");
        setSelectedStatus("");
      }}
    >
      Reset Filters
    </Button>
  </div>
)}
        {!isLoading && !isError && products?.length === 0 && !searchQuery && (
          <div className="bg-muted p-4 rounded-lg text-center text-muted-foreground">
            No products registered yet.
          </div>
        )}
        <div className="space-y-6">
          {filteredProducts.map((product) => {
            const owners = ownersMap[product.id] || [];
            const currentOwner = owners.find((o) => o.ownerId === user?.id);
            const canEditFields = currentOwner?.canEditFields || [];

            return (
              <Card key={product.id}>
                <CardContent className="flex flex-col md:flex-row gap-6 items-center py-6">
                  <div>
                    {/* Always show QRCodeGenerator if qrCode exists */}
                    {product.qrCode && (
                      <div className="mb-4">
                        <QRCodeGenerator product={product} />
                      </div>
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
                      {editingProductId === product.id &&
                      canEditFields.includes("quantity") ? (
                        <input
                          value={editData.quantity}
                          onChange={(e) =>
                            handleEditChange("quantity", e.target.value)
                          }
                          className="border px-2 py-1 rounded w-20"
                        />
                      ) : (
                        `${product.quantity} ${product.unit}`
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">Farm:</span>{" "}
                      {editingProductId === product.id &&
                      canEditFields.includes("farmName") ? (
                        <input
                          value={editData.farmName}
                          onChange={(e) =>
                            handleEditChange("farmName", e.target.value)
                          }
                          className="border px-2 py-1 rounded w-32"
                        />
                      ) : (
                        product.farmName
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">Location:</span>{" "}
                      {editingProductId === product.id &&
                      canEditFields.includes("location") ? (
                        <input
                          value={editData.location}
                          onChange={(e) =>
                            handleEditChange("location", e.target.value)
                          }
                          className="border px-2 py-1 rounded w-32"
                        />
                      ) : (
                        product.location
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mb-1">
                      <span className="font-medium">Harvest Date:</span>{" "}
                      {editingProductId === product.id &&
                      canEditFields.includes("harvestDate") ? (
                        <input
                          type="date"
                          value={editData.harvestDate?.slice(0, 10)}
                          onChange={(e) =>
                            handleEditChange("harvestDate", e.target.value)
                          }
                          className="border px-2 py-1 rounded w-32"
                        />
                      ) : product.harvestDate ? (
                        new Date(product.harvestDate).toLocaleDateString()
                      ) : (
                        "N/A"
                      )}
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

                    {/* Owners List */}
                    <div className="mt-4">
                      <span className="font-semibold text-sm">Owners:</span>
                      <ul className="ml-4 list-disc text-xs">
                        {owners.map((owner) => (
                          <li key={owner.id}>
                            {owner.username} ({owner.role})
                            {owner.ownerId === user?.id && " (You)"}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Link href={`/product/${product.id}?from=registered-products`}>
                        <Button size="sm" variant="outline" className="primary-btn">
                          View Details
                        </Button>
                      </Link>
                      {currentOwner && canEditFields.length > 0 && (
                        <>
                          {editingProductId === product.id ? (
                            <>
                              <button
                               className="primary-btn bg-green-600 text-white hover:bg-green-700"
                                onClick={() => handleEditSave(product.id)}
                              >
                                Save
                              </button>
                              <button
                                className="primary-btn bg-gray-400 text-white hover:bg-gray-500"
                                onClick={() => setEditingProductId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              className="primary-btn bg-yellow-500 text-white hover:bg-yellow-600"
                              onClick={() => handleEdit(product)}
                            >
                              Edit
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
