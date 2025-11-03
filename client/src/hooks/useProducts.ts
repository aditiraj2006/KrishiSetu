import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { Product, InsertProduct } from '@shared/schema';
import { getAuth } from "firebase/auth";

export function useProducts(ownerId?: string) {
  return useQuery({
    queryKey: ownerId ? ['/api/products', { ownerId }] : ['/api/products'],
    queryFn: async () => {
      const url = ownerId ? `/api/products?ownerId=${ownerId}` : '/api/products';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      return response.json() as Promise<Product[]>;
    }
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['/api/products', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    enabled: !!id
  });
}

export function useProductByBatch(batchId: string) {
  return useQuery({
    queryKey: ['/api/products/batch', batchId],
    queryFn: async () => {
      const response = await fetch(`/api/products/batch/${batchId}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    enabled: !!batchId
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productData: InsertProduct) => {
      // Get the UID from your auth system
      const firebaseUid = getAuth().currentUser?.uid;
      if (!firebaseUid) throw new Error("Not authenticated");

      const response = await apiRequest(
        'POST',
        '/api/products',
        productData,
        { 'firebase-uid': firebaseUid }
      );
      return response.json() as Promise<Product>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/products/combined'] });
    }
  });
}

export function useStats(userId?: string) {
  return useQuery({
    queryKey: userId ? ['/api/user', userId, 'stats'] : ['/api/stats'],
    queryFn: async () => {
      const url = userId ? `/api/user/${userId}/stats` : '/api/stats';
      console.log("Fetching stats from:", url);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch stats');
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
    enabled: !!userId || !userId // Always enabled for global stats, but userId required for user stats
  });
}

export function useRecentScans(userId?: string) {
  return useQuery({
    queryKey: userId ? ['/api/scans/recent', { userId }] : ['/api/scans/recent'],
    queryFn: async () => {
      const url = userId ? `/api/scans/recent?userId=${userId}` : '/api/scans/recent';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recent scans');
      return response.json();
    }
  });
}

export function useUserProducts(user?: any) {
  return useQuery({
    queryKey: user ? ['/api/user/products/combined', { userId: user.id }] : ['/api/products'],
    queryFn: async () => {
      if (!user) {
        // If no user, return all products
        const response = await fetch('/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        return response.json() as Promise<Product[]>;
      }

      // Get firebase uid
      const firebaseUid = getAuth().currentUser?.uid;
      if (!firebaseUid) throw new Error('Not authenticated');

      // Fetch owned and scanned products
      const [ownedRes, scannedRes] = await Promise.all([
        fetch(`/api/user/products/owned`, {
          headers: { 'firebase-uid': firebaseUid }
        }),
        fetch(`/api/user/products/scanned`, {
          headers: { 'firebase-uid': firebaseUid }
        })
      ]);

      if (!ownedRes.ok || !scannedRes.ok) throw new Error('Failed to fetch user products');

      const owned = await ownedRes.json() as Product[];
      const scanned = await scannedRes.json() as Product[];

      // Merge and deduplicate by product id
      const productMap = new Map<string, Product>();
      [...owned, ...scanned].forEach(product => {
        productMap.set(product.id, product);
      });

      return Array.from(productMap.values());
    },
    enabled: !!user || !user // Always enabled
  });
}
