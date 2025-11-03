import { MongoClient, Db } from "mongodb";
import { randomUUID } from "crypto";
import { createHash } from "crypto";
import { config } from "dotenv";
import { 
  User, InsertUser, 
  Product, InsertProduct, 
  Transaction, InsertTransaction, 
  QualityCheck, InsertQualityCheck,
  Scan, InsertScan,
  OwnershipTransfer, InsertOwnershipTransfer,
  Notification, InsertNotification,
  ProductOwner, InsertProductOwner,
  ProductComment, InsertProductComment
} from "@shared/schema";

config();

let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  const client = new MongoClient(process.env.MONGO_URI!);
  await client.connect();
  db = client.db(process.env.MONGO_DB_NAME);
  return db;
}

export class MongoStorage {
  // -------- Helper Methods --------
  private generateOwnershipHash(productId: string, ownerId: string, blockNumber: number, previousHash: string | null): string {
    const data = `${productId}-${ownerId}-${blockNumber}-${previousHash || 'genesis'}`;
    return createHash('sha256').update(data).digest('hex');
  }

  private async getNextBlockNumber(productId: string): Promise<number> {
    const db = await getDb();
    const lastOwner = await db.collection<ProductOwner>("product_owners")
      .findOne({ productId }, { sort: { blockNumber: -1 } });
    return (lastOwner?.blockNumber || 0) + 1;
  }

  private async getLastOwnershipHash(productId: string): Promise<string | null> {
    const db = await getDb();
    const lastOwner = await db.collection<ProductOwner>("product_owners")
      .findOne({ productId }, { sort: { blockNumber: -1 } });
    return lastOwner?.ownershipHash || null;
  }

  // -------- User Operations --------
  async getUser(id: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ id });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ email });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ username });
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const db = await getDb();
    return db.collection<User>("users").findOne({ firebaseUid });
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const user: User = {
      ...insertUser,
      id: randomUUID(),
      role: insertUser.role || "farmer",
      profileImage: insertUser.profileImage || null,
      phone: insertUser.phone || null,
      company: insertUser.company || null,
      location: insertUser.location || null,
      bio: insertUser.bio || null,
      website: insertUser.website || null,
      roleSelected: insertUser.roleSelected || false,
      language: insertUser.language || "en",
      notificationsEnabled: insertUser.notificationsEnabled !== false,
      createdAt: new Date()
    };
    await db.collection<User>("users").insertOne(user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const db = await getDb();
    const result = await db.collection<User>("users").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) return null;
    return result as User;
  }

  // -------- Product Operations --------
  async getProduct(id: string): Promise<Product | null> {
    const db = await getDb();
    return db.collection<Product>("products").findOne({ id });
  }

  async getProductByBatchId(batchId: string): Promise<Product | null> {
    const db = await getDb();
    return db.collection<Product>("products").findOne({ batchId });
  }

  async getProductsByUser(userId: string): Promise<Product[]> {
    const db = await getDb();
    return db.collection<Product>("products").find({ ownerId: userId }).toArray();
  }

  async getAllProducts(limit?: number): Promise<Product[]> {
    const db = await getDb();
    let cursor = db.collection<Product>("products").find({});
    if (limit) cursor = cursor.limit(limit);
    const products = await cursor.toArray();
    return products;
  }

  async getAvailableProducts(excludeUserId: string): Promise<Product[]> {
    const db = await getDb();
    return db.collection<Product>("products")
      .find({ ownerId: { $ne: excludeUserId } })
      .toArray();
  }

  async countProducts(): Promise<number> {
    const db = await getDb();
    return await db.collection('products').countDocuments();
  }

  async countUsers(): Promise<number> {
    const db = await getDb();
    return await db.collection('users').countDocuments();
  }

  async countScans(): Promise<number> {
    const db = await getDb();
    return await db.collection('scans').countDocuments();
  }

  async countTransfers(): Promise<number> {
    const db = await getDb();
    return await db.collection('ownershipTransfers').countDocuments();
  }

  async getRecentScans(limit: number = 5): Promise<any[]> {
    const db = await getDb();
    return db.collection("scans")
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
  }
  async getUserScans(userId: string): Promise<Scan[]> {
    const db = await getDb();
    const scans = await db.collection<Scan>("scans").find({ userId }).toArray();
    return scans;
  }
  
  // Get all notifications for a user, newest first
  async getUserNotifications(userId: string): Promise<Notification[]> {
    const db = await getDb();
    return db.collection<Notification>("notifications")
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();
  }

  // Mark a notification as read
  async markNotificationRead(notificationId: string): Promise<void> {
    const db = await getDb();
    await db.collection("notifications").updateOne(
      { id: notificationId },
      { $set: { read: true } }
    );
  }

  // Create a notification
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const db = await getDb();
    const notification: Notification = {
      ...insertNotification,
      id: randomUUID(),
      read: insertNotification.read ?? false,
      productId: insertNotification.productId || undefined, 
      transferId: insertNotification.transferId || undefined,
      fromUserId: insertNotification.fromUserId || undefined,
      createdAt: new Date()
    };
    await db.collection<Notification>("notifications").insertOne(notification);
    return notification;
  }
  
  async searchProducts(query: string): Promise<Product[]> {
    const db = await getDb();
    return db.collection<Product>("products")
      .find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { farmName: { $regex: query, $options: "i" } }
        ]
      })
      .toArray();
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const db = await getDb();

    // Use a hash for batchId based on product name, farmName, and createdAt
    const createdAt = new Date();
    const batchId = insertProduct.batchId ||
      createHash('sha256')
        .update(`${insertProduct.name}-${insertProduct.farmName}-${createdAt.toISOString()}`)
        .digest('hex')
        .slice(0, 10);

    // Use a hash for blockchainHash based on product data and batchId
    const blockchainHash = insertProduct.blockchainHash ||
      createHash('sha256')
        .update(`${insertProduct.name}-${batchId}-${createdAt.toISOString()}`)
        .digest('hex');

    // Generate qrCode if not provided (example: use batchId in a URL)
    const qrCode = insertProduct.qrCode || `/product/${batchId}`;

    const product: Product = {
      ...insertProduct,
      id: randomUUID(),
      quantity: String(insertProduct.quantity),
      description: insertProduct.description || null,
      certifications: insertProduct.certifications || null,
      status: insertProduct.status || "registered",
      batchId,
      qrCode,
      blockchainHash,
      price: insertProduct.price || null, // Add price handling
      createdAt
    };
    await db.collection<Product>("products").insertOne(product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const db = await getDb();
    const result = await db.collection<Product>("products").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) return null;
    return result as Product;
  }

  // Get products by owner with sorting
  async getProductsByOwner(ownerId: string, limit?: number, sortBy: 'newest' | 'oldest' = 'newest'): Promise<Product[]> {
    const db = await getDb();
    let cursor = db.collection<Product>("products")
      .find({ ownerId })
      .sort({ createdAt: sortBy === 'newest' ? -1 : 1 });
    
    if (limit) cursor = cursor.limit(limit);
    const products = await cursor.toArray();
    return products;
  }

  // Search products by owner with filters
  async searchProductsByOwner(ownerId: string, query: string): Promise<Product[]> {
    const db = await getDb();
    return db.collection<Product>("products")
      .find({
        ownerId,
        $or: [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { farmName: { $regex: query, $options: "i" } },
          { batchId: { $regex: query, $options: "i" } }
        ]
      })
      .sort({ createdAt: -1 }) // Newest first
      .toArray();
  }

  // -------- Transaction Operations --------
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const db = await getDb();
    const transaction: Transaction = {
      ...insertTransaction,
      id: randomUUID(),
      location: insertTransaction.location || null,
      fromUserId: insertTransaction.fromUserId || null,
      toUserId: insertTransaction.toUserId || null,
      coordinates: insertTransaction.coordinates || null,
      temperature: insertTransaction.temperature || null,
      humidity: insertTransaction.humidity || null,
      notes: insertTransaction.notes || null,
      blockchainHash: insertTransaction.blockchainHash || null,
      verified: insertTransaction.verified ?? false,
      timestamp: new Date()
    };
    await db.collection<Transaction>("transactions").insertOne(transaction);
    return transaction;
  }

  // -------- QualityCheck Operations --------
  async createQualityCheck(insertQualityCheck: InsertQualityCheck): Promise<QualityCheck> {
    const db = await getDb();
    const qualityCheck: QualityCheck = {
      ...insertQualityCheck,
      id: randomUUID(),
      notes: insertQualityCheck.notes || null,
      certificationUrl: insertQualityCheck.certificationUrl || null,
      verified: false,
      timestamp: new Date()
    };
    await db.collection<QualityCheck>("qualitychecks").insertOne(qualityCheck);
    return qualityCheck;
  }

  // -------- Scan Operations --------
  async createScan(insertScan: InsertScan): Promise<Scan> {
    const db = await getDb();
    const scan: Scan = {
      ...insertScan,
      id: randomUUID(),
      location: insertScan.location || null,
      userId: insertScan.userId || null,
      coordinates: insertScan.coordinates || null,
      timestamp: new Date()
    };
    await db.collection<Scan>("scans").insertOne(scan);
    return scan;
  }

  // -------- OwnershipTransfer Operations --------
  async createOwnershipTransfer(insertOwnershipTransfer: InsertOwnershipTransfer): Promise<OwnershipTransfer> {
    const db = await getDb();
    const transfer: OwnershipTransfer = {
      ...insertOwnershipTransfer,
      id: randomUUID(),
      status: insertOwnershipTransfer.status || "pending",
      notes: insertOwnershipTransfer.notes || null,
      expectedDelivery: insertOwnershipTransfer.expectedDelivery || null,
      actualDelivery: insertOwnershipTransfer.actualDelivery || null,
      blockchainHash: insertOwnershipTransfer.blockchainHash || null,
      timestamp: new Date()
    };
    await db.collection<OwnershipTransfer>("ownershiptransfers").insertOne(transfer);
    return transfer;
  }


  // -------- OwnershipTransfer Operations --------
  async getOwnershipTransfer(id: string): Promise<OwnershipTransfer | null> {
    const db = await getDb();
    return db.collection<OwnershipTransfer>("ownershiptransfers").findOne({ id });
  }

  async updateOwnershipTransfer(id: string, updates: Partial<OwnershipTransfer>): Promise<OwnershipTransfer | null> {
    const db = await getDb();
    const result = await db.collection<OwnershipTransfer>("ownershiptransfers").findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: "after" }
    );
    if (!result) return null;
    return result as OwnershipTransfer;
  }

  async getPendingTransfersForUser(userId: string): Promise<OwnershipTransfer[]> {
    const db = await getDb();
    return db.collection<OwnershipTransfer>("ownershiptransfers")
      .find({ toUserId: userId, status: "pending" })
      .toArray();
  }

  // -------- ProductOwner Operations (Blockchain-style) --------
  async addProductOwner(insertProductOwner: InsertProductOwner): Promise<ProductOwner> {
    const db = await getDb();
    
    // Get blockchain-style data
    const blockNumber = await this.getNextBlockNumber(insertProductOwner.productId);
    const previousOwnerHash = await this.getLastOwnershipHash(insertProductOwner.productId);
    const ownershipHash = this.generateOwnershipHash(
      insertProductOwner.productId,
      insertProductOwner.ownerId,
      blockNumber,
      previousOwnerHash
    );

    const owner: ProductOwner = {
      ...insertProductOwner,
      id: randomUUID(),
      blockNumber,
      previousOwnerHash,
      ownershipHash,
      transferType: insertProductOwner.transferType || (blockNumber === 1 ? "initial" : "transfer"),
      createdAt: new Date()
    };
    
    await db.collection<ProductOwner>("product_owners").insertOne(owner);
    return owner;
  }

  async getProductOwners(productId: string): Promise<ProductOwner[]> {
    const db = await getDb();
    return db.collection<ProductOwner>("product_owners")
      .find({ productId })
      .sort({ blockNumber: 1 }) // Sort by blockchain order
      .toArray();
  }

  async getOwnershipChain(productId: string): Promise<ProductOwner[]> {
    return this.getProductOwners(productId); // Same as getProductOwners but with clear naming
  }


  async getOwnershipHistory(ownerId: string): Promise<{ productId: string, productName: string, ownershipRecords: ProductOwner[] }[]> {
    const db = await getDb();
    
    // Find all ownership records for this owner
    const ownershipRecords = await db.collection<ProductOwner>("product_owners")
      .find({ ownerId })
      .toArray();
      
    // Group by product
    const productMap = new Map<string, ProductOwner[]>();
    
    ownershipRecords.forEach(record => {
      if (!productMap.has(record.productId)) {
        productMap.set(record.productId, []);
      }
      productMap.get(record.productId)!.push(record);
    });
    
    // Get product details for each product
    const result: { productId: string, productName: string, ownershipRecords: ProductOwner[] }[] = [];
    
    // Use Array.from to handle the Map entries in a more TypeScript-friendly way
    const entries = Array.from(productMap.entries());
    for (let i = 0; i < entries.length; i++) {
      const [productId, records] = entries[i];
      const product = await this.getProduct(productId);
      if (product) {
        result.push({
          productId,
          productName: product.name,
          ownershipRecords: records.sort((a: ProductOwner, b: ProductOwner) => 
            (a.blockNumber || 0) - (b.blockNumber || 0)
          )
        });
      }
    }
    
    return result;
  }
  
  async hasUserOwnedProduct(productId: string, userId: string): Promise<boolean> {
    const db = await getDb();
    
    // Check if user has ever owned this product
    const record = await db.collection<ProductOwner>("product_owners")
      .findOne({ productId, ownerId: userId });
      
    return !!record;
  }
  
  async verifyOwnershipChain(productId: string): Promise<{ valid: boolean; errors?: Array<{ blockNumber: number; message: string }> }> {
    const chain = await this.getProductOwners(productId);
    
    // If chain is empty or has only one block, it's valid by default
    if (chain.length <= 1) {
      return { valid: true };
    }
    
    const errors: Array<{ blockNumber: number; message: string }> = [];
    
    // Verify each block in the chain starting from the second one
    for (let i = 1; i < chain.length; i++) {
      const currentBlock = chain[i];
      const previousBlock = chain[i-1];
      
      // 1. Check if previous hash matches
      if (currentBlock.previousOwnerHash !== previousBlock.ownershipHash) {
        errors.push({ 
          blockNumber: currentBlock.blockNumber!, 
          message: "Previous hash mismatch - chain integrity compromised" 
        });
      }
      
      // 2. Validate block number is sequential
      if (currentBlock.blockNumber !== previousBlock.blockNumber! + 1) {
        errors.push({ 
          blockNumber: currentBlock.blockNumber!, 
          message: "Block number sequence broken" 
        });
      }
      
      // 3. Recalculate and verify hash
      const expectedHash = this.generateOwnershipHash(
        currentBlock.productId,
        currentBlock.ownerId,
        currentBlock.blockNumber!,
        currentBlock.previousOwnerHash || null
      );
      
      if (expectedHash !== currentBlock.ownershipHash) {
        errors.push({ 
          blockNumber: currentBlock.blockNumber!, 
          message: "Hash verification failed - data may have been tampered with" 
        });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // -------- ProductComment Operations --------
  async addProductComment(insertProductComment: InsertProductComment): Promise<ProductComment> {
    const db = await getDb();
    const comment: ProductComment = {
      ...insertProductComment,
      id: randomUUID(),
      createdAt: new Date()
    };
    await db.collection<ProductComment>("product_comments").insertOne(comment);
    return comment;
  }

  async getProductComments(productId: string): Promise<ProductComment[]> {
    const db = await getDb();
    return db.collection<ProductComment>("product_comments")
      .find({ productId })
      .sort({ createdAt: 1 })
      .toArray();
  }

  // -------- Custom Query Methods for Journey Route --------
  async getTransactionsByProductId(productId: string): Promise<Transaction[]> {
    const db = await getDb();
    return db.collection<Transaction>("transactions")
      .find({ productId })
      .sort({ timestamp: 1 })
      .toArray();
  }

  async getScansByProductId(productId: string): Promise<Scan[]> {
    const db = await getDb();
    return db.collection<Scan>("scans")
      .find({ productId })
      .sort({ timestamp: 1 })
      .toArray();
  }

  async searchUsers(query: string, limit = 10): Promise<any[]> {
    try {
      const db = await getDb();
      const users = await db.collection("users").find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } }
        ]
      }).limit(limit).toArray();
      
      return users.map((u: any) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        profileImage: u.profileImage || null
      }));
    } catch (error) {
      console.error("Error searching users:", error);
      return []; // Return empty array on error, don't throw
    }
  }

  // Get complete journey data for a product (supply chain map)
  async getProductJourney(productId: string): Promise<any[]> {
    const db = await getDb();
    
    // Get product info
    const product = await this.getProduct(productId);
    if (!product) {
      throw new Error("Product not found");
    }
    
    // Get ownership history
    const ownershipChain = await this.getOwnershipChain(productId);
    
    // Get transactions and scans
    const transactions = await this.getTransactionsByProductId(productId);
    const scans = await this.getScansByProductId(productId);
    
    // Build journey locations
    const journeyLocations: any[] = [];
    
    // Add initial creation location (farm)
    if (product) {
      const initialOwner = ownershipChain.find(owner => owner.blockNumber === 1);
      
      if (initialOwner) {
        journeyLocations.push({
          id: `origin-${product.id}`,
          name: product.farmName,
          role: initialOwner.role,
          latitude: this.getRandomCoordinate(37.7749, 0.5),
          longitude: this.getRandomCoordinate(-122.4194, 0.5),
          timestamp: product.createdAt.toISOString(),
          status: 'Origin'
        });
      }
    }
    
    // Add transaction locations
    if (transactions && transactions.length > 0) {
      for (const transaction of transactions) {
        journeyLocations.push({
          id: transaction.id,
          name: transaction.location || 'Unknown location',
          role: 'distributor',
          latitude: this.getRandomCoordinate(37.7749, 1),
          longitude: this.getRandomCoordinate(-122.4194, 1),
          timestamp: transaction.timestamp.toISOString(),
          status: transaction.transactionType
        });
      }
    }
    
    // Add scan locations
    if (scans && scans.length > 0) {
      for (const scan of scans) {
        let userRole = 'consumer';
        let userName = 'Unknown user';
        
        if (scan.userId) {
          const scanUser = await this.getUser(scan.userId);
          if (scanUser) {
            userRole = scanUser.role;
            userName = scanUser.name;
          }
        }
        
        journeyLocations.push({
          id: scan.id,
          name: userName,
          role: userRole,
          latitude: scan.coordinates?.latitude || this.getRandomCoordinate(37.7749, 1.5),
          longitude: scan.coordinates?.longitude || this.getRandomCoordinate(-122.4194, 1.5),
          timestamp: scan.timestamp.toISOString(),
          status: 'Scan'
        });
      }
    }
    
    return journeyLocations;
  }

  // Helper function to generate random coordinates for demo
  private getRandomCoordinate(base: number, range: number): number {
    return base + (Math.random() * 2 - 1) * range;
  }

  // -------- Product Event Logging --------
  async logProductEvent(productId: string, eventType: string, message: string, userId: string, extra?: any) {
    const db = await getDb();
    const event = {
      id: randomUUID(),
      productId,
      eventType,
      message,
      userId,
      extra: extra || null,
      createdAt: new Date()
    };
    await db.collection("product_events").insertOne(event);
    return event;
  }

  async getProductEvents(productId: string): Promise<any[]> {
    const db = await getDb();
    return db.collection("product_events")
      .find({ productId })
      .sort({ createdAt: 1 })
      .toArray();
  }
}

export const storage = new MongoStorage();

// Test connection on startup
(async () => {
  try {
    console.log("[MongoDB] Testing connection...");
    await getDb();
    console.log("[MongoDB]", process.env.MONGO_URI);
    console.log("MONGO_DB_NAME:", process.env.MONGO_DB_NAME);
    console.log("[MongoDB] Connection test successful");
  } catch (error) {
    console.error("[MongoDB] Connection test failed:", error);
  }
})();


