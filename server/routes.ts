import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { MongoStorage, getDb } from "./storage";
import { z } from "zod";
import multer from "multer";
import path from "path";
import {
  insertUserSchema, insertProductSchema, insertTransactionSchema,
  insertQualityCheckSchema, insertScanSchema, insertOwnershipTransferSchema,
  insertNotificationSchema, insertProductOwnerSchema, insertProductCommentSchema
} from "@shared/schema";
import { fileURLToPath } from "url";
import { dirname } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize MongoDB storage
const storage = new MongoStorage();


const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "../uploads/payment-proofs");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

const uploadDir = path.join(__dirname, "../uploads/payment-proofs");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("Created upload directory:", uploadDir);
}

export async function registerRoutes(app: Express) {
  app.use("/uploads/payment-proofs", express.static(path.join(__dirname, "../uploads/payment-proofs")));
  // --- Authentication Routes ---
  app.post("/api/user/register", async (req: Request, res: Response) => {
    try {
      const { email, name, firebaseUid, profileImage, roleSelected } = req.body;
      
      // Validate required fields
      if (!email || !name || !firebaseUid) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (existingUser) {
        return res.json(existingUser); // Return existing user if already registered
      }
      
      // Create new user with username derived from email
      const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
      
      const user = await storage.createUser({
        email,
        name,
        username,
        role: "farmer", // default role
        firebaseUid,
        profileImage,
        roleSelected: roleSelected || false,
        language: "en",
        notificationsEnabled: true
      });
      
      return res.status(201).json(user);
    } catch (error) {
      console.error("Error registering user:", error);
      return res.status(500).json({ message: "Failed to register user" });
    }
  });
  
  // Get user profile
  app.get("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
  app.put("/api/user/profile", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const updates = req.body;
      // Ensure certain fields cannot be changed
      delete updates.firebaseUid;
      delete updates.id;
      
      const updatedUser = await storage.updateUser(user.id, updates);
      return res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Failed to update profile" });
    }
  });
    app.get("/api/users/search", async (req, res) => {
      try {
        const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
        if (!firebaseUid) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        const currentUser = await storage.getUserByFirebaseUid(firebaseUid);
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }
        const q = (req.query.q as string || "").trim();
        if (!q) return res.json([]);
        let users = await storage.searchUsers(q, 10);
        users = users.filter(u => u.id !== currentUser.id);
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
app.patch("/api/users/:id", async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const userToUpdate = await storage.getUser(id);
    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the authenticated user is the same as the user being updated
    if (userToUpdate.firebaseUid !== firebaseUid) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const updates = req.body;
    // Remove protected fields
    delete updates.firebaseUid;
    delete updates.id;

    const updatedUser = await storage.updateUser(id, updates);
    return res.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
});

  // --- Product Routes ---
  app.post("/api/products", async (req: Request, res: Response) => {
    try {
      const parse = insertProductSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ message: "Invalid product data", errors: parse.error.format() });
      }
      
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const productData = {
        ...parse.data,
        ownerId: user.id
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
        createdAt: new Date()
      });
      
      return res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      return res.status(500).json({ message: "Failed to create product" });
    }
  });

  //All products search
 app.get("/api/products/available/search", async (req, res) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        console.log("No firebase-uid header found:", req.headers);
        return res.status(401).json({ message: "Unauthorized" });
      }

      console.log("Received search request with firebase-uid:", firebaseUid);
      const currentUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (!currentUser) {
        console.log("User not found for uid:", firebaseUid);
        return res.status(404).json({ message: "User not found" });
      }

      const q = (req.query.q as string)?.toLowerCase() || "";
      console.log("Searching for products with query:", q);
      
      const db = await getDb();
      if (!db) {
        return res.status(500).json({ message: "Database connection failed" });
      }

      const products = await db.collection("products")
        .find({
          ownerId: { $ne: currentUser.id },
          $or: [
            { name: { $regex: q, $options: "i" } },
            { category: { $regex: q, $options: "i" } },
            { farmName: { $regex: q, $options: "i" } },
            { batchId: { $regex: q, $options: "i" } }
          ]
        })
        .toArray();

      console.log("Returning products count:", products.length);
      res.setHeader("Content-Type", "application/json");
      return res.status(200).json(products || []);
    } catch (error) {
      console.error("Error searching available products:", error);
      return res.status(500).json({ message: "Failed to search products" });
    }
  });


  app.get("/api/products/:id", async (req: Request, res: Response) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    return res.json(product);
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
  app.get("/api/user/products/owned", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
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
  app.get("/api/user/products/scanned", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
  });

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
  app.post("/api/transactions", async (req: Request, res: Response) => {
    const parse = insertTransactionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid transaction data", errors: parse.error.format() });
    }
    const transaction = await storage.createTransaction(parse.data);
    return res.status(201).json(transaction);
  });

  // --- Quality Check Routes ---
  app.post("/api/quality-checks", async (req: Request, res: Response) => {
    const parse = insertQualityCheckSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid quality check data", errors: parse.error.format() });
    }
    const check = await storage.createQualityCheck(parse.data);
    return res.status(201).json(check);
  });

  // --- Scan Routes ---
  app.post("/api/scans", async (req: Request, res: Response) => {
    const parse = insertScanSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ message: "Invalid scan data", errors: parse.error.format() });
    }
    const scan = await storage.createScan(parse.data);
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
  app.post("/api/ownership-transfers", async (req: Request, res: Response) => {
    try {
      console.log("HIT /api/ownership-transfers ENDPOINT!");

      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        console.log("[OWNERSHIP REQUEST] No firebase-uid header found");
        return res.status(401).json({ message: "Unauthorized" });
      }

      const currentUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (!currentUser) {
        console.log("[OWNERSHIP REQUEST] User not found for firebaseUid:", firebaseUid);
        return res.status(404).json({ message: "User not found" });
      }

      // Validate required fields manually since we're not using the full schema
      const productId = req.body.productId;
      const transferType = req.body.transferType;
      const notes = req.body.notes;
      const toUserId = req.body.toUserId;

      console.log("[OWNERSHIP REQUEST] Raw req.body:", req.body);
      console.log("[OWNERSHIP REQUEST] Direct access - toUserId:", req.body.toUserId);
      console.log("[OWNERSHIP REQUEST] Direct access - productId:", req.body.productId);
      console.log("[OWNERSHIP REQUEST] Direct access - transferType:", req.body.transferType);
      console.log("[OWNERSHIP REQUEST] Direct access - notes:", req.body.notes);

      if (!productId) {
        console.log("[OWNERSHIP REQUEST] Product ID is missing");
        return res.status(400).json({ message: "Product ID is required" });
      }

      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      let recipientUserId: string;
      let isOwnerTransfer = false;

      // Determine the scenario based on whether current user owns the product
      if (product.ownerId === currentUser.id) {
        // Current user is the product owner - this is an owner-initiated transfer
        if (!toUserId) {
          return res.status(400).json({ message: "toUserId is required for owner-initiated transfers" });
        }
        recipientUserId = toUserId;
        isOwnerTransfer = true;
        console.log("[OWNERSHIP REQUEST] Owner-initiated transfer to:", recipientUserId);
      } else {
        // Current user is not the product owner - this is a consumer request
        recipientUserId = product.ownerId;
        console.log("[OWNERSHIP REQUEST] Consumer request to product owner:", recipientUserId);
      }

      // Prevent self-transfer
      if (recipientUserId === currentUser.id) {
        return res.status(400).json({ message: "Cannot transfer ownership to yourself" });
      }

      // Validate recipient exists
      const recipientUser = await storage.getUser(recipientUserId);
      if (!recipientUser) {
        return res.status(404).json({ message: "Recipient user not found" });
      }

      // Create a pending transfer
      const transfer = await storage.createOwnershipTransfer({
        productId,
        fromUserId: currentUser.id, // Requester (current user)
        toUserId: recipientUserId, // Use recipientUserId determined above
        transferType: transferType || "request",
        notes: notes || null,
        status: "pending"
      });

      console.log(`[OWNERSHIP REQUEST] Requester: ${currentUser.name} (${currentUser.id}) -> Owner: ${product.ownerId}`);

      // Create notification for the recipient
      await storage.createNotification({
        userId: recipientUserId, // Send to the determined recipient
        title: "Product Ownership Request",
        message: `${currentUser.name} sent an ownership transfer request for ${product.name} to you.`,
        type: "ownership_request",
        productId: product.id,
        transferId: transfer.id,
        fromUserId: currentUser.id,
        read: false,
        createdAt: new Date()
      });

      // DEBUG: Log notification recipients
      console.log(`Notification sent to userId: ${recipientUserId} for product: ${product.name}`);

      console.log(`[NOTIFICATION CREATED] Sent to user: ${recipientUserId} for product: ${product.name}`);

      await storage.logProductEvent(
        product.id,
        "ownership_request",
        `${currentUser.name} requested ownership.`,
        currentUser.id,
        { transferId: transfer.id }
      );

      return res.status(201).json({
        message: "Transfer request sent. Waiting for acceptance.",
        transferId: transfer.id
      });
    } catch (error) {
      console.error("Error transferring ownership:", error);
      return res.status(500).json({ message: "Failed to transfer ownership" });
    }
  });

  app.post("/api/request-product", async (req: Request, res: Response) => {
    try {
      console.log("HIT /api/request-product ENDPOINT!");

      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }

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

      // Prevent requesting your own product
      if (product.ownerId === requester.id) {
        return res.status(400).json({ message: "You already own this product" });
      }

      // Create a pending ownership transfer (from requester to owner)
      const transfer = await storage.createOwnershipTransfer({
        productId,
        fromUserId: requester.id,
        toUserId: product.ownerId,
        transferType: transferType || "request",
        notes: notes || null,
        status: "pending"
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
        createdAt: new Date()
      });

      // Optionally log the event
      await storage.logProductEvent(
        product.id,
        "ownership_request",
        `${requester.name} requested ownership.`,
        requester.id,
        { transferId: transfer.id }
      );

      return res.status(201).json({
        message: "Ownership request sent. Waiting for acceptance.",
        transferId: transfer.id
      });
    } catch (error) {
      console.error("Error in /api/request-product:", error);
      return res.status(500).json({ message: "Failed to request product" });
    }
  });

// server/routes/ownershipTransfers.ts

/**
 * Accept an ownership transfer AND optionally update/register product data.
 * Expects:
 *  - transferId in params
 *  - headers: firebase-uid (or x-firebase-uid)
 *  - body: { productData?: {...}, productId?: string }
 */
app.put("/api/ownership-transfers/:id/accept", upload.single("paymentProof"), async (req: Request, res: Response) => {
  const transferId = req.params.id;
  const firebaseUid = req.header("firebase-uid") || req.header("x-firebase-uid");

  console.log("Accept ownership transfer called");
  console.log("transferId:", transferId);
  console.log("firebaseUid:", firebaseUid);
  console.log("req.headers:", req.headers);
  console.log("req.body:", req.body);
  console.log("req.file:", req.file);

  if (!firebaseUid) {
    console.log("No firebaseUid");
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Extract all form data
  const formData = { ...req.body };

  // Define all possible form fields that might be submitted
  const possibleFormFields = [
    "name", "category", "description", "quantity", "unit",
    "distributorName", "warehouseLocation", "dispatchDate",
    "certifications", "price", "paymentProofUrl",
    "storeName", "storeLocation", "arrivalDate"
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

  console.log("filledFields:", filledFields);
  console.log("registeredFields:", registeredFields);

  // Parse certifications if sent as JSON string
  if (filledFields.certifications && typeof filledFields.certifications === "string") {
    try {
      filledFields.certifications = JSON.parse(filledFields.certifications);
    } catch (e) {
      console.error("Error parsing certifications:", e);
    }
  }

  // Parse numbers if needed
  if (filledFields.price && typeof filledFields.price === "string" && !isNaN(Number(filledFields.price))) {
    filledFields.price = Number(filledFields.price);
  }
  if (filledFields.quantity && typeof filledFields.quantity === "string" && !isNaN(Number(filledFields.quantity))) {
    filledFields.quantity = Number(filledFields.quantity);
  }

  // If you handle paymentProof file upload, set paymentProofUrl here
  if (req.file && req.file.filename) {
    filledFields.paymentProofUrl = `/uploads/payment-proofs/${req.file.filename}`;
    if (!registeredFields.includes("paymentProofUrl")) {
      registeredFields.push("paymentProofUrl");
    }
  }

  try {
    console.log("Getting user by firebaseUid");
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    console.log("User found:", user ? user.id : "null");
    if (!user) return res.status(404).json({ message: "User not found" });

    console.log("Getting transfer by id");
    const transfer = await storage.getOwnershipTransfer(transferId);
    console.log("Transfer found:", transfer ? transfer.id : "null");
    if (!transfer) return res.status(404).json({ message: "Transfer not found" });

    console.log("Checking if user is recipient:", transfer.toUserId === user.id);
    if (transfer.toUserId !== user.id) {
      return res.status(403).json({ message: "You are not the recipient of this transfer" });
    }

    console.log("Checking transfer status:", transfer.status);
    if (transfer.status !== "pending") {
      if (transfer.status === "completed") return res.json({ message: "Transfer already completed" });
      return res.status(400).json({ message: "Transfer is not pending" });
    }

    console.log("Getting product");
    const product = await storage.getProduct(transfer.productId);
    console.log("Product found:", product ? product.id : "null");
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Verify ownership chain integrity before allowing transfer
    console.log("Verifying ownership chain");
    const verificationResult = await storage.verifyOwnershipChain(product.id);
    console.log("Verification result:", verificationResult);
    if (!verificationResult.valid) {
      return res.status(400).json({
        message: "Cannot transfer ownership: Blockchain integrity compromised",
        errors: verificationResult.errors,
      });
    }

    // 1) Update transfer status -> completed
    console.log("Updating transfer status");
    await storage.updateOwnershipTransfer(transferId, { status: "completed" });

    // 2) Update product with the filled fields
    console.log("Updating product");
    await storage.updateProduct(product.id, { ownerId: user.id, ...filledFields });

    // 3) Add to product owners blockchain
    console.log("Adding product owner");
    const newOwnerBlock = await storage.addProductOwner(
      {
        productId: product.id,
        ownerId: user.id,
        username: user.username,
        name: user.name,
        addedBy: transfer.fromUserId,
        role: user.role,
        canEditFields: ["quantity", "location"],
        transferType: transfer.transferType,
        createdAt: new Date(),
      }
    );

    // 4) Create notification for previous owner
    console.log("Creating notification for previous owner");
    await storage.createNotification(
      {
        userId: transfer.fromUserId,
        title: "Ownership Transfer Completed",
        message: `${user.name} has accepted ownership of ${product.name}.`,
        type: "ownership_transfer",
        productId: product.id,
        transferId: transfer.id,
        read: false,
        createdAt: new Date(),
      }
    );

    // Fetch previous owner info
    const previousOwner = await storage.getUser(transfer.fromUserId);

    // In your backend endpoint, update the logProductEvent call:
    console.log("Logging product event");
    await storage.logProductEvent(
      product.id,
      "ownership_registration",
      `${user.name} (${user.role}) registered product details.`,
      user.id,
      {
        transferId: transfer.id,
        registrationType: user.role,
        userName: user.username, // Store username instead of name
        userRole: user.role,
        previousOwnerName: previousOwner?.username || previousOwner?.name || "Unknown", // Use username if available
        previousOwnerRole: previousOwner?.role || "Unknown",
        registeredFields: registeredFields,
        ...filledFields
      }
    );

    console.log("Returning success");
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
});

// Debug endpoint to check form data
app.post("/api/debug/form-data", upload.single("paymentProof"), async (req: Request, res: Response) => {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("File:", req.file);
  
  // Check all possible fields
  const possibleFields = [
    "name", "category", "description", "quantity", "unit",
    "distributorName", "warehouseLocation", "dispatchDate", 
    "certifications", "price", "storeName", "storeLocation", "arrivalDate"
  ];
  
  const receivedFields: Record<string, any> = {};
  for (const field of possibleFields) {
    if (req.body[field] !== undefined) {
      receivedFields[field] = req.body[field];
    }
  }
  
  console.log("Received fields:", receivedFields);
  
  res.json({
    headers: req.headers,
    body: req.body,
    file: req.file,
    receivedFields: receivedFields
  });
});

  app.put("/api/ownership-transfers/:id/reject", async (req: Request, res: Response) => {
    try {
      const transferId = req.params.id;
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
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
      await storage.updateOwnershipTransfer(transferId, { status: "rejected" });
      
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
          createdAt: new Date()
        });
      }
      
      return res.json({ message: "Ownership transfer rejected successfully" });
    } catch (error) {
      console.error("Error rejecting ownership transfer:", error);
      return res.status(500).json({ message: "Failed to reject ownership transfer" });
    }
  });

  // Get pending transfer requests for user
  app.get("/api/ownership-transfers/pending", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const pendingTransfers = await storage.getPendingTransfersForUser(user.id);
      return res.json(pendingTransfers);
    } catch (error) {
      console.error("Error fetching pending transfers:", error);
      return res.status(500).json({ message: "Failed to fetch pending transfers" });
    }
  });

  // --- Notification Routes ---

  // Create a notification
  app.post("/api/notifications", async (req, res) => {
    try {
      const parse = insertNotificationSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ message: "Invalid notification data", errors: parse.error.format() });
      }
      const notification = await storage.createNotification(parse.data);
      return res.status(201).json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      return res.status(500).json({ message: "Failed to create notification" });
    }
  });

  // Get all notifications for the authenticated user
  app.get("/api/notifications", async (req, res) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
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
      return res.status(400).json({ message: "Invalid product owner data", errors: parse.error.format() });
    }
    const productOwner = await storage.addProductOwner(parse.data);
    return res.status(201).json(productOwner);
  });

  app.get("/api/products/:id/owners", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const owners = await storage.getProductOwners(productId);

      // Enrich with user details
      const enrichedOwners = await Promise.all(
        owners.map(async (owner) => {
          const user = await storage.getUser(owner.ownerId);
          return {
            ...owner,
            name: user?.name || 'Unknown',
            email: user?.email || '',
            role: user?.role || 'unknown'
          };
        })
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
        timestamp: new Date()
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
        timestamp: new Date()
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
        timestamp: new Date()
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
      return res.status(400).json({ message: "Invalid product comment data", errors: parse.error.format() });
    }
    const comment = await storage.addProductComment(parse.data);
    return res.status(201).json(comment);
  });

  app.get("/api/products/:id/comments", async (req: Request, res: Response) => {
    const comments = await storage.getProductComments(req.params.id);
    return res.json(comments);
  });

  app.get("/api/products/:id/journey", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
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
  app.put("/api/user/role", async (req: Request, res: Response) => {
    try {
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const { role } = req.body;
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }
      
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(user.id, { 
        role, 
        roleSelected: true 
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
      const qrCodeData = product.qrCode || `${req.protocol}://${req.get('host')}/product/${productId}`;
      
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

      console.log("Stats counts:", { productsCount, usersCount, scansCount, transfersCount });

      // Additional calculations for dashboard
      const db = await getDb();
      const verifiedBatches = await db.collection('products').countDocuments({ blockchainHash: { $exists: true, $ne: null } });
      const activeShipments = await db.collection('transactions').countDocuments({ transactionType: 'shipment' }); // Assuming transactionType exists
      const qualityChecks = await db.collection('qualitychecks').find({}).toArray();
      const averageQualityScore = qualityChecks.length > 0 ? qualityChecks.reduce((sum: number, qc: any) => sum + (parseFloat(qc.score) || 0), 0) / qualityChecks.length : 0;

      console.log("Additional stats:", { verifiedBatches, activeShipments, averageQualityScore, qualityChecksCount: qualityChecks.length });

      const result = {
        totalProducts: productsCount,
        verifiedBatches,
        activeShipments,
        averageQualityScore,
        updatedAt: new Date()
      };

      console.log("Returning stats:", result);

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
      const totalProducts = await db.collection('products').countDocuments({ ownerId: userId });

      // Count active transfers (pending ownership transfers where user is sender)
      const activeTransfers = await db.collection('ownershiptransfers').countDocuments({ fromUserId: userId, status: 'pending' });

      // Count completed transfers
      const completedTransfers = await db.collection('ownershiptransfers').countDocuments({ fromUserId: userId, status: 'completed' });

      // Average rating - for now, placeholder as ratings not implemented
      const averageRating = 0; // TODO: implement ratings system

      console.log("User stats for", userId, { totalProducts, activeTransfers, completedTransfers, averageRating });

      return res.json({
        totalProducts,
        activeTransfers,
        completedTransfers,
        averageRating,
        updatedAt: new Date()
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

    // Get products available for request (all products not owned by the current user)
    // Update product status to out for delivery
  app.put("/api/products/:id/out-for-delivery", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const firebaseUid = req.header('firebase-uid') || req.header('x-firebase-uid');
      if (!firebaseUid) return res.status(401).json({ message: "Unauthorized" });
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      if (!user) return res.status(404).json({ message: "User not found" });

      // Update product status
      await storage.updateProduct(productId, { status: "out_for_delivery" });

      // Notify next owner (distributor, etc.)
      // You may need to determine the next owner based on your logic
      // For demo, let's notify all previous owners except current
      const owners = await storage.getProductOwners(productId);
      const prevOwners = owners.filter(o => o.ownerId !== user.id);
      for (const owner of prevOwners) {
        await storage.createNotification({
          userId: owner.ownerId,
          title: "Product Out for Delivery",
          message: `${user.name} marked ${productId} as out for delivery.`,
          type: "product_out_for_delivery",
          productId,
          read: false,
          createdAt: new Date()
        });
      }

      await storage.logProductEvent(
        productId,
        "product_out_for_delivery",
        `${user.name} marked product as out for delivery.`,
        user.id
      );

      return res.json({ message: "Product marked as out for delivery" });
    } catch (error) {
      console.error("Error marking product out for delivery:", error);
      return res.status(500).json({ message: "Failed to update product status" });
    }
  });
  app.get("/api/products/:id/events", async (req: Request, res: Response) => {
    try {
      const productId = req.params.id;
      const events = await storage.getProductEvents(productId);
      return res.json(events);
    } catch (error) {
      console.error("Error fetching product events:", error);
      return res.status(500).json({ message: "Failed to fetch product events" });
    }
  });

  const server = createServer(app);
  return server;
}

