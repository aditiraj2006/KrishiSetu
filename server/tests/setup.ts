import { vi } from "vitest";
import express from "express";
import { registerRoutes } from "../routes";

// Define mock data storage so tests can manipulate it dynamically
export const mockDb = {
  users: new Map<string, any>(),
  products: new Map<string, any>(),
  transfers: new Map<string, any>(),
};

// Seed initial mock users for testing
mockDb.users.set("uid123", {
  id: "user-farmer",
  firebaseUid: "uid123",
  role: "farmer",
  name: "Farmer Bob",
  username: "farmerbob",
  email: "bob@farmer.com",
});

mockDb.users.set("uid-distributor", {
  id: "user-distributor",
  firebaseUid: "uid-distributor",
  role: "distributor",
  name: "Distributor Dave",
  username: "distdave",
  email: "dave@dist.com",
});

mockDb.users.set("uid-retailer", {
  id: "user-retailer",
  firebaseUid: "uid-retailer",
  role: "retailer",
  name: "Retailer Rita",
  username: "retailerrita",
  email: "rita@retailer.com",
});

mockDb.users.set("uid-consumer", {
  id: "user-consumer",
  firebaseUid: "uid-consumer",
  role: "consumer",
  name: "Consumer Charlie",
  username: "consumercharlie",
  email: "charlie@consumer.com",
});

// Seed a mock ownership transfer for tests
mockDb.transfers.set("transfer-123", {
  id: "transfer-123",
  productId: "prod-123",
  fromUserId: "user-farmer",
  toUserId: "user-distributor", // Default to distributor
  transferType: "transfer",
  notes: "Pending transfer to distributor",
  status: "pending",
});

// Seed a mock product
mockDb.products.set("prod-123", {
  id: "prod-123",
  name: "Organic Wheat",
  category: "Grains",
  quantity: "100",
  unit: "kg",
  ownerId: "user-farmer",
  farmName: "Happy Valley Farms",
  status: "registered",
  createdAt: new Date(),
});

// Mock server/storage.ts using ES6 class
vi.mock("../storage", () => {
  class MockMongoStorage {
    async getUser(id: string) {
      return Array.from(mockDb.users.values()).find((u) => u.id === id) || null;
    }
    async getUserByFirebaseUid(uid: string) {
      return mockDb.users.get(uid) || null;
    }
    async createProduct(data: any) {
      const product = { id: "prod-" + Date.now(), ...data };
      mockDb.products.set(product.id, product);
      return product;
    }
    async addProductOwner(data: any) {
      return { blockNumber: 1, ownershipHash: "mock-hash", ...data };
    }
    async verifyOwnershipChain() {
      return { valid: true };
    }
    async getOwnershipTransfer(id: string) {
      return mockDb.transfers.get(id) || null;
    }
    async updateOwnershipTransfer(id: string, updates: any) {
      const transfer = mockDb.transfers.get(id);
      if (!transfer) return null;
      const updated = { ...transfer, ...updates };
      mockDb.transfers.set(id, updated);
      return updated;
    }
    async updateProduct(id: string, updates: any) {
      const product = mockDb.products.get(id);
      if (!product) return null;
      const updated = { ...product, ...updates };
      mockDb.products.set(id, updated);
      return updated;
    }
    async createNotification(data: any) {
      return data;
    }
    async logProductEvent() {
      return {};
    }
    async getProduct(id: string) {
      return mockDb.products.get(id) || null;
    }
  }

  return {
    getDb: vi.fn(),
    MongoStorage: MockMongoStorage,
  };
});

// Mock server/firebaseJwt.ts
vi.mock("../firebaseJwt", () => {
  return {
    verifyFirebaseIdToken: vi.fn().mockImplementation(async (token: string) => {
      // Decode valid test tokens to their corresponding UIDs
      if (token === "valid-token-farmer") return { uid: "uid123" };
      if (token === "valid-token-distributor") return { uid: "uid-distributor" };
      if (token === "valid-token-retailer") return { uid: "uid-retailer" };
      if (token === "valid-token-consumer") return { uid: "uid-consumer" };
      throw new Error("Invalid token");
    }),
  };
});

// Create and export a test app helper
export async function createTestApp() {
  const app = express();
  app.use(express.json());
  await registerRoutes(app);
  return app;
}
