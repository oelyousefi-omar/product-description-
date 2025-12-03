import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import {
  Search,
  Package,
  Upload,
  Eye,
  Trash2,
  FileDown,
  Copy,
  ShoppingCart,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Language } from "@shared/schema";

interface UploadingFile {
  id: string;
  file: File;
  status: "uploading" | "analyzing" | "complete" | "error";
  product?: Product;
  error?: string;
}

export default function ProductsPage() {
  const { t, language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [descriptionLang, setDescriptionLang] = useState<Language>(language);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const messages = {
    ar: {
      productCount: "منتج",
      noResults: "لا توجد نتائج",
      uploadPrompt: "قم برفع صور المنتجات لبدء التحليل",
      deleteTitle: "حذف المنتج؟",
      deleteMessage: (name: string) => `هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع عن هذا الإجراء.`,
      deleted: "تم حذف المنتج بنجاح",
      deleteFailed: "فشل حذف المنتج",
      copied: "تم نسخ السكربت",
      pdfDownloaded: "تم تحميل الـ PDF",
      pdfFailed: "فشل تحميل الـ PDF",
    },
    en: {
      productCount: "products",
      noResults: "No results found",
      uploadPrompt: "Upload product images to start analyzing",
      deleteTitle: "Delete product?",
      deleteMessage: (name: string) => `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      deleted: "Product deleted successfully",
      deleteFailed: "Failed to delete product",
      copied: "Script copied to clipboard",
      pdfDownloaded: "PDF downloaded successfully",
      pdfFailed: "Failed to download PDF",
    },
    fr: {
      productCount: "produits",
      noResults: "Aucun résultat trouvé",
      uploadPrompt: "Téléchargez des images de produits pour commencer l'analyse",
      deleteTitle: "Supprimer le produit?",
      deleteMessage: (name: string) => `Êtes-vous sûr de vouloir supprimer "${name}"? Cette action est irréversible.`,
      deleted: "Produit supprimé avec succès",
      deleteFailed: "Échec de la suppression du produit",
      copied: "Script copié dans le presse-papiers",
      pdfDownloaded: "PDF téléchargé avec succès",
      pdfFailed: "Échec du téléchargement du PDF",
    },
  };

  const msg = messages[language];

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: t.success,
        description: msg.deleted,
      });
      setDeleteProduct(null);
    },
    onError: () => {
      toast({
        title: t.error,
        description: msg.deleteFailed,
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products?.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.descriptions[language]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const copyScript = (product: Product) => {
    const script = generateConfirmationScript(product, language);
    navigator.clipboard.writeText(script);
    toast({
      title: t.success,
      description: msg.copied,
    });
  };

  const downloadPDF = async (product: Product) => {
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
        description: msg.pdfDownloaded,
      });
    } catch (error) {
      toast({
        title: t.error,
        description: msg.pdfFailed,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      toast({
        title: t.error,
        description: "Please select only images",
        variant: "destructive",
      });
      return;
    }

    const newFiles: UploadingFile[] = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    for (const uploadFile of newFiles) {
      try {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "analyzing" as const }
              : f
          )
        );

        const product = await uploadMutation.mutateAsync(uploadFile.file);

        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "complete" as const, product }
              : f
          )
        );

        toast({
          title: t.success,
          description: `"${product.name}" analyzed successfully`,
        });

        setTimeout(() => {
          setUploadingFiles((prev) => prev.filter((f) => f.id !== uploadFile.id));
        }, 2000);
      } catch (error: any) {
        setUploadingFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  error: error.message,
                }
              : f
          )
        );

        toast({
          title: t.error,
          description: error.message,
          variant: "destructive",
        });
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-products-title">
            {t.productsTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-products-count">
            {products?.length || 0} {msg.productCount}
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} data-testid="button-add-product">
          <Upload className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
          {t.upload}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          data-testid="input-file-upload"
        />
      </div>

      {/* Uploading Files Status */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 rounded-md bg-muted"
              data-testid={`upload-status-${file.id}`}
            >
              <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center">
                {file.status === "uploading" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {file.status === "analyzing" && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
                {file.status === "complete" && (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                )}
                {file.status === "error" && (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.product?.name || file.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.status === "uploading" && "Uploading..."}
                  {file.status === "analyzing" && "Analyzing with AI..."}
                  {file.status === "complete" && "Done"}
                  {file.status === "error" && file.error}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
        <Input
          placeholder={t.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={isRTL ? "pr-10" : "pl-10"}
          data-testid="input-search-products"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="aspect-square rounded-md" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`}>
              <Card
                className="overflow-hidden hover-elevate h-full cursor-pointer"
                data-testid={`card-product-${product.id}`}
              >
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    data-testid={`img-product-${product.id}`}
                  />
                </div>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium truncate" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
                    {product.price && (
                      <Badge variant="secondary" className="shrink-0" data-testid={`badge-price-${product.id}`}>
                        {product.price}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-product-desc-${product.id}`}>
                    {product.descriptions[language]}
                  </p>
                  {product.category && (
                    <Badge variant="outline" className="text-xs" data-testid={`badge-category-${product.id}`}>
                      {product.category}
                    </Badge>
                  )}
                  <div className="flex gap-1 pt-2 flex-wrap">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedProduct(product)}
                    data-testid={`button-view-${product.id}`}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyScript(product)}
                    data-testid={`button-copy-${product.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadPDF(product)}
                    data-testid={`button-pdf-${product.id}`}
                  >
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    data-testid={`button-order-${product.id}`}
                  >
                    <Link href={`/orders?product=${product.id}`}>
                      <ShoppingCart className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteProduct(product)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-${product.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2" data-testid="text-empty-title">
            {searchTerm ? msg.noResults : t.noProducts}
          </h3>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-empty-prompt">
            {msg.uploadPrompt}
          </p>
          <Button asChild data-testid="button-upload-empty">
            <Link href="/upload">
              <Upload className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.upload}
            </Link>
          </Button>
        </div>
      )}

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="dialog-product-title">{selectedProduct.name}</DialogTitle>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-square rounded-md overflow-hidden bg-muted">
                  <img
                    src={selectedProduct.imageUrl}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                    data-testid="dialog-product-image"
                  />
                </div>
                <div className="space-y-4">
                  {selectedProduct.price && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.price}</p>
                      <p className="text-lg font-semibold" data-testid="dialog-product-price">{selectedProduct.price}</p>
                    </div>
                  )}
                  {selectedProduct.category && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.category}</p>
                      <Badge variant="outline" data-testid="dialog-product-category">{selectedProduct.category}</Badge>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">{t.description}</p>
                    <Tabs value={descriptionLang} onValueChange={(v) => setDescriptionLang(v as Language)}>
                      <TabsList className="grid grid-cols-3 w-full">
                        <TabsTrigger value="ar" data-testid="tab-ar">العربية</TabsTrigger>
                        <TabsTrigger value="en" data-testid="tab-en">English</TabsTrigger>
                        <TabsTrigger value="fr" data-testid="tab-fr">Français</TabsTrigger>
                      </TabsList>
                      <TabsContent value="ar" className="mt-3">
                        <p className="text-sm text-right" dir="rtl" data-testid="dialog-desc-ar">
                          {selectedProduct.descriptions.ar}
                        </p>
                      </TabsContent>
                      <TabsContent value="en" className="mt-3">
                        <p className="text-sm" data-testid="dialog-desc-en">
                          {selectedProduct.descriptions.en}
                        </p>
                      </TabsContent>
                      <TabsContent value="fr" className="mt-3">
                        <p className="text-sm" data-testid="dialog-desc-fr">
                          {selectedProduct.descriptions.fr}
                        </p>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <div className="flex gap-2 pt-4 flex-wrap">
                    <Button onClick={() => copyScript(selectedProduct)} className="flex-1" data-testid="dialog-button-copy">
                      <Copy className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t.copyScript}
                    </Button>
                    <Button onClick={() => downloadPDF(selectedProduct)} variant="outline" className="flex-1" data-testid="dialog-button-pdf">
                      <FileDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                      {t.generatePdf}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="dialog-delete-title">
              {msg.deleteTitle}
            </AlertDialogTitle>
            <AlertDialogDescription data-testid="dialog-delete-message">
              {deleteProduct && msg.deleteMessage(deleteProduct.name)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProduct && deleteMutation.mutate(deleteProduct.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function generateConfirmationScript(product: Product, lang: Language): string {
  const scripts = {
    ar: `
السلام عليكم،

أشكرك على اهتمامك بمنتجنا "${product.name}".

تفاصيل المنتج:
${product.descriptions.ar}

${product.price ? `السعر: ${product.price}` : ""}

هل تريد تأكيد الطلب؟

نحن في انتظار ردك.
    `.trim(),
    en: `
Hello,

Thank you for your interest in our product "${product.name}".

Product Details:
${product.descriptions.en}

${product.price ? `Price: ${product.price}` : ""}

Would you like to confirm your order?

We look forward to hearing from you.
    `.trim(),
    fr: `
Bonjour,

Merci pour votre intérêt pour notre produit "${product.name}".

Détails du produit:
${product.descriptions.fr}

${product.price ? `Prix: ${product.price}` : ""}

Souhaitez-vous confirmer votre commande?

Nous attendons votre réponse.
    `.trim(),
  };

  return scripts[lang];
}
