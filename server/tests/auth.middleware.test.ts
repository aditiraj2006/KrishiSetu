import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createTestApp } from "./setup";

describe("Firebase Auth Middleware Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  it("should reject requests with no authorization header with 401", async () => {
    const res = await request(app)
      .get("/api/user/profile");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should reject requests with invalid/forged bearer tokens with 401", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", "Bearer forged-token-xyz")
      .set("firebase-uid", "uid123");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should reject requests with a valid token but missing firebase-uid header with 401", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", "Bearer valid-token-farmer");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should reject requests with a valid token but mismatched firebase-uid header with 401", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", "Bearer valid-token-farmer")
      .set("firebase-uid", "different-uid-abc");

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  it("should accept requests with a valid token and matching firebase-uid header with 200", async () => {
    const res = await request(app)
      .get("/api/user/profile")
      .set("Authorization", "Bearer valid-token-farmer")
      .set("firebase-uid", "uid123");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("user-farmer");
    expect(res.body.role).toBe("farmer");
  });
});
