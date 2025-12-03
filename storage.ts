import { 
  type User, 
  type InsertUser, 
  type Product, 
  type InsertProduct,
  type Order,
  type InsertOrder,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByProduct(productId: string): Promise<Order[]>;
  createOrder(order: InsertOrder & { confirmationScript?: string }): Promise<Order>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private orders: Map<string, Order>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.orders = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = {
      ...insertProduct,
      id,
      price: insertProduct.price ?? null,
      category: insertProduct.category ?? null,
      benefits: (insertProduct.benefits || { ar: [], en: [], fr: [] }) as any,
      features: (insertProduct.features || { ar: [], en: [], fr: [] }) as any,
      createdAt: new Date(),
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updated: Product = { 
      ...product, 
      ...updates,
      benefits: (updates.benefits || product.benefits || { ar: [], en: [], fr: [] }) as any,
      features: (updates.features || product.features || { ar: [], en: [], fr: [] }) as any,
    };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByProduct(productId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.productId === productId
    );
  }

  async createOrder(insertOrder: InsertOrder & { confirmationScript?: string }): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      status: insertOrder.status || "pending",
      quantity: insertOrder.quantity || 1,
      language: insertOrder.language || "ar",
      customerAddress: insertOrder.customerAddress || null,
      customerCity: insertOrder.customerCity || null,
      notes: insertOrder.notes || null,
      confirmationScript: insertOrder.confirmationScript || null,
      createdAt: new Date(),
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updated: Order = { ...order, ...updates };
    this.orders.set(id, updated);
    return updated;
  }

  async deleteOrder(id: string): Promise<boolean> {
    return this.orders.delete(id);
  }
}

export const storage = new MemStorage();
