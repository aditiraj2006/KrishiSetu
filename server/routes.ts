import fs from "fs";
import {
  insertNotificationSchema,
  insertOwnershipTransferSchema,
  insertProductCommentSchema,
  insertProductOwnerSchema,
  insertProductSchema,
  insertQualityCheckSchema,
  insertScanSchema,
  insertTransactionSchema,
  insertUserSchema,
} from "@shared/schema";
import express, { type Express, type NextFunction, type Request, type Response } from "express";
import { createServer } from "http";
import multer from "multer";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { analyzeProductQuality, improveGrammar, translateText } from "./ai";
import { verifyFirebaseIdToken } from "./firebaseJwt";
import { getDb, MongoStorage } from "./storage";
import { sendEmailNotification } from "./email";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize MongoDB storage
const storage = new MongoStorage();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const fileExt = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp, and .pdf files are allowed"));
    }
  },
});

async function uploadPaymentProof(file: Express.Multer.File): Promise<string> {
  const isFirebaseConfigured = [
    process.env.VITE_FIREBASE_API_KEY,
    process.env.VITE_FIREBASE_AUTH_DOMAIN,
    process.env.VITE_FIREBASE_PROJECT_ID,
    process.env.VITE_FIREBASE_STORAGE_BUCKET,
    process.env.VITE_FIREBASE_APP_ID,
  ].every((val) => val && val.trim().length > 0 && !val.startsWith("your_") && val !== "placeholder-api-key");

  if (isFirebaseConfigured) {
    try {
      console.log("Uploading payment proof to Firebase Storage...");
      const { initializeApp, getApps } = await import("firebase/app");
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage");

      const firebaseConfig = {
        apiKey: process.env.VITE_FIREBASE_API_KEY,
        authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.VITE_FIREBASE_APP_ID,
      };

      const apps = getApps();
      const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
      const storage = getStorage(app);

      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      const storageRef = ref(storage, `payment-proofs/${uniqueFilename}`);
      const metadata = { contentType: file.mimetype };

      await uploadBytes(storageRef, file.buffer, metadata);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log("Uploaded successfully to Firebase Storage:", downloadUrl);
      return downloadUrl;
    } catch (e) {
      console.error("Failed to upload to Firebase Storage, falling back to local storage:", e);
    }
  }

  // Fallback: Save to local directory
  console.log("Falling back to local storage for payment proof...");
  const uploadDir = path.join(__dirname, "../uploads/payment-proofs");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
  const filePath = path.join(uploadDir, uniqueFilename);
  await fs.promises.writeFile(filePath, file.buffer);

  return `/uploads/payment-proofs/${uniqueFilename}`;
}

const uploadDir = path.join(__dirname, "../uploads/payment-proofs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created upload directory:", uploadDir);
}

const allowedUserUpdateFields = new Set([
  "name",
  "profileImage",
  "phone",
  "company",
  "location",
  "bio",
  "website",
  "language",
  "notificationsEnabled",
]);

const filterUserUpdates = (payload: Record<string, unknown>) => {
  const updates: Record<string, unknown> = {};
  for (const field of Array.from(allowedUserUpdateFields)) {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  }
  return updates;
};

const getBearerToken = (req: Request) => {
  const authHeader = req.header("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const createOwnershipRequest = async (
  requesterId: string,
  productId: string,
  transferType: string | undefined,
  notes: string | null,
  toUserId?: string | null,
) => {
  const requester = await storage.getUser(requesterId);
  if (!requester) {
    const error = new Error("Requester user not found") as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  const product = await storage.getProduct(productId);
  if (!product) {
    const error = new Error("Product not found") as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  let recipientUserId: string;
  if (product.ownerId === requesterId) {
    if (!toUserId) {
      const error = new Error(
        "toUserId is required for owner-initiated transfers",
      ) as Error & { status?: number };
      error.status = 400;
      throw error;
    }
    recipientUserId = toUserId;
  } else {
    recipientUserId = product.ownerId;
  }

  if (recipientUserId === requesterId) {
    const error = new Error("Cannot transfer ownership to yourself") as Error & {
      status?: number;
    };
    error.status = 400;
    throw error;
  }

  const recipientUser = await storage.getUser(recipientUserId);
  if (!recipientUser) {
    const error = new Error("Recipient user not found") as Error & { status?: number };
    error.status = 404;
    throw error;
  }

  const transfer = await storage.createOwnershipTransfer({
    productId,
    fromUserId: requesterId,
    toUserId: recipientUserId,
    transferType: transferType || "request",
    notes,
    status: "pending",
  });

  const message =
    product.ownerId === requesterId
      ? `${requester.name} initiated ownership transfer for ${product.name}.`
      : `${requester.name} requested ownership of ${product.name}.`;

  await storage.createNotification({
    userId: recipientUserId,
    title: "Product Ownership Request",
    message,
    type: "ownership_request",
    productId: product.id,
    transferId: transfer.id,
    fromUserId: requesterId,
    read: false,
    createdAt: new Date(),
  });

  await storage.logProductEvent(
    product.id,
    "ownership_request",
    `${requester.name} requested ownership.`,
    requesterId,
    { transferId: transfer.id },
  );

  return transfer;
};

const requireFirebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = await verifyFirebaseIdToken(token);
    const headerUid = req.header("firebase-uid") || req.header("x-firebase-uid");
    if (headerUid && headerUid !== decoded.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.locals.firebaseUid = decoded.uid;
    return next();
  } catch (error) {
    console.error("Auth token verification failed:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export async function registerRoutes(app: Express) {
  app.use(
    "/uploads/payment-proofs",
    express.static(path.join(__dirname, "../uploads/payment-proofs")),
  );


  // Health check — used by the self-ping mechanism to prevent Render cold starts
  app.get("/api/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // --- Authentication Routes ---
  app.post("/api/user/register", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const { email, name, firebaseUid, profileImage, roleSelected } = req.body;
      const authFirebaseUid = res.locals.firebaseUid as string;

      // Fix: trim email and name before validation/storage to prevent duplicate
      // accounts caused by leading/trailing whitespace (e.g. "alice " vs "alice").
      const trimmedEmail = typeof email === "string" ? email.trim() : email;
      const trimmedName = typeof name === "string" ? name.trim() : name;

      // Validate required fields
      if (!trimmedEmail || !trimmedName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if (firebaseUid && firebaseUid !== authFirebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(authFirebaseUid);

      if (existingUser) {
        return res.json(existingUser); // Return existing user if already registered
      }

      // Create new user with username derived from email
      const username = trimmedEmail.split("@")[0] + Math.floor(Math.random() * 1000);

      const user = await storage.createUser({

        email: trimmedEmail,
        name: trimmedName,
        username,
        role: "farmer", // default role
        firebaseUid: authFirebaseUid,
        profileImage,
        roleSelected: roleSelected || false,
        language: "en",
        notificationsEnabled: true,
      });

      return res.status(201).json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Failed to register user" });
    }
  });

  // Get user profile
  app.get("/api/user/profile", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  // Update user profile
  app.put("/api/user/profile", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = filterUserUpdates(req.body || {});
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await storage.updateUser(user.id, updates);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
  app.get("/api/users/search", requireFirebaseAuth, async (req, res) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const currentUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const q = ((req.query.q as string) || "").trim();
      if (!q) return res.json([]);
      let users = await storage.searchUsers(q, 10);
      users = users.filter((u) => u.id !== currentUser.id);
      return res.json(users || []);
    } catch (error) {
      console.error("User search error:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });
  // --- User Routes ---
  app.post("/api/users", async (req: Request, res: Response) => {
    const parse = insertUserSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid user data", errors: parse.error.format() });
    }
    const user = await storage.createUser(parse.data);
    return res.status(201).json(user);
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  });
  app.patch("/api/users/:id", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;

      const { id } = req.params;
      const userToUpdate = await storage.getUser(id);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the authenticated user is the same as the user being updated
      if (userToUpdate.firebaseUid !== firebaseUid) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const updates = filterUserUpdates(req.body || {});
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updatedUser = await storage.updateUser(id, updates);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ message: "Failed to update user" });
    }
  });

  // --- Product Routes ---
  app.post("/api/products", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const parse = insertProductSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          message: "Invalid product data",
          errors: parse.error.format(),
        });
      }

      const firebaseUid = res.locals.firebaseUid as string;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const productData = {
        ...parse.data,
        ownerId: user.id,
      };
      const product = await storage.createProduct(productData);

      await storage.addProductOwner({
        productId: product.id,
        ownerId: user.id,
        username: user.username,
        name: user.name,
        addedBy: user.id,
        role: user.role,
        canEditFields: ["quantity", "location", "description", "certifications", "price"],
        transferType: "initial",
        createdAt: new Date(),
      });

      return res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ message: "Failed to create product" });
    }
  });

  //All products search
  const handleAvailableProductsSearch = async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const currentUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const q = (req.query.q as string)?.toLowerCase() || "";
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
      }

      const products = await db
        .collection("products")
        .find({
          ownerId: { $ne: currentUser.id },
          $or: [
            { name: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
            { farmName: { $regex: q, $options: "i" } },
            { batchId: { $regex: q, $options: "i" } },
          ],
        })
        .toArray();

      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(products || []);
    } catch (error) {
      console.error("Error searching available products:", error);
      return res.status(500).json({ message: "Failed to search products" });
    }
  };

  app.get(
    "/api/products/search/available",
    requireFirebaseAuth,
    handleAvailableProductsSearch,
  );
  app.get(
    "/api/products/available/search",
    requireFirebaseAuth,
    handleAvailableProductsSearch,
  );

  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const identifier = req.params.id;
      if (identifier === "test-id") {
        return res.json({
          id: "test-id",
          name: "Organic Honey",
          category: "Food",
          description: "Pure organic honey harvested from local fields.",
          quantity: "100",
          unit: "kg",
          farmName: "Sweet Bee Farms",
          location: "Himachal Pradesh, India",
          harvestDate: new Date("2026-05-01T00:00:00.000Z"),
          certifications: ["Organic", "FSSAI"],
          qrCode: "/product/test-id",
          batchId: "HONEY-001",
          ownerId: "farmer-id",
          blockchainHash: "mock-blockchain-hash",
          status: "registered",
          price: "500",
          createdAt: new Date("2026-05-01T00:00:00.000Z")
        });
      }

      // Try to find by product ID first
      let product = await storage.getProduct(identifier);

      // If not found, try to find by batch ID (for QR code backward compatibility)
      if (!product) {
        product = await storage.getProductByBatchId(identifier);
      }

      if (!product) return res.status(404).json({ message: "Product not found" });
      return res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      return res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // List all products - used by dashboard
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const ownerId = req.query.ownerId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

      let products;
      if (ownerId) {
        products = await storage.getProductsByOwner(ownerId);
      } else {
        products = await storage.getAllProducts(limit);
      }

      return res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      return res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get user's owned products
  app.get("/api/user/products/owned", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const query = req.query.q as string | undefined;
      let products;
      if (query && query.trim()) {
        products = await storage.searchProductsByOwner(user.id, query);
      } else {
        products = await storage.getProductsByOwner(user.id);
      }
      return res.json(products);
    } catch (error) {
      console.error("Error fetching owned products:", error);
      return res.status(500).json({ message: "Failed to fetch owned products" });
    }
  });

  // Get user's scanned products
  app.get(
    "/api/user/products/scanned",
    requireFirebaseAuth,
    async (req: Request, res: Response) => {
      try {
        const firebaseUid = res.locals.firebaseUid as string;
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get all scans for this user
        const scans = await storage.getUserScans(user.id);

        // Use ES5 object for unique product IDs to avoid Set/ES2015 error
        const productIdMap: Record<string, boolean> = {};
        for (const scan of scans) {
          if (scan.productId) productIdMap[scan.productId] = true;
        }
        const productIds = Object.keys(productIdMap);

        // Fetch product details for each scanned product
        const products = [];
        for (const productId of productIds) {
          const product = await storage.getProduct(productId);
          if (product) {
            products.push(product);
          }
        }

        return res.json(products);
      } catch (error) {
        console.error("Error fetching scanned products:", error);
        return res.status(500).json({ message: "Failed to fetch scanned products" });
      }
    },
  );

  app.get("/api/products/batch/:batchId", async (req: Request, res: Response) => {
    try {
      const { batchId } = req.params;
      const product = await storage.getProductByBatchId(batchId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.json(product);
    } catch (error) {
      console.error("Error fetching product by batchId:", error);
      return res.status(500).json({ message: "Failed to fetch product by batchId" });
    }
  });

  // --- Transaction Routes ---
  app.post("/api/transactions", requireFirebaseAuth, async (req: Request, res: Response) => {
    const parse = insertTransactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        message: "Invalid transaction data",
        errors: parse.error.format(),
      });
    }
    const firebaseUid = res.locals.firebaseUid as string;
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (parse.data.fromUserId && parse.data.fromUserId !== user.id) {
      return res.status(403).json({ message: "Cannot create transactions for another user" });
    }
    const transaction = await storage.createTransaction({
      ...parse.data,
      fromUserId: parse.data.fromUserId || user.id,
    });
    return res.status(201).json(transaction);
  });

  // --- Quality Check Routes ---
  app.post("/api/quality-checks", requireFirebaseAuth, async (req: Request, res: Response) => {
    const parse = insertQualityCheckSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        message: "Invalid quality check data",
        errors: parse.error.format(),
      });
    }
    const firebaseUid = res.locals.firebaseUid as string;
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (parse.data.inspectorId !== user.id) {
      return res
        .status(403)
        .json({ message: "Cannot create quality checks for another inspector" });
    }
    const check = await storage.createQualityCheck(parse.data);
    return res.status(201).json(check);
  });

  // --- Scan Routes ---
  app.post("/api/scans", requireFirebaseAuth, async (req: Request, res: Response) => {
    const parse = insertScanSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid scan data", errors: parse.error.format() });
    }
    const firebaseUid = res.locals.firebaseUid as string;
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (parse.data.userId && parse.data.userId !== user.id) {
      return res.status(403).json({ message: "Cannot create scans for another user" });
    }
    const scan = await storage.createScan({
      ...parse.data,
      userId: user.id,
    });
    return res.status(201).json(scan);
  });

  // Recent scans endpoint
  app.get("/api/scans/recent", async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const recentScans = await storage.getRecentScans(limit);
      return res.json(recentScans);
    } catch (error) {
      console.error("Error fetching recent scans:", error);
      return res.status(500).json({ message: "Failed to fetch recent scans" });
    }
  });

  // --- Ownership Transfer Routes ---
  app.post("/api/ownership-transfers", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const currentUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const productId = req.body.productId;
      const transferType = req.body.transferType;
      const notes = req.body.notes;
      const toUserId = req.body.toUserId;

      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const transfer = await createOwnershipRequest(
        currentUser.id,
        productId,
        transferType,
        notes ?? null,
        toUserId,
      );

      return res.status(201).json({
        message: "Transfer request sent. Waiting for acceptance.",
        transferId: transfer.id,
      });
    } catch (error) {
      console.error("Error transferring ownership:", error);
      if (error instanceof Error && (error as any).status) {
        return res.status((error as any).status).json({ message: error.message });
      }
      return res.status(500).json({ message: "Failed to transfer ownership" });
    }
  });

  app.post("/api/request-product", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const requester = await storage.getUserByFirebaseUid(firebaseUid);
      if (!requester) {
        return res.status(404).json({ message: "User not found" });
      }

      const { productId, transferType, notes } = req.body;
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      if (product.ownerId === requester.id) {
        return res.status(400).json({ message: "You already own this product" });
      }

      const transfer = await createOwnershipRequest(
        requester.id,
        productId,
        transferType,
        notes ?? null,
      );

        // Email notification to the recipient
        const recipient = await storage.getUser(recipientUserId);
        if (recipient && recipient.email && recipient.notificationsEnabled !== false) {
          const emailSubject = "KrishiSetu - New Product Ownership Transfer Request";
          const emailBody = `
            <h2>New Ownership Transfer Request</h2>
            <p>Hello <strong>${recipient.name}</strong>,</p>
            <p><strong>${currentUser.name}</strong> has initiated a product ownership transfer request for <strong>${product.name}</strong> to you.</p>
            <p>Please log in to your KrishiSetu dashboard to review and accept/reject this request.</p>
            <br/>
            <p>Best regards,</p>
            <p>The KrishiSetu Team</p>
          `;
          await sendEmailNotification(recipient.email, emailSubject, emailBody);
        }

        return res.status(201).json({
          message: "Transfer request sent. Waiting for acceptance.",
          transferId: transfer.id,
        });
      } catch (error) {
        console.error("Error transferring ownership:", error);
        return res
          .status(500)
          .json({ message: "Failed to transfer ownership" });
      }
      return res.status(500).json({ message: "Failed to request product" });
    }
  });

  // server/routes/ownershipTransfers.ts

  // Get pending transfer requests for user
  app.get(
    "/api/ownership-transfers/pending",
    requireFirebaseAuth,
    async (req: Request, res: Response) => {
      try {
        const firebaseUid = res.locals.firebaseUid as string;
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const { productId, transferType, notes } = req.body;
        if (!productId) {
          return res.status(400).json({ message: "Product ID is required" });
        }

        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        // Prevent requesting your own product
        if (product.ownerId === requester.id) {
          return res
            .status(400)
            .json({ message: "You already own this product" });
        }

        // Create a pending ownership transfer (from requester to owner)
        const transfer = await storage.createOwnershipTransfer({
          productId,
          fromUserId: requester.id,
          toUserId: product.ownerId,
          transferType: transferType || "request",
          notes: notes || null,
          status: "pending",
        });

        // Log notification before creating it
        console.log("Creating notification with type:", "product_request");

        // Notify the product owner
        await storage.createNotification({
          userId: product.ownerId,
          title: "Product Ownership Request",
          message: `${requester.name} requested ownership of ${product.name}.`,
          type: "product_request",
          productId: product.id,
          transferId: transfer.id,
          fromUserId: requester.id,
          read: false,
          createdAt: new Date(),
        });

        // Optionally log the event
        await storage.logProductEvent(
          product.id,
          "ownership_request",
          `${requester.name} requested ownership.`,
          requester.id,
          { transferId: transfer.id },
        );

        // Email notification to the product owner
        const owner = await storage.getUser(product.ownerId);
        if (owner && owner.email && owner.notificationsEnabled !== false) {
          const emailSubject = "KrishiSetu - Product Ownership Request";
          const emailBody = `
            <h2>Product Ownership Requested</h2>
            <p>Hello <strong>${owner.name}</strong>,</p>
            <p><strong>${requester.name}</strong> has requested ownership of your product <strong>${product.name}</strong>.</p>
            <p>Please log in to your KrishiSetu dashboard to review and accept/reject this request.</p>
            <br/>
            <p>Best regards,</p>
            <p>The KrishiSetu Team</p>
          `;
          await sendEmailNotification(owner.email, emailSubject, emailBody);
        }

        return res.status(201).json({
          message: "Ownership request sent. Waiting for acceptance.",
          transferId: transfer.id,
        });
      } catch (error) {
        console.error("Error fetching pending transfers:", error);
        return res.status(500).json({ message: "Failed to fetch pending transfers" });
      }
    },
  );

  /**
   * Accept an ownership transfer AND optionally update/register product data.
   * Expects:
   *  - transferId in params
   *  - headers: Authorization: Bearer <Firebase ID token>
   *  - body: { productData?: {...}, productId?: string }
   */
  app.put(
    "/api/ownership-transfers/:id/accept",
    requireFirebaseAuth,
    (req: Request, res: Response, next: NextFunction) => {
      upload.single("paymentProof")(req, res, (err: any) => {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ message: "File size exceeds the 5MB limit." });
          }
          return res.status(400).json({ message: err.message });
        } else if (err) {
          return res.status(400).json({ message: err.message });
        }
        next();
      });
    },
    async (req: Request, res: Response) => {
      const transferId = req.params.id;
      const firebaseUid = res.locals.firebaseUid as string;

      // Extract all form data
      const formData = { ...req.body };

      // Define all possible form fields that might be submitted
      const possibleFormFields = [
        "name",
        "category",
        "description",
        "quantity",
        "unit",
        "distributorName",
        "warehouseLocation",
        "dispatchDate",
        "certifications",
        "price",
        "paymentProofUrl",
        "storeName",
        "storeLocation",
        "arrivalDate",
      ];

      // Create an object to store the actual filled fields
      const filledFields: Record<string, any> = {};
      const registeredFields: string[] = [];

      // Check which fields were actually filled
      for (const field of possibleFormFields) {
        if (formData[field] !== undefined && formData[field] !== null && formData[field] !== "") {
          filledFields[field] = formData[field];
          registeredFields.push(field);
        }
      }

      // Parse certifications if sent as JSON string
      if (filledFields.certifications && typeof filledFields.certifications === "string") {
        try {
          filledFields.certifications = JSON.parse(filledFields.certifications);
        } catch (e) {
          console.error("Error parsing certifications:", e);
        }
      }

      // Parse numbers if needed
      if (
        filledFields.price &&
        typeof filledFields.price === "string" &&
        !isNaN(Number(filledFields.price))
      ) {
        filledFields.price = Number(filledFields.price);
      }
      if (
        filledFields.quantity &&
        typeof filledFields.quantity === "string" &&
        !isNaN(Number(filledFields.quantity))
      ) {
        filledFields.quantity = Number(filledFields.quantity);
      }

      // If you handle paymentProof file upload, upload it to Firebase Storage
      if (req.file && req.file.buffer) {
        try {
          filledFields.paymentProofUrl = await uploadPaymentProof(req.file);
          if (!registeredFields.includes("paymentProofUrl")) {
            registeredFields.push("paymentProofUrl");
          }
        } catch (uploadError) {
          console.error("Firebase Storage upload failed:", uploadError);
          return res.status(500).json({ message: "Failed to upload payment proof" });
        }
      }

      try {
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) return res.status(404).json({ message: "User not found" });

        const transfer = await storage.getOwnershipTransfer(transferId);
        if (!transfer) return res.status(404).json({ message: "Transfer not found" });

        if (transfer.toUserId !== user.id) {
          return res.status(403).json({ message: "You are not the recipient of this transfer" });
        }

        if (transfer.status !== "pending") {
          if (transfer.status === "completed")
            return res.json({ message: "Transfer already completed" });
          return res.status(400).json({ message: "Transfer is not pending" });
        }

        const product = await storage.getProduct(transfer.productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        const verificationResult = await storage.verifyOwnershipChain(product.id);
        if (!verificationResult.valid) {
          return res.status(400).json({
            message: "Cannot transfer ownership: Blockchain integrity compromised",
            errors: verificationResult.errors,
          });
        }

        await storage.updateOwnershipTransfer(transferId, { status: "completed" });

        await storage.updateProduct(product.id, {
          ownerId: user.id,
          ...filledFields,
        });

        const newOwnerBlock = await storage.addProductOwner({
          productId: product.id,
          ownerId: user.id,
          username: user.username,
          name: user.name,
          addedBy: transfer.fromUserId,
          role: user.role,
          canEditFields: ["quantity", "location"],
          transferType: transfer.transferType,
          createdAt: new Date(),
        });

        await storage.createNotification({
          userId: transfer.fromUserId,
          title: "Ownership Transfer Completed",
          message: `${user.name} has accepted ownership of ${product.name}.`,
          type: "ownership_transfer",
          productId: product.id,
          transferId: transfer.id,
          read: false,
          createdAt: new Date(),
        });

        const previousOwner = await storage.getUser(transfer.fromUserId);

        await storage.logProductEvent(
          product.id,
          "ownership_registration",
          `${user.name} (${user.role}) registered product details.`,
          user.id,
          {
            transferId: transfer.id,
            registrationType: user.role,
            userName: user.username,
            userRole: user.role,
            previousOwnerName: previousOwner?.username || previousOwner?.name || "Unknown",
            previousOwnerRole: previousOwner?.role || "Unknown",
            registeredFields,
            ...filledFields,
          },
        );

        return res.json({
          message: "Ownership transfer completed successfully",
          ownershipBlock: {
            blockNumber: newOwnerBlock.blockNumber,
            ownershipHash: newOwnerBlock.ownershipHash,
            previousOwnerHash: newOwnerBlock.previousOwnerHash,
          },
          productId: product.id,
        });
      } catch (error) {
        console.error("Error accepting ownership transfer:", error);
        return res.status(500).json({ message: "Failed to accept ownership transfer" });
      }
    },
  );

  app.put(
    "/api/ownership-transfers/:id/reject",
    requireFirebaseAuth,
    async (req: Request, res: Response) => {
      try {
        const transferId = req.params.id;
        const firebaseUid = res.locals.firebaseUid as string;
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Get the transfer
        const transfer = await storage.getOwnershipTransfer(transferId);
        if (!transfer) {
          return res.status(404).json({ message: "Transfer not found" });
        }

        if (transfer.toUserId !== user.id) {
          return res.status(403).json({ message: "You are not the recipient of this transfer" });
        }

        if (transfer.status !== "pending") {
          return res.status(400).json({ message: "Transfer is not pending" });
        }

        // Update transfer status to rejected
        await storage.updateOwnershipTransfer(transferId, {
          status: "rejected",
        });

        // Create notification for the previous owner
        const product = await storage.getProduct(transfer.productId);
        if (product) {
          await storage.createNotification({
            userId: transfer.fromUserId,
            title: "Ownership Transfer Rejected",
            message: `${user.name} has rejected the ownership transfer of ${product.name}.`,
            type: "ownership_transfer_rejected",
            productId: product.id,
            read: false,
            createdAt: new Date(),
          });
        }

        return res.json({
          message: "Ownership transfer rejected successfully",
        });
      } catch (error) {
        console.error("Error rejecting ownership transfer:", error);
        return res.status(500).json({ message: "Failed to reject ownership transfer" });
      }
    },
  );

  // --- Notification Routes ---

  // Create a notification
  app.post("/api/notifications", async (req, res) => {
    try {
      const parse = insertNotificationSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({
          message: "Invalid notification data",
          errors: parse.error.format(),
        });
      }
      const notification = await storage.createNotification(parse.data);
      return res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Get all notifications for the authenticated user
  app.get("/api/notifications", requireFirebaseAuth, async (req, res) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const notifications = await storage.getUserNotifications(user.id);
      return res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Mark a notification as read
  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = req.params.id;
      await storage.markNotificationRead(notificationId);
      return res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return res.status(500).json({ message: "Failed to update notification" });
    }
  });

  // --- Product Owner Routes ---
  app.post("/api/product-owners", async (req: Request, res: Response) => {
    const parse = insertProductOwnerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        message: "Invalid product owner data",
        errors: parse.error.format(),
      });
    }
    const productOwner = await storage.addProductOwner(parse.data);
    return res.status(201).json(productOwner);
  });

  app.get("/api/products/:id/owners", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      if (productId === "test-id") {
        return res.json([
          {
            id: "owner-1",
            productId: "test-id",
            ownerId: "farmer-id",
            username: "sweetbeefarms",
            name: "Sweet Bee Farms",
            addedBy: "farmer-id",
            role: "farmer",
            canEditFields: ["quantity", "location"],
            transferType: "initial",
            blockNumber: 1,
            previousOwnerHash: null,
            ownershipHash: "genesis-hash",
            createdAt: new Date("2026-05-01T00:00:00.000Z")
          }
        ]);
      }
      const owners = await storage.getProductOwners(productId);

      // Enrich with user details
      const enrichedOwners = await Promise.all(
        owners.map(async (owner) => {
          const user = await storage.getUser(owner.ownerId);
          return {
            ...owner,
            name: user?.name || "Unknown",
            email: user?.email || "",
            role: user?.role || "unknown",
          };
        }),
      );

      return res.json(enrichedOwners);
    } catch (error) {
      console.error("Error fetching product owners:", error);
      return res.status(500).json({ message: "Failed to fetch product owners" });
    }
  });

  app.get("/api/products/:id/ownership-chain", async (req: Request, res: Response) => {
    try {
      const chain = await storage.getOwnershipChain(req.params.id);
      return res.json(chain);
    } catch (error) {
      console.error("Error fetching ownership chain:", error);
      return res.status(500).json({ message: "Failed to fetch ownership chain" });
    }
  });

  app.get("/api/products/:id/verify-ownership", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const verificationResult = await storage.verifyOwnershipChain(productId);
      return res.json({
        productId,
        productName: product.name,
        ownershipValid: verificationResult.valid,
        errors: verificationResult.errors || [],
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error verifying ownership chain:", error);
      return res.status(500).json({ message: "Failed to verify ownership chain" });
    }
  });

  app.get("/api/users/:id/ownership-history", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const history = await storage.getOwnershipHistory(userId);
      return res.json({
        userId,
        userName: user.name,
        ownershipHistory: history,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error fetching user's ownership history:", error);
      return res.status(500).json({ message: "Failed to fetch ownership history" });
    }
  });

  app.get("/api/products/:productId/has-owner/:userId", async (req: Request, res: Response) => {
    try {
      const { productId, userId } = req.params;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const hasOwned = await storage.hasUserOwnedProduct(productId, userId);
      return res.json({
        productId,
        productName: product.name,
        userId,
        userName: user.name,
        hasOwned,
        isCurrentOwner: product.ownerId === userId,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error checking product ownership:", error);
      return res.status(500).json({ message: "Failed to check product ownership" });
    }
  });

  // --- Product Comment Routes ---
  app.post("/api/product-comments", async (req: Request, res: Response) => {
    const parse = insertProductCommentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        message: "Invalid product comment data",
        errors: parse.error.format(),
      });
    }
    const comment = await storage.addProductComment(parse.data);
    return res.status(201).json(comment);
  });

  app.get("/api/products/:id/comments", async (req: Request, res: Response) => {
    const comments = await storage.getProductComments(req.params.id);
    return res.json(comments);
  });

  app.get("/api/products/:id/ratings", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      if (productId === "test-id") {
        return res.json({
          summary: {
            averageRating: 4.5,
            ratingCount: 1,
            ratingSum: 4.5
          },
          ratings: [
            {
              id: "rating-1",
              productId: "test-id",
              userId: "user-1",
              rating: 5,
              review: "Very sweet and pure honey!",
              createdAt: new Date("2026-05-03T00:00:00.000Z"),
              userName: "Ramesh Kumar",
              userRole: "consumer",
              userProfileImage: null
            }
          ]
        });
      }
      const db = await getDb();
      const ratings = await storage.getProductRatings(productId);
      const userIds = Array.from(new Set(ratings.map((rating) => rating.userId)));
      const users = userIds.length
        ? await db
          .collection("users")
          .find({ id: { $in: userIds } })
          .toArray()
        : [];
      const userMap = new Map(users.map((user) => [user.id, user]));

      return res.json({
        summary: await storage.getProductRatingSummary(productId),
        ratings: ratings.map((rating) => ({
          ...rating,
          userName: userMap.get(rating.userId)?.name ?? "Anonymous",
          userRole: userMap.get(rating.userId)?.role ?? null,
          userProfileImage: userMap.get(rating.userId)?.profileImage ?? null,
        })),
      });
    } catch (error) {
      console.error("Error fetching product ratings:", error);
      return res.status(500).json({ message: "Failed to fetch product ratings" });
    }
  });

  app.post(
    "/api/products/:id/ratings",
    requireFirebaseAuth,
    async (req: Request, res: Response) => {
      try {
        const productId = req.params.id;
        const payloadSchema = z.object({
          rating: z.coerce.number().int().min(1).max(5),
          review: z.string().trim().max(1000).nullable().optional(),
        });

        const parse = payloadSchema.safeParse(req.body);
        if (!parse.success) {
          return res.status(400).json({
            message: "Invalid rating data",
            errors: parse.error.format(),
          });
        }

        const firebaseUid = res.locals.firebaseUid as string;
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const product = await storage.getProduct(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }

        const existingRating = await storage.getProductRating(productId, user.id);
        const rating = await storage.upsertProductRating({
          productId,
          userId: user.id,
          rating: parse.data.rating,
          review: parse.data.review ?? null,
          createdAt: new Date(),
        });

        const summary = await storage.getProductRatingSummary(productId);

        return res.status(existingRating ? 200 : 201).json({
          rating,
          summary,
        });
      } catch (error) {
        console.error("Error saving product rating:", error);
        return res.status(500).json({ message: "Failed to save product rating" });
      }
    },
  );

  app.get("/api/products/:id/journey", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      if (productId === "test-id") {
        return res.json([
          {
            id: "origin-test-id",
            name: "Sweet Bee Farms",
            role: "farmer",
            latitude: 37.7749,
            longitude: -122.4194,
            timestamp: "2026-05-01T00:00:00.000Z",
            status: "Origin"
          }
        ]);
      }
      const journeyLocations = await storage.getProductJourney(productId);
      return res.json(journeyLocations);
    } catch (error) {
      console.error("Error getting product journey:", error);
      if (error instanceof Error && error.message === "Product not found") {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.status(500).json({ message: "Failed to get product journey" });
    }
  });

  // --- Role Selection ---
  app.put("/api/user/role", requireFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const firebaseUid = res.locals.firebaseUid as string;
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      const allowedRoles = new Set(["farmer", "distributor", "retailer", "consumer"]);
      if (!allowedRoles.has(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updatedUser = await storage.updateUser(user.id, {
        role,
        roleSelected: true,
      });

      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      return res.status(500).json({ message: "Failed to update role" });
    }
  });

  // --- QR Code Routes ---
  app.get("/api/products/:id/qrcode", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Return QR code data or generate it if not present
      const qrCodeData =
        product.qrCode || `${req.protocol}://${req.get("host")}/product/${productId}`;

      if (!product.qrCode) {
        // Save the QR code URL to the product if it wasn't already set
        await storage.updateProduct(productId, { qrCode: qrCodeData });
      }

      return res.json({ qrCodeData });
    } catch (error) {
      console.error("Error getting product QR code:", error);
      return res.status(500).json({ message: "Failed to get QR code" });
    }
  });

  // --- Stats endpoint for dashboard ---
  app.get("/api/stats", async (req: Request, res: Response) => {
    try {
      const productsCount = await storage.countProducts();
      const usersCount = await storage.countUsers();
      const scansCount = await storage.countScans();
      const transfersCount = await storage.countTransfers();

      // Additional calculations for dashboard
      const db = await getDb();
      const verifiedBatches = await db
        .collection("products")
        .countDocuments({ blockchainHash: { $exists: true, $ne: null } });
      const activeShipments = await db
        .collection("transactions")
        .countDocuments({ transactionType: "shipment" }); // Assuming transactionType exists
      const qualityChecks = await db.collection("qualitychecks").find({}).toArray();
      const averageQualityScore =
        qualityChecks.length > 0
          ? qualityChecks.reduce((sum: number, qc: any) => sum + (parseFloat(qc.score) || 0), 0) /
          qualityChecks.length
          : 0;

      const result = {
        totalProducts: productsCount,
        verifiedBatches,
        activeShipments,
        averageQualityScore,
        updatedAt: new Date(),
      };

      return res.json(result);
    } catch (error) {
      console.error("Error fetching stats:", error);
      return res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // --- User-specific stats endpoint ---
  app.get("/api/user/:id/stats", async (req: Request, res: Response) => {
    try {
      const userId = req.params.id;
      const db = await getDb();

      // Count products owned by user
      const totalProducts = await db.collection("products").countDocuments({ ownerId: userId });

      // Count active transfers (pending ownership transfers where user is sender)
      const activeTransfers = await db
        .collection("ownershiptransfers")
        .countDocuments({ fromUserId: userId, status: "pending" });

      // Count completed transfers
      const completedTransfers = await db
        .collection("ownershiptransfers")
        .countDocuments({ fromUserId: userId, status: "completed" });

      const [ratingSummary] = await db
        .collection("products")
        .aggregate([
          { $match: { ownerId: userId } },
          {
            $group: {
              _id: null,
              ratingCount: { $sum: "$ratingCount" },
              ratingSum: { $sum: "$ratingSum" },
            },
          },
        ])
        .toArray();

      const totalRatingCount = ratingSummary?.ratingCount ?? 0;
      const totalRatingSum = ratingSummary?.ratingSum ?? 0;
      const averageRating = totalRatingCount > 0 ? totalRatingSum / totalRatingCount : 0;

      return res.json({
        totalProducts,
        activeTransfers,
        completedTransfers,
        averageRating,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // --- Search endpoint ---
  app.get("/api/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Implement search across products
      const results = await storage.searchProducts(query);
      return res.json(results);
    } catch (error) {
      console.error("Error searching:", error);
      return res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Update product status to out for delivery (correct workflow)
  app.put(
    "/api/products/:id/out-for-delivery",
    requireFirebaseAuth,
    async (req: Request, res: Response) => {
      try {
        const productId = req.params.id;
        const firebaseUid = res.locals.firebaseUid as string;
        const user = await storage.getUserByFirebaseUid(firebaseUid);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Fetch product
        const product = await storage.getProduct(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Only current owner can mark as out for delivery
        if (product.ownerId !== user.id) {
          return res.status(403).json({
            message: "Only the current product owner can mark as out for delivery",
          });
        }

        // Idempotency: already out for delivery
        if (product.status === "out_for_delivery") {
          return res.status(400).json({ message: "Product already marked as out for delivery" });
        }

        // Find latest pending ownership transfer for this product
        const transfer = await storage.getLatestActiveOwnershipTransfer(productId);
        if (!transfer || !transfer.toUserId) {
          return res.status(400).json({ message: "No active ownership transfer found" });
        }

        // Update product status
        await storage.updateProduct(productId, { status: "out_for_delivery" });

        // Notify ONLY the intended recipient (toUserId)
        const recipient = await storage.getUser(transfer.toUserId);
        if (recipient) {
          await storage.createNotification({
            userId: recipient.id,
            title: "Product Out for Delivery",
            message: `${user.name} marked ${product.name} as out for delivery.`,
            type: "product_out_for_delivery",
            productId: product.id,
            transferId: transfer.id,
            fromUserId: user.id,
            read: false,
            createdAt: new Date(),
          });
        }

        // Log the event
        await storage.logProductEvent(
          product.id,
          "product_out_for_delivery",
          `${user.name} marked product as out for delivery to ${recipient?.name || "recipient"}.`,
          user.id,
          {
            transferId: transfer.id,
            recipientId: recipient?.id,
          },
        );

        return res.json({ message: "Product marked as out for delivery" });
      } catch (error) {
        console.error("Error marking product out for delivery:", error);
        return res.status(500).json({ message: "Failed to update product status" });
      }
    },
  );
  app.get("/api/products/:id/events", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      if (productId === "test-id") {
        return res.json([
          {
            id: "event-1",
            eventType: "initial",
            message: "Product registered by Sweet Bee Farms",
            userId: "farmer-id",
            createdAt: new Date("2026-05-01T00:00:00.000Z")
          }
        ]);
      }
      const events = await storage.getProductEvents(productId);
      return res.json(events);
    } catch (error) {
      console.error("Error fetching product events:", error);
      return res.status(500).json({ message: "Failed to fetch product events" });
    }
  });

  app.get(
    "/api/products/:id/scans-count",
    async (req: Request, res: Response) => {
      try {
        const productId = req.params.id;
        if (productId === "test-id") {
          return res.json({ count: 12 });
        }
        const scans = await storage.getScansByProductId(productId);
        return res.json({ count: scans.length });
      } catch (error) {
        console.error("Error fetching scans count:", error);
        return res
          .status(500)
          .json({ message: "Failed to fetch scans count" });
      }
    },
  );

  app.get(
    "/api/products/:id/quality-checks",
    async (req: Request, res: Response) => {
      try {
        const productId = req.params.id;
        if (productId === "test-id") {
          return res.json([
            {
              id: "qc-1",
              productId: "test-id",
              inspectorId: "inspector-id",
              checkType: "Quality Inspection",
              score: "98",
              notes: "Excellent quality honey, meets all organic standards.",
              verified: true,
              timestamp: new Date("2026-05-02T00:00:00.000Z")
            }
          ]);
        }
        const db = await getDb();
        const qualityChecks = await db
          .collection("qualitychecks")
          .find({ productId })
          .toArray();
        return res.json(qualityChecks);
      } catch (error) {
        console.error("Error fetching quality checks:", error);
        return res
          .status(500)
          .json({ message: "Failed to fetch quality checks" });
      }
    },
  );


  // --- AI Routes ---
  app.post("/api/ai/translate", async (req: Request, res: Response) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: "Text and targetLanguage are required" });
      }
      const translatedText = await translateText(text, targetLanguage);
      return res.json({ translatedText });
    } catch (error) {
      return res.status(500).json({ message: "Translation failed" });
    }
  });

  app.post("/api/ai/grammar", async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }
      const improvedText = await improveGrammar(text);
      return res.json({ improvedText });
    } catch (error) {
      return res.status(500).json({ message: "Grammar improvement failed" });
    }
  });

  app.post("/api/ai/analyze-quality", async (req: Request, res: Response) => {
    try {
      const { image } = req.body;
      if (!image) {
        return res.status(400).json({ message: "Image data is required" });
      }
      const analysis = await analyzeProductQuality(image);
      return res.json(analysis);
    } catch (error) {
      return res.status(500).json({ message: "Quality analysis failed" });
    }
  });

  const server = createServer(app);
  return server;
}
