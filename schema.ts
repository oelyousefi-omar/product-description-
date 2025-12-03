import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Product descriptions in all three languages
export const productDescriptions = z.object({
  ar: z.string(),
  en: z.string(),
  fr: z.string(),
});

export type ProductDescriptions = z.infer<typeof productDescriptions>;

// Benefits for workers/employees
export const productBenefits = z.object({
  ar: z.array(z.string()),
  en: z.array(z.string()),
  fr: z.array(z.string()),
});

export type ProductBenefits = z.infer<typeof productBenefits>;

// Features/advantages
export const productFeatures = z.object({
  ar: z.array(z.string()),
  en: z.array(z.string()),
  fr: z.array(z.string()),
});

export type ProductFeatures = z.infer<typeof productFeatures>;

// Product table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  descriptions: jsonb("descriptions").$type<ProductDescriptions>().notNull(),
  benefits: jsonb("benefits").$type<ProductBenefits>().default({ar: [], en: [], fr: []}),
  features: jsonb("features").$type<ProductFeatures>().default({ar: [], en: [], fr: []}),
  price: text("price"),
  category: text("category"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  benefits: productBenefits.optional().default({ ar: [], en: [], fr: [] }),
  features: productFeatures.optional().default({ ar: [], en: [], fr: [] }),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Order status enum
export const orderStatusEnum = z.enum(["pending", "confirmed", "cancelled", "delivered"]);
export type OrderStatus = z.infer<typeof orderStatusEnum>;

// Order table
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  customerCity: text("customer_city"),
  notes: text("notes"),
  quantity: integer("quantity").notNull().default(1),
  status: text("status").notNull().default("pending"),
  confirmationScript: text("confirmation_script"),
  language: text("language").notNull().default("ar"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  confirmationScript: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Users table (keeping from template)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Supported languages
export type Language = "ar" | "en" | "fr";

// Translations type
export interface Translations {
  // Navigation
  dashboard: string;
  upload: string;
  products: string;
  orders: string;
  settings: string;
  
  // Upload page
  uploadTitle: string;
  uploadSubtitle: string;
  dragDrop: string;
  browseFiles: string;
  supportedFormats: string;
  analyzing: string;
  
  // Products page
  productsTitle: string;
  noProducts: string;
  productName: string;
  description: string;
  price: string;
  category: string;
  actions: string;
  edit: string;
  delete: string;
  viewDetails: string;
  generatePdf: string;
  copyScript: string;
  
  // Orders page
  ordersTitle: string;
  noOrders: string;
  newOrder: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  notes: string;
  quantity: string;
  status: string;
  pending: string;
  confirmed: string;
  cancelled: string;
  delivered: string;
  confirmationScript: string;
  selectProduct: string;
  createOrder: string;
  orderCreated: string;
  
  // Common
  save: string;
  cancel: string;
  search: string;
  filter: string;
  export: string;
  loading: string;
  error: string;
  success: string;
  arabic: string;
  english: string;
  french: string;
  language: string;
  date: string;
  total: string;
  
  // PDF
  downloadPdf: string;
  productDetails: string;
  orderDetails: string;
}
