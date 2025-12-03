import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import multer from "multer";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { Jimp } from "jimp";
import type { ProductDescriptions, ProductBenefits, ProductFeatures, Language } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Lazy initialization to allow app to start without API key
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Serve uploaded images
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  });
  app.use("/uploads", express.static(uploadDir));

  // ==================== PRODUCTS ====================
  
  // Get all products
  app.get("/api/products", async (req: Request, res: Response) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  // Get single product
  app.get("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  // Analyze product image with AI
  app.post("/api/products/analyze", upload.single("image"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imagePath = req.file.path;
      const imageUrl = `/uploads/${req.file.filename}`;

      // Read image and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype;

      // Analyze image with OpenAI Vision
      const analysisResponse = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت خبير تحليل المنتجات احترافي. حلل صورة المنتج بشكل مفصل جداً وأرجع JSON.
أرجع هذا التنسيق بالضبط مع معلومات مفصلة وشاملة جداً:
{
  "name": "اسم المنتج",
  "descriptions": {
    "ar": "وصف طويل وشامل ومفصل جداً للمنتج بالعربية (200+ كلمة) يتضمن المواد والمزايا والاستخدامات",
    "en": "Very detailed and comprehensive product description in English (200+ words) with materials, features and uses",
    "fr": "Description très détaillée et complète du produit en français (200+ mots) avec matériaux, caractéristiques et usages"
  },
  "benefits": {
    "ar": ["فائدة 1", "فائدة 2", "فائدة 3", "فائدة 4", "فائدة 5"],
    "en": ["Benefit 1", "Benefit 2", "Benefit 3", "Benefit 4", "Benefit 5"],
    "fr": ["Avantage 1", "Avantage 2", "Avantage 3", "Avantage 4", "Avantage 5"]
  },
  "features": {
    "ar": ["ميزة 1", "ميزة 2", "ميزة 3", "ميزة 4", "ميزة 5", "ميزة 6"],
    "en": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
    "fr": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3", "Caractéristique 4", "Caractéristique 5", "Caractéristique 6"]
  },
  "price": "السعر أو نطاق السعر",
  "category": "فئة المنتج"
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "حلل صورة المنتج بشكل مفصل جداً وأعطني وصف طويل شامل (200+ كلمة) وفوائد عديدة (5+) وميزات (6+) في 3 لغات كـ JSON فقط",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_completion_tokens: 2000,
        temperature: 1,
      });

      const analysisContent = analysisResponse.choices[0]?.message?.content;
      if (!analysisContent || analysisContent.trim().length === 0) {
        console.error("OpenAI Response:", JSON.stringify(analysisResponse));
        throw new Error("لم أتمكن من تحليل الصورة. تأكد من وضوح الصورة وحاول مرة أخرى.");
      }

      let analysis;
      try {
        // Remove markdown code blocks if present
        let cleanContent = analysisContent.trim();
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
        }
        analysis = JSON.parse(cleanContent);
      } catch (parseError) {
        console.error("Failed to parse AI response:", analysisContent);
        throw new Error("عذراً، لم تتمكن الخدمة من تحليل الصورة بشكل صحيح. حاول صورة أخرى.");
      }

      // Create product in storage
      const product = await storage.createProduct({
        name: analysis.name || "Unnamed Product",
        imageUrl,
        descriptions: analysis.descriptions as ProductDescriptions,
        benefits: analysis.benefits || { ar: [], en: [], fr: [] },
        features: analysis.features || { ar: [], en: [], fr: [] },
        price: analysis.price || null,
        category: analysis.category || null,
      });

      res.json(product);
    } catch (error: any) {
      console.error("Error analyzing product:", error);
      res.status(500).json({ 
        message: error.message || "Failed to analyze product image" 
      });
    }
  });

  // Update product
  app.patch("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.updateProduct(req.params.id, req.body);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Delete image file
      if (product.imageUrl.startsWith("/uploads/")) {
        const filename = product.imageUrl.replace("/uploads/", "");
        const filePath = path.join(uploadDir, filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await storage.deleteProduct(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Generate Meta marketing post
  app.post("/api/products/:id/marketing", async (req: Request, res: Response) => {
    try {
      const { language = "ar" } = req.body;
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const marketingResponse = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت خبير تسويق متخصص في إنشاء منشورات إعلانية جذابة على Meta وFacebook لتحقيق أقصى مبيعات.
أنشئ منشور إعلاني احترافي يركز على المزايا والفوائد ويثير الرغبة الشرائية.
أرجع JSON بهذا التنسيق:
{
  "post": "منشور إعلاني جاذب ومقنع (3-4 سطور قصيرة وواضحة)",
  "hashtags": ["#هاشتاج1", "#هاشتاج2", "#هاشتاج3", "#هاشتاج4", "#هاشتاج5"],
  "callToAction": "نص استدعاء للعمل مقنع",
  "salesTips": ["نصيحة بيعية 1", "نصيحة بيعية 2", "نصيحة بيعية 3"]
}`,
          },
          {
            role: "user",
            content: `اسم المنتج: ${product.name}
السعر: ${product.price || "N/A"}
الفئة: ${product.category || "N/A"}
الوصف: ${product.descriptions[language]}
الفوائد: ${product.benefits[language]?.join(", ")}
الميزات: ${product.features[language]?.join(", ")}

أنشئ منشور إعلاني Meta احترافي بلغة ${language === "ar" ? "العربية" : language === "fr" ? "الفرنسية" : "الإنجليزية"} يحقق أقصى مبيعات. أرجع JSON فقط.`,
          },
        ],
        max_completion_tokens: 1000,
        temperature: 0.7,
      });

      const marketingContent = marketingResponse.choices[0]?.message?.content;
      if (!marketingContent) {
        throw new Error("لم أتمكن من توليد المنشور الإعلاني");
      }

      let marketing;
      try {
        let cleanContent = marketingContent.trim();
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '');
        }
        marketing = JSON.parse(cleanContent);
      } catch (parseError) {
        throw new Error("خطأ في صيغة المنشور الإعلاني");
      }

      res.json(marketing);
    } catch (error: any) {
      console.error("Error generating marketing post:", error);
      res.status(500).json({ 
        message: error.message || "فشل توليد المنشور الإعلاني" 
      });
    }
  });

  // Generate marketing post as PNG image
  app.post("/api/products/:id/marketing-image", async (req: Request, res: Response) => {
    try {
      const { language = "ar", post, hashtags, callToAction } = req.body;
      
      if (!post || !hashtags || !callToAction) {
        return res.status(400).json({ message: "Missing marketing post data" });
      }

      // Create image (1200x1500 for Instagram/Facebook post)
      const image = new Jimp({ width: 1200, height: 1500, color: 0x1a1a2eff }); // Dark background

      // Load a font (jimp has built-in fonts)
      const font24 = await Jimp.loadFont(Jimp.FONT_SANS_24_WHITE);
      const font16 = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

      // Add title
      image.print({
        font: font24,
        x: 50,
        y: 50,
        text: "📱 منشور إعلاني",
        maxWidth: 1100,
      });

      // Add post text
      image.print({
        font: font16,
        x: 50,
        y: 150,
        text: post,
        maxWidth: 1100,
      });

      // Add hashtags
      const hashtagText = hashtags.join(" ");
      image.print({
        font: font16,
        x: 50,
        y: 700,
        text: hashtagText,
        maxWidth: 1100,
      });

      // Add call to action
      image.print({
        font: font24,
        x: 50,
        y: 1000,
        text: callToAction,
        maxWidth: 1100,
      });

      // Convert to PNG buffer
      const pngBuffer = await image.png().toBuffer();

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Disposition", "inline; filename=marketing-post.png");
      res.send(pngBuffer);
    } catch (error: any) {
      console.error("Error generating marketing image:", error);
      res.status(500).json({ 
        message: error.message || "فشل توليد صورة المنشور الإعلاني" 
      });
    }
  });

  // AI Chat about product
  app.post("/api/products/:id/chat", async (req: Request, res: Response) => {
    try {
      const { question, language, productDescription } = req.body;
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }

      const response = await getOpenAI().chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `أنت مساعد متخصص في المنتجات. لديك وصف المنتج وعليك الإجابة على الأسئلة بناءً عليه. أجب بنفس لغة السؤال بشكل مختصر.

وصف المنتج:
${productDescription || "لا يوجد وصف"}`,
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.7,
        max_completion_tokens: 500,
      });

      const answer = response.choices[0]?.message?.content || "Unable to generate response";
      res.json({ answer });
    } catch (error: any) {
      console.error("Error in product chat:", error);
      res.status(500).json({ 
        message: error.message || "Failed to process chat request" 
      });
    }
  });

  // Generate image from chat description
  app.post("/api/products/:id/chat/generate-image", async (req: Request, res: Response) => {
    try {
      const { prompt, productName } = req.body;
      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const premiumAdPrompt = `أنشئ صورة إعلانية عالية التحويل مخصصة للإعلانات على Meta (فيسبوك + إنستجرام).

المشهد يجب أن يكون واقعياً: شخص واثق يمسك أو يستخدم أو يعرض المنتج بحماس ورضا وثقة.
البيئة نظيفة وحديثة مع إضاءة سينمائية ناعمة. النسيج الجلدي طبيعي وواقعي تماماً.

المنتج هو نجم الصورة: تركيز حاد، نسيج فاخر، مواد مفصلة، العلامة أو التصميم واضح جداً.
إضاءة احترافية مع انعكاسات لامعة.

أضف نصاً تسويقياً جريء قصير (5-7 كلمات كحد أقصى) مثل: 
"مخزون محدود | -50% اليوم" أو "الأكثر مبيعاً — اطلب الآن".

الخط حديث ونظيف وسهل القراءة. التموضع في الأعلى أو الأسفل (لا يحجب الوجه أو المنتج).

الألوان نابضة بالحياة وملفتة للنظر مع تباين عالي. 
لا إزعاج، لا علامات مائية، لا شعارات إلا إذا كانت فاخرة.

الكاميرا: 35 مم - عمق حقل ضحل - تركيز سينمائي.
الإضاءة: صندوق ناعم + ارتداد طبيعي.
التفاصيل حادة، التباين سلس، مظهر فاخر.

الأسلوب: واقعي فائق، 4K، موجه للتحويل، يوقف التمرير، استئناف عاطفي، إعلان تجاري حديث احترافي.

نسبة العرض: 1080x1350 عمودي (تنسيق إعلانات Meta).

المنتج: ${productName}
الوصف المحدد: ${prompt}

الآن أنشئ صورة احترافية عالية الجودة تتبع كل هذه المتطلبات بدقة.`;

      const imageResponse = await getOpenAI().images.generate({
        model: "dall-e-3",
        prompt: premiumAdPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
      });

      const imageUrl = imageResponse.data[0]?.url;
      if (!imageUrl) {
        throw new Error("Failed to generate image");
      }

      res.json({ imageUrl });
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ 
        message: error.message || "فشل توليد الصورة" 
      });
    }
  });

  // Generate product PDF
  app.get("/api/products/:id/pdf", async (req: Request, res: Response) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const lang = (req.query.lang as Language) || "ar";
      const pdfContent = generateProductPDF(product, lang);
      
      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${product.name}-${lang}.html"`);
      res.setHeader("Content-Length", Buffer.byteLength(pdfContent));
      res.send(pdfContent);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // ==================== ORDERS ====================

  // Get all orders
  app.get("/api/orders", async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  // Create order
  app.post("/api/orders", async (req: Request, res: Response) => {
    try {
      const { productId, customerName, customerPhone, customerAddress, customerCity, notes, quantity, language } = req.body;

      if (!productId || !customerName || !customerPhone) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Get product for confirmation script
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Generate confirmation script
      const confirmationScript = generateConfirmationScript(product, {
        customerName,
        customerPhone,
        customerAddress,
        customerCity,
        quantity: quantity || 1,
      }, language || "ar");

      const order = await storage.createOrder({
        productId,
        customerName,
        customerPhone,
        customerAddress,
        customerCity,
        notes,
        quantity: quantity || 1,
        status: "pending",
        language: language || "ar",
        confirmationScript,
      });

      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Update order
  app.patch("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteOrder(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Generate order PDF
  app.get("/api/orders/:id/pdf", async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const product = await storage.getProduct(order.productId);
      const lang = (req.query.lang as Language) || "ar";
      const pdfContent = generateOrderPDF(order, product, lang);
      
      res.setHeader("Content-Type", "text/html");
      res.setHeader("Content-Disposition", `attachment; filename="order-${order.id}.html"`);
      res.send(pdfContent);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  return httpServer;
}

// Helper function to generate confirmation script
function generateConfirmationScript(
  product: any,
  customer: { customerName: string; customerPhone: string; customerAddress?: string; customerCity?: string; quantity: number },
  lang: Language
): string {
  const scripts: Record<Language, string> = {
    ar: `
السلام عليكم ${customer.customerName}،

أشكرك على اهتمامك بمنتجنا.

تفاصيل طلبك:
المنتج: ${product.name}
الكمية: ${customer.quantity}
${product.price ? `السعر: ${product.price}` : ""}

وصف المنتج:
${product.descriptions.ar}

${customer.customerCity ? `المدينة: ${customer.customerCity}` : ""}
${customer.customerAddress ? `العنوان: ${customer.customerAddress}` : ""}

هل تؤكد هذا الطلب؟

نحن في انتظار ردك.
شكراً لثقتكم بنا.
    `.trim(),

    en: `
Hello ${customer.customerName},

Thank you for your interest in our product.

Order Details:
Product: ${product.name}
Quantity: ${customer.quantity}
${product.price ? `Price: ${product.price}` : ""}

Product Description:
${product.descriptions.en}

${customer.customerCity ? `City: ${customer.customerCity}` : ""}
${customer.customerAddress ? `Address: ${customer.customerAddress}` : ""}

Do you confirm this order?

We look forward to your response.
Thank you for your trust.
    `.trim(),

    fr: `
Bonjour ${customer.customerName},

Merci pour votre intérêt pour notre produit.

Détails de la commande:
Produit: ${product.name}
Quantité: ${customer.quantity}
${product.price ? `Prix: ${product.price}` : ""}

Description du produit:
${product.descriptions.fr}

${customer.customerCity ? `Ville: ${customer.customerCity}` : ""}
${customer.customerAddress ? `Adresse: ${customer.customerAddress}` : ""}

Confirmez-vous cette commande?

Nous attendons votre réponse.
Merci pour votre confiance.
    `.trim(),
  };

  return scripts[lang];
}

// Helper function to generate product PDF (HTML format for easy printing)
function generateProductPDF(product: any, lang: Language): string {
  const isRTL = lang === "ar";
  const labels: Record<Language, any> = {
    ar: { product: "تفاصيل المنتج", name: "الاسم", price: "السعر", category: "الفئة", description: "الوصف", benefits: "الفوائد", features: "الميزات" },
    en: { product: "Product Details", name: "Name", price: "Price", category: "Category", description: "Description", benefits: "Benefits", features: "Features" },
    fr: { product: "Détails du Produit", name: "Nom", price: "Prix", category: "Catégorie", description: "Description", benefits: "Avantages", features: "Caractéristiques" },
  };

  const t = labels[lang];

  const benefitsHTML = product.benefits?.[lang]?.length > 0 ? `
  <div class="section">
    <h2>${t.benefits}</h2>
    <ul class="list">
      ${product.benefits[lang].map((benefit: string) => `<li>${benefit}</li>`).join("")}
    </ul>
  </div>` : "";

  const featuresHTML = product.features?.[lang]?.length > 0 ? `
  <div class="section">
    <h2>${t.features}</h2>
    <ul class="list">
      ${product.features[lang].map((feature: string) => `<li>${feature}</li>`).join("")}
    </ul>
  </div>` : "";

  return `
<!DOCTYPE html>
<html dir="${isRTL ? "rtl" : "ltr"}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${product.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; color: #333; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
    .header h1 { font-size: 28px; color: #1a56db; margin-bottom: 10px; font-weight: bold; }
    .product-image { text-align: center; margin-bottom: 30px; }
    .product-image img { max-width: 400px; max-height: 400px; object-fit: cover; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .details { margin-bottom: 30px; }
    .detail-row { display: flex; margin-bottom: 15px; padding: 10px; background: #f9fafb; border-radius: 6px; }
    .detail-label { font-weight: bold; min-width: 120px; color: #6b7280; }
    .detail-value { flex: 1; }
    .description { margin-top: 20px; padding: 20px; background: #f0f9ff; border-radius: 8px; line-height: 1.8; border-left: 4px solid #1a56db; }
    .section { margin-top: 30px; padding: 20px; background: #fafafa; border-radius: 8px; }
    .section h2 { font-size: 20px; color: #1a56db; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
    .list { margin-left: 20px; }
    .list li { margin-bottom: 12px; line-height: 1.6; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t.product}</h1>
  </div>
  <div class="product-image">
    <img src="${product.imageUrl}" alt="${product.name}">
  </div>
  <div class="details">
    <div class="detail-row">
      <span class="detail-label">${t.name}:</span>
      <span class="detail-value">${product.name}</span>
    </div>
    ${product.price ? `
    <div class="detail-row">
      <span class="detail-label">${t.price}:</span>
      <span class="detail-value">${product.price}</span>
    </div>` : ""}
    ${product.category ? `
    <div class="detail-row">
      <span class="detail-label">${t.category}:</span>
      <span class="detail-value">${product.category}</span>
    </div>` : ""}
  </div>
  <div class="description">
    <strong>${t.description}:</strong>
    <p style="margin-top: 10px;">${product.descriptions[lang]}</p>
  </div>
  ${benefitsHTML}
  ${featuresHTML}
  <div class="footer">
    <p>ProductAI - ${new Date().toLocaleDateString(lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US")}</p>
  </div>
</body>
</html>
  `.trim();
}

// Helper function to generate order PDF
function generateOrderPDF(order: any, product: any, lang: Language): string {
  const isRTL = lang === "ar";
  const labels: Record<Language, any> = {
    ar: {
      order: "تفاصيل الطلب",
      customer: "اسم العميل",
      phone: "رقم الهاتف",
      city: "المدينة",
      address: "العنوان",
      quantity: "الكمية",
      status: "الحالة",
      product: "المنتج",
      date: "التاريخ",
      script: "سكربت التأكيد",
      statuses: { pending: "قيد الانتظار", confirmed: "مؤكد", cancelled: "ملغي", delivered: "تم التوصيل" },
    },
    en: {
      order: "Order Details",
      customer: "Customer Name",
      phone: "Phone Number",
      city: "City",
      address: "Address",
      quantity: "Quantity",
      status: "Status",
      product: "Product",
      date: "Date",
      script: "Confirmation Script",
      statuses: { pending: "Pending", confirmed: "Confirmed", cancelled: "Cancelled", delivered: "Delivered" },
    },
    fr: {
      order: "Détails de la Commande",
      customer: "Nom du Client",
      phone: "Téléphone",
      city: "Ville",
      address: "Adresse",
      quantity: "Quantité",
      status: "Statut",
      product: "Produit",
      date: "Date",
      script: "Script de Confirmation",
      statuses: { pending: "En attente", confirmed: "Confirmé", cancelled: "Annulé", delivered: "Livré" },
    },
  };

  const t = labels[lang];

  return `
<!DOCTYPE html>
<html dir="${isRTL ? "rtl" : "ltr"}" lang="${lang}">
<head>
  <meta charset="UTF-8">
  <title>${t.order} - ${order.customerName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: #fff; color: #333; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #eee; }
    .header h1 { font-size: 24px; color: #1a56db; margin-bottom: 10px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #374151; }
    .detail-row { display: flex; margin-bottom: 12px; padding: 10px; background: #f9fafb; border-radius: 6px; }
    .detail-label { font-weight: bold; min-width: 140px; color: #6b7280; }
    .detail-value { flex: 1; }
    .product-info { display: flex; gap: 20px; padding: 15px; background: #f0f9ff; border-radius: 8px; margin-bottom: 20px; }
    .product-image { width: 100px; height: 100px; object-fit: cover; border-radius: 6px; }
    .product-details { flex: 1; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }
    .status-delivered { background: #dbeafe; color: #1e40af; }
    .script { margin-top: 20px; padding: 20px; background: #f9fafb; border-radius: 8px; white-space: pre-wrap; line-height: 1.8; font-size: 14px; }
    .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 2px solid #eee; color: #9ca3af; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t.order}</h1>
  </div>
  
  ${product ? `
  <div class="section">
    <div class="section-title">${t.product}</div>
    <div class="product-info">
      <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
      <div class="product-details">
        <h3>${product.name}</h3>
        ${product.price ? `<p style="color: #6b7280; margin-top: 5px;">${product.price}</p>` : ""}
      </div>
    </div>
  </div>
  ` : ""}

  <div class="section">
    <div class="detail-row">
      <span class="detail-label">${t.customer}:</span>
      <span class="detail-value">${order.customerName}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${t.phone}:</span>
      <span class="detail-value">${order.customerPhone}</span>
    </div>
    ${order.customerCity ? `
    <div class="detail-row">
      <span class="detail-label">${t.city}:</span>
      <span class="detail-value">${order.customerCity}</span>
    </div>` : ""}
    ${order.customerAddress ? `
    <div class="detail-row">
      <span class="detail-label">${t.address}:</span>
      <span class="detail-value">${order.customerAddress}</span>
    </div>` : ""}
    <div class="detail-row">
      <span class="detail-label">${t.quantity}:</span>
      <span class="detail-value">${order.quantity}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${t.status}:</span>
      <span class="detail-value">
        <span class="status status-${order.status}">${t.statuses[order.status] || order.status}</span>
      </span>
    </div>
    <div class="detail-row">
      <span class="detail-label">${t.date}:</span>
      <span class="detail-value">${new Date(order.createdAt).toLocaleDateString(lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US")}</span>
    </div>
  </div>

  ${order.confirmationScript ? `
  <div class="section">
    <div class="section-title">${t.script}</div>
    <div class="script">${order.confirmationScript}</div>
  </div>
  ` : ""}

  <div class="footer">
    <p>ProductAI - ${new Date().toLocaleDateString(lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US")}</p>
  </div>
</body>
</html>
  `.trim();
}
