import { z } from "zod";

// -------------------- User --------------------
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  username: z.string(),
  role: z.string().default("farmer"),
  firebaseUid: z.string(),
  profileImage: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  roleSelected: z.boolean().default(false),
  language: z.string().default("en"),
  notificationsEnabled: z.boolean().default(true),
  createdAt: z.date()
});
export type User = z.infer<typeof userSchema>;

export const insertUserSchema = userSchema.omit({ id: true, createdAt: true }).extend({
  createdAt: z.date().optional()
});
export type InsertUser = z.infer<typeof insertUserSchema>;

// -------------------- Product --------------------
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  description: z.string().nullable().optional(),
  quantity: z.string(),
  unit: z.string(),
  farmName: z.string(),
  location: z.string(),
  harvestDate: z.date(),
  certifications: z.array(z.string()).nullable().optional(),
  qrCode: z.string().nullable().optional(),
  batchId: z.string().nullable().optional(),
  ownerId: z.string(),
  blockchainHash: z.string().nullable().optional(),
  status: z.string().default("registered"),
  price: z.string().nullable().optional(),
  createdAt: z.date(),
  // Add these new fields
  distributorName: z.string().nullable().optional(),
  warehouseLocation: z.string().nullable().optional(),
  storeName: z.string().nullable().optional(),
  storeLocation: z.string().nullable().optional()
});
export type Product = z.infer<typeof productSchema>;

export const insertProductSchema = productSchema.omit({ id: true, createdAt: true }).extend({
  createdAt: z.date().optional(),
  harvestDate: z.preprocess(
    (val) => (typeof val === "string" ? new Date(val) : val),
    z.date()
  ),
  price: z.string().nullable().optional() // Add to insert schema too
});
export type InsertProduct = z.infer<typeof insertProductSchema>;

// -------------------- Transaction --------------------
export const transactionSchema = z.object({
  id: z.string(),
  productId: z.string(),
  fromUserId: z.string().nullable().optional(),
  toUserId: z.string().nullable().optional(),
  transactionType: z.string(),
  location: z.string().nullable().optional(),
  coordinates: z.record(z.any()).nullable().optional(),
  temperature: z.string().nullable().optional(),
  humidity: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  blockchainHash: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  timestamp: z.date()
});
export type Transaction = z.infer<typeof transactionSchema>;

export const insertTransactionSchema = transactionSchema.omit({ id: true, timestamp: true }).extend({
  timestamp: z.date().optional()
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// -------------------- QualityCheck --------------------
export const qualityCheckSchema = z.object({
  id: z.string(),
  productId: z.string(),
  inspectorId: z.string(),
  checkType: z.string(),
  score: z.string(),
  notes: z.string().nullable().optional(),
  certificationUrl: z.string().nullable().optional(),
  verified: z.boolean().default(false),
  timestamp: z.date()
});
export type QualityCheck = z.infer<typeof qualityCheckSchema>;

export const insertQualityCheckSchema = qualityCheckSchema.omit({ id: true, verified: true, timestamp: true }).extend({
  timestamp: z.date().optional()
});
export type InsertQualityCheck = z.infer<typeof insertQualityCheckSchema>;

// -------------------- Scan --------------------
export const scanSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  coordinates: z.record(z.any()).nullable().optional(),
  timestamp: z.date()
});
export type Scan = z.infer<typeof scanSchema>;

export const insertScanSchema = scanSchema.omit({ id: true, timestamp: true }).extend({
  timestamp: z.date().optional()
});
export type InsertScan = z.infer<typeof insertScanSchema>;

// -------------------- OwnershipTransfer --------------------
export const ownershipTransferSchema = z.object({
  id: z.string(),
  productId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  transferType: z.string(),
  status: z.string().default("pending"),
  notes: z.string().nullable().optional(),
  expectedDelivery: z.date().nullable().optional(),
  actualDelivery: z.date().nullable().optional(),
  blockchainHash: z.string().nullable().optional(),
  paymentProofUrl: z.string().nullable().optional(),
  timestamp: z.date()
});
export type OwnershipTransfer = z.infer<typeof ownershipTransferSchema>;

export const insertOwnershipTransferSchema = ownershipTransferSchema.omit({ id: true, timestamp: true }).extend({
  expectedDelivery: z.date().nullable().optional(),
  actualDelivery: z.date().nullable().optional(),
  timestamp: z.date().optional()
});
export type InsertOwnershipTransfer = z.infer<typeof insertOwnershipTransferSchema>;

// -------------------- Notification --------------------
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.enum([
    "ownership_request",
    "product_request",
    "ownership_transfer",
    "ownership_transfer_rejected",
    "ownership_request_accepted",
    "product_received",
    "product_out_for_delivery",
    "product_event"
  ]),
  productId: z.string().optional(),
  transferId: z.string().optional(),
  fromUserId: z.string().optional(), // <-- Add this line
  read: z.boolean().default(false),
  createdAt: z.date(),
});
export type Notification = z.infer<typeof notificationSchema>;

export const insertNotificationSchema = notificationSchema.omit({ id: true, createdAt: true }).extend({
  createdAt: z.date().optional(),
});
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// -------------------- ProductOwner (Blockchain-style ownership record) --------------------
export const productOwnerSchema = z.object({
  id: z.string(),
  productId: z.string(),
  ownerId: z.string(),
  username: z.string(),
  name: z.string(),
  addedBy: z.string(),
  role: z.string(),
  canEditFields: z.array(z.string()),
  transferType: z.string().optional(), // "initial", "transfer", "sale", etc.
  blockNumber: z.number().optional(), // Blockchain-style block number
  previousOwnerHash: z.string().nullable().optional(), // Hash of previous ownership record
  ownershipHash: z.string().optional(), // Hash of this ownership record
  createdAt: z.date()
});
export type ProductOwner = z.infer<typeof productOwnerSchema>;

export const insertProductOwnerSchema = productOwnerSchema.omit({ id: true, createdAt: true, blockNumber: true, ownershipHash: true }).extend({
  createdAt: z.date().optional()
});
export type InsertProductOwner = z.infer<typeof insertProductOwnerSchema>;

// -------------------- ProductComment --------------------
export const productCommentSchema = z.object({
  id: z.string(),
  productId: z.string(),
  userId: z.string(),
  message: z.string(),
  createdAt: z.date()
});
export type ProductComment = z.infer<typeof productCommentSchema>;

export const insertProductCommentSchema = productCommentSchema.omit({ id: true, createdAt: true }).extend({
  createdAt: z.date().optional()
});
export type InsertProductComment = z.infer<typeof insertProductCommentSchema>;
