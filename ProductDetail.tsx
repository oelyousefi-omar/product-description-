import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Send, FileDown, Copy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ProductDetail() {
  const { t, language, isRTL } = useLanguage();
  const { toast } = useToast();
  const [, params] = useRoute("/product/:id");
  const [, navigate] = useLocation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const productId = params?.id;

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      return response.json();
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest<{ answer: string }>(
        "POST",
        `/api/products/${productId}/chat`,
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
          timestamp: new Date(),
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate(input);
    setInput("");
  };

  const copyDescription = () => {
    if (product) {
      navigator.clipboard.writeText(product.descriptions[language]);
      toast({
        title: t.success,
        description: "Description copied to clipboard",
      });
    }
  };

  const downloadPDF = async () => {
    try {
      const response = await fetch(`/api/products/${productId}/pdf?lang=${language}`);
      if (!response.ok) throw new Error("PDF generation failed");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${product?.name}.html`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: t.success,
        description: "PDF downloaded successfully",
      });
    } catch (error) {
      toast({
        title: t.error,
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Product not found</p>
        <Button variant="outline" onClick={() => navigate("/products")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  const translations = {
    ar: {
      back: "العودة",
      description: "الوصف",
      chat: "الدردشة",
      askQuestion: "اسأل سؤال عن المنتج...",
      send: "إرسال",
      copyDescription: "نسخ الوصف",
      downloadPDF: "تحميل PDF",
      askAboutProduct: "اسأل AI عن أي شيء متعلق بهذا المنتج",
    },
    en: {
      back: "Back",
      description: "Description",
      chat: "Chat with AI",
      askQuestion: "Ask a question about this product...",
      send: "Send",
      copyDescription: "Copy Description",
      downloadPDF: "Download PDF",
      askAboutProduct: "Ask AI about anything related to this product",
    },
    fr: {
      back: "Retour",
      description: "Description",
      chat: "Chat avec l'IA",
      askQuestion: "Posez une question sur ce produit...",
      send: "Envoyer",
      copyDescription: "Copier la description",
      downloadPDF: "Télécharger PDF",
      askAboutProduct: "Posez à l'IA une question sur ce produit",
    },
  };

  const trans = translations[language];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <Button
        variant="ghost"
        onClick={() => navigate("/products")}
        data-testid="button-back-products"
      >
        <ChevronLeft className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
        {trans.back}
      </Button>

      {/* Product Info & Chat Layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Product Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  data-testid="product-detail-image"
                />
              </div>

              <div>
                <h1 className="text-3xl font-semibold" data-testid="product-detail-name">
                  {product.name}
                </h1>
                <div className="flex flex-wrap gap-3 mt-3">
                  {product.price && (
                    <Badge variant="secondary" data-testid="product-detail-price">
                      {product.price}
                    </Badge>
                  )}
                  {product.category && (
                    <Badge variant="outline" data-testid="product-detail-category">
                      {product.category}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-wrap pt-4">
                <Button onClick={copyDescription} className="flex-1" data-testid="button-copy-desc">
                  <Copy className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {trans.copyDescription}
                </Button>
                <Button onClick={downloadPDF} variant="outline" className="flex-1" data-testid="button-download-pdf">
                  <FileDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {trans.downloadPDF}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Description Tabs */}
          <Card>
            <CardHeader>
              <CardTitle>{trans.description}</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={language}>
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="ar">العربية</TabsTrigger>
                  <TabsTrigger value="en">English</TabsTrigger>
                  <TabsTrigger value="fr">Français</TabsTrigger>
                </TabsList>
                <TabsContent value="ar" className="mt-4">
                  <p className="text-right whitespace-pre-wrap" dir="rtl" data-testid="desc-ar">
                    {product.descriptions.ar}
                  </p>
                </TabsContent>
                <TabsContent value="en" className="mt-4">
                  <p className="whitespace-pre-wrap" data-testid="desc-en">
                    {product.descriptions.en}
                  </p>
                </TabsContent>
                <TabsContent value="fr" className="mt-4">
                  <p className="whitespace-pre-wrap" data-testid="desc-fr">
                    {product.descriptions.fr}
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* AI Chat */}
        <Card className="md:col-span-1 flex flex-col h-[600px]" data-testid="card-chat">
          <CardHeader className="border-b">
            <CardTitle className="text-lg">{trans.chat}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{trans.askAboutProduct}</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-sm text-muted-foreground">{trans.askQuestion}</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`chat-message-${msg.role}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                  <p className="text-sm animate-pulse">Typing...</p>
                </div>
              </div>
            )}
          </CardContent>
          <form onSubmit={handleSendMessage} className="border-t p-4 flex gap-2">
            <Input
              placeholder={trans.askQuestion}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatMutation.isPending}
              data-testid="input-chat-question"
              className={isRTL ? "text-right" : ""}
              dir={isRTL ? "rtl" : "ltr"}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || chatMutation.isPending}
              data-testid="button-send-chat"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
