/**
 * Tests for the secure payment proof upload endpoint.
 *
 * Covers:
 *  - Missing file → 400
 *  - Disallowed MIME type (PDF) → 400
 *  - Disallowed file extension (.gif) → 400
 *  - File size exceeding 5 MB cap → 400
 *  - Spoofed MIME type (text/plain with JPEG extension) → 400
 *  - Valid JPEG → 200
 *  - Valid PNG → 200
 *  - Valid WebP → 200
 *  - Magic-bytes mismatch (HTML content, JPEG extension) → 400
 */

import { vi, describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp, mockDb } from "./setup";

// ---------------------------------------------------------------------------
// Image fixtures – smallest valid byte sequences that pass magic-byte checks
// ---------------------------------------------------------------------------

/** Minimal JPEG: SOI (FF D8 FF) + APP0 marker + EOI (FF D9) */
const MINIMAL_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10,
  0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
  0xff, 0xd9,
]);

/** Minimal PNG: signature (89 50 4E 47 0D 0A 1A 0A) + stub bytes */
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
]);

/** Minimal WebP: RIFF header + WEBP marker */
const MINIMAL_WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x24, 0x00, 0x00, 0x00, // file size (little-endian, irrelevant for test)
  0x57, 0x45, 0x42, 0x50, // "WEBP"
  0x56, 0x50, 0x38, 0x20, // VP8 chunk marker
]);

/** Plain HTML bytes that look like text – should fail magic-byte check */
const HTML_BYTES = Buffer.from("<html><body>hack</body></html>");

// ---------------------------------------------------------------------------
// Mock the uploadPaymentProof helper so tests never touch Firebase / disk.
// ---------------------------------------------------------------------------
vi.mock("firebase/app", () => ({ initializeApp: vi.fn(), getApps: vi.fn(() => []) }));
vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(),
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(async () => "https://storage.example.com/mock-proof.jpg"),
}));

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe("Payment Proof Upload Security (PUT /api/ownership-transfers/:id/accept)", () => {
  let app: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => {
    // Reset transfer to a clean pending state before every test
    mockDb.transfers.set("transfer-123", {
      id: "transfer-123",
      productId: "prod-123",
      fromUserId: "user-farmer",
      toUserId: "user-distributor",
      transferType: "transfer",
      notes: "Pending transfer",
      status: "pending",
    });
    // Ensure the product exists
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

  // -------------------------------------------------------------------------
  // Negative: missing file
  // -------------------------------------------------------------------------
  it("should return 400 when no payment proof file is attached", async () => {
    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .field("distributorName", "Test Distributor");

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/payment proof/i);
  });

  // -------------------------------------------------------------------------
  // Negative: disallowed MIME type (PDF)
  // -------------------------------------------------------------------------
  it("should return 400 when a PDF file is uploaded instead of an image", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4 fake content");

    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", pdfBytes, {
        filename: "invoice.pdf",
        contentType: "application/pdf",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid file type/i);
  });

  // -------------------------------------------------------------------------
  // Negative: disallowed extension (.gif)
  // -------------------------------------------------------------------------
  it("should return 400 when an unsupported extension (.gif) is used", async () => {
    // GIF89a magic bytes – extension still disallowed even if type might slip through
    const gifBytes = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", gifBytes, {
        filename: "image.gif",
        contentType: "image/gif",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid file type/i);
  });

  // -------------------------------------------------------------------------
  // Negative: oversized file (> 5 MB)
  // -------------------------------------------------------------------------
  it("should return 400 when the uploaded file exceeds 5 MB", async () => {
    // Build a buffer > 5 MB with valid JPEG header so it passes the filter
    // but is rejected by multer's size limit before the buffer is fully read.
    const FIVE_MB_PLUS_ONE = 5 * 1024 * 1024 + 1;
    const oversized = Buffer.alloc(FIVE_MB_PLUS_ONE);
    // Write JPEG magic bytes at the start
    oversized[0] = 0xff;
    oversized[1] = 0xd8;
    oversized[2] = 0xff;

    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", oversized, {
        filename: "large.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/5 mb/i);
  });

  // -------------------------------------------------------------------------
  // Negative: MIME/extension spoofing (text content with .jpg extension)
  // -------------------------------------------------------------------------
  it("should return 400 when file content does not match magic bytes (spoofed extension)", async () => {
    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", HTML_BYTES, {
        filename: "evil.jpg",
        contentType: "image/jpeg",
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/file signature/i);
  });

  // -------------------------------------------------------------------------
  // Positive: valid JPEG
  // -------------------------------------------------------------------------
  it("should return 200 when a valid JPEG payment proof is uploaded", async () => {
    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", MINIMAL_JPEG, {
        filename: "proof.jpg",
        contentType: "image/jpeg",
      })
      .field("distributorName", "Test Distributor");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Ownership transfer completed successfully");
  });

  // -------------------------------------------------------------------------
  // Positive: valid PNG
  // -------------------------------------------------------------------------
  it("should return 200 when a valid PNG payment proof is uploaded", async () => {
    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", MINIMAL_PNG, {
        filename: "proof.png",
        contentType: "image/png",
      })
      .field("distributorName", "Test Distributor");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Ownership transfer completed successfully");
  });

  // -------------------------------------------------------------------------
  // Positive: valid WebP
  // -------------------------------------------------------------------------
  it("should return 200 when a valid WebP payment proof is uploaded", async () => {
    const res = await request(app)
      .put("/api/ownership-transfers/transfer-123/accept")
      .set("Authorization", "Bearer valid-token-distributor")
      .set("firebase-uid", "uid-distributor")
      .attach("paymentProof", MINIMAL_WEBP, {
        filename: "proof.webp",
        contentType: "image/webp",
      })
      .field("distributorName", "Test Distributor");

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Ownership transfer completed successfully");
  });
});
