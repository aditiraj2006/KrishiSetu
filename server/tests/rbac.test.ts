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

  describe("Delete Product (DELETE /api/products/:id)", () => {
    beforeEach(() => {
      // Re-seed mock product before each test
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
    });

    it("should allow the product owner (farmer) to delete the product", async () => {
      const res = await request(app)
        .delete("/api/products/prod-123")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Product deleted successfully");
      expect(mockDb.products.has("prod-123")).toBe(false);
    });

    it("should allow an admin to delete any product", async () => {
      const res = await request(app)
        .delete("/api/products/prod-123")
        .set("Authorization", "Bearer valid-token-admin")
        .set("firebase-uid", "uid-admin");

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Product deleted successfully");
      expect(mockDb.products.has("prod-123")).toBe(false);
    });

    it("should forbid a non-owner, non-admin distributor from deleting the product", async () => {
      const res = await request(app)
        .delete("/api/products/prod-123")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor");

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Forbidden");
      expect(mockDb.products.has("prod-123")).toBe(true);
    });
  });

  describe("Farmer Produce Export (GET /api/farmer/export)", () => {
    beforeEach(() => {
      mockDb.products.set("prod-farmer-export-test", {
        id: "prod-farmer-export-test",
        name: "Organic Honey",
        category: "Food",
        quantity: "50",
        unit: "liters",
        ownerId: "user-farmer",
        farmName: "Sweet Bee Farms",
        status: "registered",
        createdAt: new Date(),
      });
    });

    it("should reject unauthenticated request with 401", async () => {
      const res = await request(app)
        .get("/api/farmer/export");

      expect(res.status).toBe(401);
    });

    it("should forbid a non-farmer distributor from exporting", async () => {
      const res = await request(app)
        .get("/api/farmer/export")
        .set("Authorization", "Bearer valid-token-distributor")
        .set("firebase-uid", "uid-distributor");

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Forbidden");
    });

    it("should allow a farmer to export their produce in CSV format", async () => {
      const res = await request(app)
        .get("/api/farmer/export")
        .set("Authorization", "Bearer valid-token-farmer")
        .set("firebase-uid", "uid123");

      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("text/csv");
      expect(res.text).toContain("Product Name,Category,Quantity,Registration Date,Current Status,Last Transaction Date,Buyer Name");
      expect(res.text).toContain("Organic Honey");
    });
  });
});

