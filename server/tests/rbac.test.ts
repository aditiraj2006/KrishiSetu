import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, mockDb } from "./setup";

describe("Role-Based Access Control (RBAC) Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    // Reset specific transfer details before each test
    mockDb.transfers.set("transfer-123", {
      id: "transfer-123",
      productId: "prod-123",
      fromUserId: "user-farmer",
      toUserId: "user-distributor", // Matches distributor UID user
      transferType: "transfer",
      notes: "Pending transfer to distributor",
      status: "pending",
    });
  });

  describe("Product Registration (POST /api/products)", () => {
    const productPayload = {
      name: "Organic Rice",
      category: "Grains",
      quantity: "50",
      unit: "kg",
      farmName: "Sunrise Farms",
      location: "Punjab",
      harvestDate: new Date().toISOString(),
      certifications: ["Organic"],
      price: "120",
      ownerId: "user-farmer",
    };

    it("should allow a farmer to register a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123")
        .send(productPayload);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Organic Rice");
    });

    it("should forbid a distributor from registering a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor")
        .send(productPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only farmers can register products");
    });

    it("should forbid a retailer from registering a product", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", "Bearer valid-token-retailer")
        .set("firebase-uid", "uid-retailer")
        .send(productPayload);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only farmers can register products");
    });
  });

  describe("Accept Ownership Transfer (PUT /api/ownership-transfers/:id/accept)", () => {
    it("should allow a distributor to accept a transfer with distributor-specific fields", async () => {
      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor")
        .send({
          distributorName: "Fast Logistical Services",
          warehouseLocation: "Sector 5, Delhi",
          dispatchDate: new Date().toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ownership transfer completed successfully");
    });

    it("should forbid a non-distributor from filling distributor fields", async () => {
      // Set recipient of the transfer to the retailer for testing
      const transfer = mockDb.transfers.get("transfer-123");
      mockDb.transfers.set("transfer-123", {
        ...transfer,
        toUserId: "user-retailer",
      });

      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-retailer")
        .set("firebase-uid", "uid-retailer")
        .send({
          distributorName: "Fast Logistical Services",
          warehouseLocation: "Sector 5, Delhi",
          dispatchDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only distributors can register distributor details.");
    });

    it("should allow a retailer to accept a transfer with retailer-specific fields", async () => {
      // Set recipient of the transfer to the retailer
      const transfer = mockDb.transfers.get("transfer-123");
      mockDb.transfers.set("transfer-123", {
        ...transfer,
        toUserId: "user-retailer",
      });

      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-retailer")
        .set("firebase-uid", "uid-retailer")
        .send({
          storeName: "City Supermarket",
          storeLocation: "Connaught Place, Delhi",
          arrivalDate: new Date().toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ownership transfer completed successfully");
    });

    it("should forbid a non-retailer from filling retailer fields", async () => {
      const res = await request(app)
        .put("/api/ownership-transfers/transfer-123/accept")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor")
        .send({
          storeName: "City Supermarket",
          storeLocation: "Connaught Place, Delhi",
          arrivalDate: new Date().toISOString(),
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden: Only retailers can register retailer details.");
    });
  });
});
