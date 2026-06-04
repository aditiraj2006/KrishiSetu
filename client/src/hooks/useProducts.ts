import type { InsertProduct, Product, User } from "@shared/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuth } from "firebase/auth";
import { getAuthHeaders } from "@/lib/authHeaders";
import { isFirebaseConfigured } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";

export type ProductRatingWithUser = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  review?: string | null;
  createdAt: string;
  userName: string;
  userRole: string | null;
  userProfileImage: string | null;
};

export type ProductRatingsResponse = {
  summary: {
    averageRating: number;
    ratingCount: number;
    ratingSum: number;
  };
  ratings: ProductRatingWithUser[];
};

export function useProducts(ownerId?: string) {
  return useQuery({
    queryKey: ownerId ? ["/api/products", { ownerId }] : ["/api/products"],
    queryFn: async () => {
      const url = ownerId ? `/api/products?ownerId=${ownerId}` : "/api/products";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json() as Promise<Product[]>;
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json() as Promise<Product>;
    },
    enabled: !!id,
  });
}

export function useProductByBatch(batchId: string) {
  return useQuery({
    queryKey: ["/api/products/batch", batchId],
    queryFn: async () => {
      const response = await fetch(`/api/products/batch/${batchId}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json() as Promise<Product>;
    },
    enabled: !!batchId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: InsertProduct) => {
      const firebaseUser = getAuth().currentUser;
      if (!firebaseUser) throw new Error("Not authenticated");
      
      // Get the token from local storage
      const token = localStorage.getItem("token");

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pass the token here
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }
      
      return response.json() as Promise<Product>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/products/combined"] });
    },
  });
}

export function useStats(userId?: string) {
  return useQuery({
    queryKey: userId ? ["/api/user", userId, "stats"] : ["/api/stats"],
    queryFn: async () => {
      const url = userId ? `/api/user/${userId}/stats` : "/api/stats";
      console.log("Fetching stats from:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const data = await response.json();
      console.log("Received stats data:", data);
      console.log("Data keys:", Object.keys(data));
      console.log("Data totalProducts:", data.totalProducts);
      return data as Promise<{
        totalProducts: number;
        verifiedBatches?: number;
        activeShipments?: number;
        averageQualityScore?: number;
        activeTransfers?: number;
        completedTransfers?: number;
        averageRating?: number;
      }>;
    },
    enabled: userId === undefined || userId.length > 0,
  });
}

export function useRecentScans(userId?: string) {
  return useQuery({
    queryKey: userId ? ["/api/scans/recent", { userId }] : ["/api/scans/recent"],
    queryFn: async () => {
      const url = userId ? `/api/scans/recent?userId=${userId}` : "/api/scans/recent";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch recent scans");
      return response.json();
    },
  });
}

export function useUserProducts(user?: User | null) {
  return useQuery({
    queryKey: user ? ["/api/user/products/combined", { userId: user.id }] : ["/api/products"],
    queryFn: async () => {
      if (!user) {
        // If no user, return all products
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json() as Promise<Product[]>;
      }

      // Get firebase uid
      if (!isFirebaseConfigured) {
        throw new Error("Firebase is not configured");
      }

      if (!isFirebaseConfigured) {
        throw new Error("Firebase is not configured");
      }

      const firebaseUser = getAuth().currentUser;
      if (!firebaseUser) throw new Error("Not authenticated");

      const headers = await getAuthHeaders();

      // Fetch owned and scanned products
      const [ownedRes, scannedRes] = await Promise.all([
        fetch(`/api/user/products/owned`, { headers }),
        fetch(`/api/user/products/scanned`, { headers }),
      ]);

      if (!ownedRes.ok || !scannedRes.ok) throw new Error("Failed to fetch user products");

      const owned = (await ownedRes.json()) as Product[];
      const scanned = (await scannedRes.json()) as Product[];

      // Merge and deduplicate by product id
      const productMap = new Map<string, Product>();
      [...owned, ...scanned].forEach((product) => {
        productMap.set(product.id, product);
      });

      return Array.from(productMap.values());
    },
    enabled: user !== undefined,
  });
}
export function useProductJourney(id: string) {
  return useQuery({
    queryKey: ["/api/products", id, "journey"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}/journey`);
      if (!response.ok) throw new Error("Product journey not found");
      return response.json() as Promise<any[]>;
    },
    enabled: !!id,
  });
}

export function useProductRatings(id: string) {
  return useQuery({
    queryKey: ["/api/products", id, "ratings"],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}/ratings`);
      if (!response.ok) throw new Error("Failed to fetch product ratings");
      return response.json() as Promise<ProductRatingsResponse>;
    },
    enabled: !!id,
  });
}

export function useSubmitProductRating(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ratingData: { rating: number; review?: string }) => {
      const response = await apiRequest("POST", `/api/products/${productId}/ratings`, ratingData);
      return response.json() as Promise<ProductRatingsResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", productId, "ratings"] });
    },
  });
}
