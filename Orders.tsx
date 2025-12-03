import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  ShoppingCart,
  Phone,
  MapPin,
  Copy,
  FileDown,
  Eye,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Order, InsertOrder, Language } from "@shared/schema";

export default function OrdersPage() {
  const { t, language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const preselectedProductId = urlParams.get("product");

  const messages = {
    ar: {
      orderCount: "طلب",
      all: "الكل",
      noResults: "لا توجد نتائج",
      createPrompt: "قم بإنشاء طلب جديد للبدء",
      statusUpdated: "تم تحديث الحالة",
      copied: "تم نسخ السكربت",
      pdfDownloaded: "تم تحميل الـ PDF",
      pdfFailed: "فشل تحميل الـ PDF",
      createFailed: "فشل إنشاء الطلب",
    },
    en: {
      orderCount: "orders",
      all: "All",
      noResults: "No results found",
      createPrompt: "Create a new order to get started",
      statusUpdated: "Status updated",
      copied: "Script copied to clipboard",
      pdfDownloaded: "PDF downloaded successfully",
      pdfFailed: "Failed to download PDF",
      createFailed: "Failed to create order",
    },
    fr: {
      orderCount: "commandes",
      all: "Tout",
      noResults: "Aucun résultat trouvé",
      createPrompt: "Créez une nouvelle commande pour commencer",
      statusUpdated: "Statut mis à jour",
      copied: "Script copié dans le presse-papiers",
      pdfDownloaded: "PDF téléchargé avec succès",
      pdfFailed: "Échec du téléchargement du PDF",
      createFailed: "Échec de la création de la commande",
    },
  };

  const msg = messages[language];

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertOrder) => {
      return apiRequest<Order>("POST", "/api/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setIsCreateOpen(false);
      toast({
        title: t.success,
        description: t.orderCreated,
      });
    },
    onError: () => {
      toast({
        title: t.error,
        description: msg.createFailed,
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: t.success,
        description: msg.statusUpdated,
      });
    },
  });

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const copyScript = (order: Order) => {
    if (order.confirmationScript) {
      navigator.clipboard.writeText(order.confirmationScript);
      toast({
        title: t.success,
        description: msg.copied,
      });
    }
  };

  const downloadOrderPDF = async (order: Order) => {
    try {
      const response = await fetch(`/api/orders/${order.id}/pdf?lang=${language}`);
      if (!response.ok) throw new Error("PDF generation failed");
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `order-${order.id}.html`;
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      delivered: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return colors[status] || colors.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t.pending,
      confirmed: t.confirmed,
      cancelled: t.cancelled,
      delivered: t.delivered,
    };
    return labels[status] || status;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-orders-title">
            {t.ordersTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-orders-count">
            {orders?.length || 0} {msg.orderCount}
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-order">
              <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.newOrder}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle data-testid="dialog-new-order-title">{t.newOrder}</DialogTitle>
            </DialogHeader>
            <CreateOrderForm
              products={products || []}
              preselectedProductId={preselectedProductId}
              onSubmit={(data) => createMutation.mutate(data)}
              isSubmitting={createMutation.isPending}
              t={t}
              language={language}
              isRTL={isRTL}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
          <Input
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={isRTL ? "pr-10" : "pl-10"}
            data-testid="input-search-orders"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder={t.status} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="filter-all">{msg.all}</SelectItem>
            <SelectItem value="pending" data-testid="filter-pending">{t.pending}</SelectItem>
            <SelectItem value="confirmed" data-testid="filter-confirmed">{t.confirmed}</SelectItem>
            <SelectItem value="cancelled" data-testid="filter-cancelled">{t.cancelled}</SelectItem>
            <SelectItem value="delivered" data-testid="filter-delivered">{t.delivered}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/6" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredOrders && filteredOrders.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead data-testid="th-customer-name">{t.customerName}</TableHead>
                    <TableHead data-testid="th-customer-phone">{t.customerPhone}</TableHead>
                    <TableHead data-testid="th-customer-city">{t.customerCity}</TableHead>
                    <TableHead data-testid="th-quantity">{t.quantity}</TableHead>
                    <TableHead data-testid="th-status">{t.status}</TableHead>
                    <TableHead data-testid="th-date">{t.date}</TableHead>
                    <TableHead className="text-right" data-testid="th-actions">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                      <TableCell className="font-medium" data-testid={`cell-name-${order.id}`}>
                        {order.customerName}
                      </TableCell>
                      <TableCell data-testid={`cell-phone-${order.id}`}>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {order.customerPhone}
                        </div>
                      </TableCell>
                      <TableCell data-testid={`cell-city-${order.id}`}>
                        {order.customerCity && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            {order.customerCity}
                          </div>
                        )}
                      </TableCell>
                      <TableCell data-testid={`cell-quantity-${order.id}`}>{order.quantity}</TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(status) =>
                            updateStatusMutation.mutate({ id: order.id, status })
                          }
                        >
                          <SelectTrigger className="w-[130px] h-8" data-testid={`select-status-${order.id}`}>
                            <Badge className={`${getStatusColor(order.status)} border-0`}>
                              {getStatusLabel(order.status)}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">{t.pending}</SelectItem>
                            <SelectItem value="confirmed">{t.confirmed}</SelectItem>
                            <SelectItem value="cancelled">{t.cancelled}</SelectItem>
                            <SelectItem value="delivered">{t.delivered}</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell data-testid={`cell-date-${order.id}`}>
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString(
                              language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : "en-US"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedOrder(order)}
                            data-testid={`button-view-order-${order.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyScript(order)}
                            disabled={!order.confirmationScript}
                            data-testid={`button-copy-script-${order.id}`}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadOrderPDF(order)}
                            data-testid={`button-pdf-order-${order.id}`}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2" data-testid="text-empty-orders-title">
            {searchTerm || statusFilter !== "all" ? msg.noResults : t.noOrders}
          </h3>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-empty-orders-prompt">
            {msg.createPrompt}
          </p>
          <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-order">
            <Plus className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
            {t.newOrder}
          </Button>
        </div>
      )}

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle data-testid="dialog-order-title">{t.orderDetails}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{t.customerName}</p>
                    <p className="font-medium" data-testid="dialog-customer-name">{selectedOrder.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.customerPhone}</p>
                    <p className="font-medium" data-testid="dialog-customer-phone">{selectedOrder.customerPhone}</p>
                  </div>
                  {selectedOrder.customerCity && (
                    <div>
                      <p className="text-sm text-muted-foreground">{t.customerCity}</p>
                      <p className="font-medium" data-testid="dialog-customer-city">{selectedOrder.customerCity}</p>
                    </div>
                  )}
                  {selectedOrder.customerAddress && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">{t.customerAddress}</p>
                      <p className="font-medium" data-testid="dialog-customer-address">{selectedOrder.customerAddress}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">{t.quantity}</p>
                    <p className="font-medium" data-testid="dialog-quantity">{selectedOrder.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.status}</p>
                    <Badge className={`${getStatusColor(selectedOrder.status)} border-0`} data-testid="dialog-status">
                      {getStatusLabel(selectedOrder.status)}
                    </Badge>
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">{t.notes}</p>
                    <p className="font-medium" data-testid="dialog-notes">{selectedOrder.notes}</p>
                  </div>
                )}
                {selectedOrder.confirmationScript && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">{t.confirmationScript}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyScript(selectedOrder)}
                        data-testid="dialog-button-copy-script"
                      >
                        <Copy className={`h-4 w-4 ${isRTL ? "ml-1" : "mr-1"}`} />
                        {t.copyScript}
                      </Button>
                    </div>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <pre className="text-sm whitespace-pre-wrap font-sans" dir={selectedOrder.language === "ar" ? "rtl" : "ltr"} data-testid="dialog-script-content">
                          {selectedOrder.confirmationScript}
                        </pre>
                      </CardContent>
                    </Card>
                  </div>
                )}
                <div className="flex gap-2 pt-4 flex-wrap">
                  <Button
                    onClick={() => copyScript(selectedOrder)}
                    disabled={!selectedOrder.confirmationScript}
                    className="flex-1"
                    data-testid="dialog-button-copy"
                  >
                    <Copy className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.copyScript}
                  </Button>
                  <Button
                    onClick={() => downloadOrderPDF(selectedOrder)}
                    variant="outline"
                    className="flex-1"
                    data-testid="dialog-button-pdf"
                  >
                    <FileDown className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                    {t.downloadPdf}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CreateOrderFormProps {
  products: Product[];
  preselectedProductId: string | null;
  onSubmit: (data: InsertOrder) => void;
  isSubmitting: boolean;
  t: any;
  language: Language;
  isRTL: boolean;
}

function CreateOrderForm({
  products,
  preselectedProductId,
  onSubmit,
  isSubmitting,
  t,
  language,
  isRTL,
}: CreateOrderFormProps) {
  const [formData, setFormData] = useState<InsertOrder>({
    productId: preselectedProductId || "",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    customerCity: "",
    notes: "",
    quantity: 1,
    status: "pending",
    language: language,
  });

  useEffect(() => {
    if (preselectedProductId) {
      setFormData((prev) => ({ ...prev, productId: preselectedProductId }));
    }
  }, [preselectedProductId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectedProduct = products.find((p) => p.id === formData.productId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-create-order">
      <div className="space-y-2">
        <Label htmlFor="product">{t.selectProduct} *</Label>
        <Select
          value={formData.productId}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, productId: value }))
          }
        >
          <SelectTrigger data-testid="select-product">
            <SelectValue placeholder={t.selectProduct} />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product.id} value={product.id} data-testid={`option-product-${product.id}`}>
                <div className="flex items-center gap-2">
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="h-6 w-6 rounded object-cover"
                  />
                  {product.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProduct && (
        <Card className="bg-muted/50">
          <CardContent className="p-3 flex items-center gap-3">
            <img
              src={selectedProduct.imageUrl}
              alt=""
              className="h-12 w-12 rounded object-cover"
              data-testid="selected-product-image"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate" data-testid="selected-product-name">{selectedProduct.name}</p>
              {selectedProduct.price && (
                <p className="text-sm text-muted-foreground" data-testid="selected-product-price">{selectedProduct.price}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerName">{t.customerName} *</Label>
          <Input
            id="customerName"
            value={formData.customerName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, customerName: e.target.value }))
            }
            required
            data-testid="input-customer-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">{t.customerPhone} *</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={formData.customerPhone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))
            }
            required
            data-testid="input-customer-phone"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerCity">{t.customerCity}</Label>
          <Input
            id="customerCity"
            value={formData.customerCity || ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, customerCity: e.target.value }))
            }
            data-testid="input-customer-city"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantity">{t.quantity}</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                quantity: parseInt(e.target.value) || 1,
              }))
            }
            data-testid="input-quantity"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customerAddress">{t.customerAddress}</Label>
        <Input
          id="customerAddress"
          value={formData.customerAddress || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, customerAddress: e.target.value }))
          }
          data-testid="input-customer-address"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{t.notes}</Label>
        <Textarea
          id="notes"
          value={formData.notes || ""}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, notes: e.target.value }))
          }
          rows={3}
          data-testid="input-notes"
        />
      </div>

      <div className="space-y-2">
        <Label>{t.language}</Label>
        <Select
          value={formData.language}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, language: value }))
          }
        >
          <SelectTrigger data-testid="select-language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ar" data-testid="option-lang-ar">{t.arabic}</SelectItem>
            <SelectItem value="en" data-testid="option-lang-en">{t.english}</SelectItem>
            <SelectItem value="fr" data-testid="option-lang-fr">{t.french}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          className="flex-1"
          disabled={!formData.productId || !formData.customerName || !formData.customerPhone || isSubmitting}
          data-testid="button-create-order"
        >
          {isSubmitting ? t.loading : t.createOrder}
        </Button>
      </div>
    </form>
  );
}
