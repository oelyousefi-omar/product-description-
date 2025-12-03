import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Send, FileDown, Copy, Upload as UploadIcon, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Language } from "@shared/schema";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface MarketingPost {
  post: string;
  hashtags: string[];
  callToAction: string;
  salesTips: string[];
}

export default function Home() {
  const { t, language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [descriptionLang, setDescriptionLang] = useState<Language>(language);
  const [marketingPost, setMarketingPost] = useState<MarketingPost | null>(null);
  const [marketingImageUrl, setMarketingImageUrl] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  const translations = {
    ar: {
      welcome: "تحليل المنتجات بالذكاء الاصطناعي",
      subtitle: "رفع صورة المنتج واحصل على معلومات كاملة والتحليل من الذكاء الاصطناعي",
      uploadImage: "رفع صورة المنتج",
      dragDrop: "اسحب الصورة هنا أو انقر",
      analyzing: "جاري التحليل...",
      selectImage: "اختر صورة",
      askQuestion: "اسأل عن المنتج...",
      send: "إرسال",
      copyInfo: "نسخ المعلومات",
      downloadPDF: "تحميل PDF",
      description: "الوصف",
      newProduct: "منتج جديد",
      invalidFile: "الرجاء اختيار ملف صورة صحيح",
      analysisError: "حدث خطأ أثناء التحليل. حاول صورة أخرى.",
      successfulAnalysis: "تم تحليل المنتج بنجاح",
      benefits: "فوائد العامل",
      features: "الميزات الرئيسية",
      generateMarketing: "إنشاء منشور إعلاني",
      marketingPost: "منشور إعلاني Meta",
    },
    en: {
      welcome: "AI Product Analysis",
      subtitle: "Upload a product image and get complete information with AI analysis",
      uploadImage: "Upload Product Image",
      dragDrop: "Drag image here or click",
      analyzing: "Analyzing...",
      selectImage: "Select Image",
      askQuestion: "Ask about the product...",
      send: "Send",
      copyInfo: "Copy Info",
      downloadPDF: "Download PDF",
      description: "Description",
      newProduct: "New Product",
      invalidFile: "Please select a valid image file",
      analysisError: "Analysis failed. Try another image.",
      successfulAnalysis: "Product analyzed successfully",
      benefits: "Benefits for Workers",
      features: "Key Features",
      generateMarketing: "Generate Marketing Post",
      marketingPost: "Meta Marketing Post",
    },
    fr: {
      welcome: "Analyse de produits par IA",
      subtitle: "Téléchargez une image de produit et obtenez des informations complètes avec analyse IA",
      uploadImage: "Télécharger l'image du produit",
      dragDrop: "Glissez l'image ici ou cliquez",
      analyzing: "Analyse en cours...",
      selectImage: "Sélectionner l'image",
      askQuestion: "Posez une question sur le produit...",
      send: "Envoyer",
      copyInfo: "Copier les informations",
      downloadPDF: "Télécharger PDF",
      description: "Description",
      newProduct: "Nouveau produit",
      invalidFile: "Veuillez sélectionner un fichier image valide",
      analysisError: "L'analyse a échoué. Essayez une autre image.",
      successfulAnalysis: "Produit analysé avec succès",
      benefits: "Avantages pour les travailleurs",
      features: "Caractéristiques principales",
      generateMarketing: "Générer le post marketing",
      marketingPost: "Post Marketing Meta",
    },
  };

  const trans = translations[language] || translations.ar;

  const marketingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<MarketingPost>(
        "POST",
        `/api/products/${product?.id}/marketing`,
        { language }
      );
      return response;
    },
    onSuccess: (data) => {
      setMarketingPost(data);
      // Generate image after post is created
      generateMarketingImage(data);
      toast({
        title: language === "ar" ? "نجاح" : language === "fr" ? "Succès" : "Success",
        description: "تم إنشاء المنشور الإعلاني بنجاح",
      });
    },
    onError: () => {
      toast({
        title: language === "ar" ? "خطأ" : language === "fr" ? "Erreur" : "Error",
        description: "فشل توليد المنشور الإعلاني",
        variant: "destructive",
      });
    },
  });

  const generateMarketingImage = async (marketingData: MarketingPost) => {
    try {
      const response = await fetch(`/api/products/${product?.id}/marketing-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          post: marketingData.post,
          hashtags: marketingData.hashtags,
          callToAction: marketingData.callToAction,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate image");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMarketingImageUrl(url);
    } catch (error) {
      console.error("Error generating marketing image:", error);
    }
  };

  const downloadMarketingImage = async () => {
    if (!marketingImageUrl || !product) return;
    try {
      const a = document.createElement("a");
      a.href = marketingImageUrl;
      a.download = `${product.name}-marketing.png`;
      a.click();
      
      toast({
        title: language === "ar" ? "نجاح" : language === "fr" ? "Succès" : "Success",
        description: language === "ar" ? "تم تحميل صورة المنشور" : language === "fr" ? "Image téléchargée" : "Image downloaded",
      });
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : language === "fr" ? "Erreur" : "Error",
        description: language === "ar" ? "فشل تحميل الصورة" : "Failed to download",
        variant: "destructive",
      });
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<Product> => {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/products/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setProduct(data);
      setMessages([]);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: t.success,
        description: translations[language].successfulAnalysis,
      });
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: t.error,
        description: error.message || translations[language].analysisError,
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest<{ answer: string }>(
        "POST",
        `/api/products/${product?.id}/chat`,
        {
          question,
          language,
          productDescription: product?.descriptions[language],
        }
      );
      return response.answer;
    },
    onSuccess: (answer) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: answer,
        },
      ]);
    },
    onError: () => {
      toast({
        title: t.error,
        description: "Failed to get AI response",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: t.error,
        description: translations[language].invalidFile,
        variant: "destructive",
      });
      return;
    }

    setUploadProgress(30);
    uploadMutation.mutate(file);
  };

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "user",
        content: chatInput,
      },
    ]);

    chatMutation.mutate(chatInput);
    setChatInput("");
  };

  const generateImageFromChat = async (customPrompt?: string) => {
    if (!product) return;

    const promptToUse = customPrompt || (messages.length > 0 ? messages[messages.length - 1]?.content : "صورة احترافية للمنتج");
    if (!promptToUse) return;

    setGeneratingImage(true);
    try {
      const response = await fetch(`/api/products/${product.id}/chat/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptToUse,
          productName: product.name,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate image");
      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: `تم توليد صورة احترافية: ${promptToUse}`,
          imageUrl: data.imageUrl,
        },
      ]);

      toast({
        title: language === "ar" ? "نجاح" : "Success",
        description: language === "ar" ? "تم توليد الصورة بنجاح" : "Image generated successfully",
      });
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : "Error",
        description: language === "ar" ? "فشل توليد الصورة" : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const downloadProductPDF = async () => {
    if (!product) return;
    try {
      const response = await fetch(`/api/products/${product.id}/pdf?lang=${language}`);
      if (!response.ok) throw new Error("HTML generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${product.name}-${language}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: language === "ar" ? "نجاح" : language === "fr" ? "Succès" : "Success",
        description: language === "ar" ? "تم تحميل معلومات المنتج بصيغة HTML" : "Product information downloaded as HTML",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: language === "ar" ? "خطأ" : language === "fr" ? "Erreur" : "Error",
        description: language === "ar" ? "فشل تحميل المعلومات" : "Failed to download information",
        variant: "destructive",
      });
    }
  };

  const copyProductInfo = () => {
    if (!product) return;
    const info = `Product: ${product.name}
Price: ${product.price || "N/A"}
Category: ${product.category || "N/A"}

Description:
${product.descriptions[language]}`;
    navigator.clipboard.writeText(info);
    toast({
      title: t.success,
      description: "Information copied to clipboard",
    });
  };

  const downloadPDF = async () => {
    if (!product) return;
    try {
      const response = await fetch(`/api/products/${product.id}/pdf?lang=${language}`);
      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.name}.html`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: t.success,
        description: "PDF downloaded",
      });
    } catch (error) {
      toast({
        title: t.error,
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const downloadImage = async () => {
    if (!product) return;
    try {
      const response = await fetch(product.imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product.name}.jpg`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: language === "ar" ? "نجاح" : language === "fr" ? "Succès" : "Success",
        description: language === "ar" ? "تم تحميل الصورة" : language === "fr" ? "Image téléchargée" : "Image downloaded",
      });
    } catch (error) {
      toast({
        title: language === "ar" ? "خطأ" : language === "fr" ? "Erreur" : "Error",
        description: language === "ar" ? "فشل تحميل الصورة" : language === "fr" ? "Échec du téléchargement" : "Failed to download image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" data-testid="text-home-title">
          {trans.welcome}
        </h1>
        <p className="text-muted-foreground" data-testid="text-home-subtitle">
          {trans.subtitle}
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Section */}
        <Card
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDragDrop}
          className="border-2 border-dashed cursor-pointer hover:border-primary transition-colors"
          data-testid="card-upload"
        >
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 rounded-full bg-muted">
                <UploadIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-medium">{trans.dragDrop}</p>
                <p className="text-sm text-muted-foreground">{trans.uploadImage}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-center w-full">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  data-testid="button-select-image"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {trans.analyzing}
                    </>
                  ) : (
                    <>
                      <UploadIcon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {trans.selectImage}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadMutation.isPending}
                  variant="outline"
                  data-testid="button-direct-select"
                >
                  <ImageIcon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {language === "ar" ? "اختر صورة مباشرة" : "Choose Image"}
                </Button>
              </div>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                data-testid="input-image"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product Display & Chat */}
        {product && (
          <div className="space-y-6">
            {/* Product Information */}
            <Card data-testid="card-product-info">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image & Info */}
                  <div className="space-y-4">
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        data-testid="product-image"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold" data-testid="product-name">
                        {product.name}
                      </h2>
                    </div>
                  </div>

                  {/* Description Card */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-3">{trans.description}</h3>
                      <Tabs value={descriptionLang} onValueChange={(v) => setDescriptionLang(v as Language)}>
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="ar">العربية</TabsTrigger>
                          <TabsTrigger value="en">English</TabsTrigger>
                          <TabsTrigger value="fr">Français</TabsTrigger>
                        </TabsList>
                        <TabsContent value="ar" className="mt-3">
                          <p className="text-sm text-right whitespace-pre-wrap" dir="rtl" data-testid="desc-ar">
                            {product.descriptions.ar}
                          </p>
                        </TabsContent>
                        <TabsContent value="en" className="mt-3">
                          <p className="text-sm whitespace-pre-wrap" data-testid="desc-en">
                            {product.descriptions.en}
                          </p>
                        </TabsContent>
                        <TabsContent value="fr" className="mt-3">
                          <p className="text-sm whitespace-pre-wrap" data-testid="desc-fr">
                            {product.descriptions.fr}
                          </p>
                        </TabsContent>
                      </Tabs>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button onClick={downloadImage} size="sm" variant="outline" className="flex-1" data-testid="button-download-image">
                        <FileDown className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                        {language === "ar" ? "تحميل الصورة" : language === "fr" ? "Télécharger l'image" : "Download Image"}
                      </Button>
                      <Button onClick={copyProductInfo} size="sm" variant="outline" className="flex-1" data-testid="button-copy">
                        <Copy className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                        {trans.copyInfo}
                      </Button>
                      <Button onClick={downloadProductPDF} size="sm" variant="outline" className="flex-1" data-testid="button-pdf">
                        <FileDown className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                        {language === "ar" ? "تحميل PDF" : language === "fr" ? "Télécharger PDF" : "Download PDF"}
                      </Button>
                      <Button
                        onClick={() => {
                          setProduct(null);
                          setMessages([]);
                        }}
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        data-testid="button-new-product"
                      >
                        {trans.newProduct}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benefits Card */}
            {product.benefits && product.benefits[language]?.length > 0 && (
              <Card data-testid="card-benefits">
                <CardHeader>
                  <CardTitle className="text-lg">{trans.benefits}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2" dir={isRTL ? "rtl" : "ltr"}>
                    {product.benefits[language]?.map((benefit: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-3">
                        <span className="text-primary font-bold text-lg">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Features Card */}
            {product.features && product.features[language]?.length > 0 && (
              <Card data-testid="card-features">
                <CardHeader>
                  <CardTitle className="text-lg">{trans.features}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2" dir={isRTL ? "rtl" : "ltr"}>
                    {product.features[language]?.map((feature: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-3">
                        <span className="text-primary font-bold text-lg">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Marketing Post */}
            <Card data-testid="card-marketing">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{trans.marketingPost}</CardTitle>
                <Button
                  onClick={() => marketingMutation.mutate()}
                  disabled={marketingMutation.isPending}
                  size="sm"
                  data-testid="button-generate-marketing"
                >
                  {marketingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    trans.generateMarketing
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {marketingPost ? (
                  <>
                    {marketingImageUrl && (
                      <div className="rounded-lg overflow-hidden border">
                        <img src={marketingImageUrl} alt="Marketing post" className="w-full" />
                      </div>
                    )}
                    <div className="bg-muted p-4 rounded-lg" dir={isRTL ? "rtl" : "ltr"}>
                      <p className="text-sm whitespace-pre-wrap font-medium mb-3">{marketingPost.post}</p>
                      <div className="flex flex-wrap gap-2">
                        {marketingPost.hashtags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="border-l-4 border-primary pl-4" dir={isRTL ? "rtl" : "ltr"}>
                      <p className="text-sm font-semibold mb-2">استدعاء للعمل:</p>
                      <p className="text-sm">{marketingPost.callToAction}</p>
                    </div>
                    <div dir={isRTL ? "rtl" : "ltr"}>
                      <p className="text-sm font-semibold mb-2">نصائح للبيع:</p>
                      <ul className="space-y-1">
                        {marketingPost.salesTips.map((tip, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <span className="text-primary font-bold">→</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {marketingImageUrl && (
                        <Button
                          onClick={downloadMarketingImage}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          data-testid="button-download-marketing-image"
                        >
                          <FileDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                          {language === "ar" ? "تحميل الصورة" : language === "fr" ? "Télécharger l'image" : "Download Image"}
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          const text = `${marketingPost.post}\n\n${marketingPost.hashtags.join(" ")}\n\n${marketingPost.callToAction}`;
                          navigator.clipboard.writeText(text);
                          toast({ title: language === "ar" ? "نجاح" : language === "fr" ? "Succès" : "Success", description: "تم نسخ المنشور" });
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        data-testid="button-copy-marketing"
                      >
                        <Copy className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {language === "ar" ? "نسخ النص" : language === "fr" ? "Copier le texte" : "Copy Text"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    اضغط الزر أعلاه لإنشاء منشور إعلاني احترافي لـ Meta
                  </p>
                )}
              </CardContent>
            </Card>

            {/* AI Chat */}
            <Card className="h-96 flex flex-col" data-testid="card-chat">
              <CardHeader className="border-b">
                <CardTitle className="text-lg">AI Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                {messages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground text-center">
                      Ask AI about this product
                    </p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    data-testid={`message-${msg.role}`}
                  >
                    <div
                      className={`max-w-md px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.imageUrl && (
                        <div className="mb-2">
                          <img src={msg.imageUrl} alt="Generated" className="max-w-xs rounded" />
                          <a
                            href={msg.imageUrl}
                            download={`generated-${Date.now()}.png`}
                            className="text-xs underline mt-2 inline-block"
                          >
                            {language === "ar" ? "تحميل الصورة" : "Download"}
                          </a>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-4 py-2 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="border-t p-3 space-y-2">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder={trans.askQuestion}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={chatMutation.isPending || generatingImage}
                    data-testid="input-chat"
                    dir={isRTL ? "rtl" : "ltr"}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!chatInput.trim() || chatMutation.isPending || generatingImage}
                    data-testid="button-send"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generateImageFromChat()}
                    disabled={generatingImage}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    data-testid="button-generate-image"
                  >
                    {generatingImage ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {language === "ar" ? "جاري..." : "Generating..."}
                      </>
                    ) : (
                      language === "ar" ? "توليد صورة" : "Generate Image"
                    )}
                  </Button>
                  <Button
                    onClick={() => generateImageFromChat(chatInput || `صورة احترافية للمنتج ${product?.name}`)}
                    disabled={generatingImage}
                    size="sm"
                    variant="secondary"
                    className="flex-1"
                    data-testid="button-generate-custom-image"
                  >
                    {language === "ar" ? "توليد مخصص" : "Custom"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!product && !uploadMutation.isPending && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Upload a product image to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
