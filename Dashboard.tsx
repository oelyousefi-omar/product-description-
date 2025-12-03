import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Upload, Package, ShoppingCart, TrendingUp, Clock, CheckCircle } from "lucide-react";
import type { Product, Order } from "@shared/schema";

export default function Dashboard() {
  const { t, language, isRTL } = useLanguage();

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
  const confirmedOrders = orders?.filter((o) => o.status === "confirmed").length || 0;
  const totalProducts = products?.length || 0;
  const recentProducts = products?.slice(0, 4) || [];

  const welcomeText = {
    ar: "مرحباً بك في لوحة تحكم المنتجات",
    en: "Welcome to your product dashboard",
    fr: "Bienvenue dans votre tableau de bord produits",
  };

  const viewAllText = {
    ar: "عرض الكل",
    en: "View all",
    fr: "Voir tout",
  };

  const stats = [
    {
      title: t.products,
      value: totalProducts,
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: t.pending,
      value: pendingOrders,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: t.confirmed,
      value: confirmedOrders,
      icon: CheckCircle,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: t.total,
      value: orders?.length || 0,
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-dashboard-title">
            {t.dashboard}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="text-dashboard-subtitle">
            {welcomeText[language]}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button asChild data-testid="button-quick-upload">
            <Link href="/upload">
              <Upload className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.upload}
            </Link>
          </Button>
          <Button variant="outline" asChild data-testid="button-new-order">
            <Link href="/orders">
              <ShoppingCart className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
              {t.newOrder}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} data-testid={`card-stat-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  {productsLoading || ordersLoading ? (
                    <Skeleton className="h-7 w-12" />
                  ) : (
                    <p className="text-2xl font-semibold" data-testid={`text-stat-value-${index}`}>{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">{t.products}</CardTitle>
          <Button variant="ghost" size="sm" asChild data-testid="link-view-all-products">
            <Link href="/products">
              {viewAllText[language]}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {productsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : recentProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recentProducts.map((product) => (
                <Link key={product.id} href="/products">
                  <div
                    className="group cursor-pointer"
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <h3 className="text-sm font-medium truncate" data-testid={`text-product-name-${product.id}`}>{product.name}</h3>
                    {product.price && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-product-price-${product.id}`}>{product.price}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-products">{t.noProducts}</p>
              <Button className="mt-4" asChild data-testid="button-upload-first">
                <Link href="/upload">
                  <Upload className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.upload}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
          <CardTitle className="text-lg">{t.orders}</CardTitle>
          <Button variant="ghost" size="sm" asChild data-testid="link-view-all-orders">
            <Link href="/orders">
              {viewAllText[language]}
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center gap-4 p-3 rounded-md hover-elevate"
                  data-testid={`row-order-${order.id}`}
                >
                  <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" data-testid={`text-order-customer-${order.id}`}>{order.customerName}</p>
                    <p className="text-xs text-muted-foreground" data-testid={`text-order-phone-${order.id}`}>{order.customerPhone}</p>
                  </div>
                  <StatusBadge status={order.status} t={t} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground" data-testid="text-no-orders">{t.noOrders}</p>
              <Button className="mt-4" asChild data-testid="button-create-first-order">
                <Link href="/orders">
                  <ShoppingCart className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                  {t.newOrder}
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status, t }: { status: string; t: any }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    pending: {
      label: t.pending,
      className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
    confirmed: {
      label: t.confirmed,
      className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    cancelled: {
      label: t.cancelled,
      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    },
    delivered: {
      label: t.delivered,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${config.className}`} data-testid={`badge-status-${status}`}>
      {config.label}
    </span>
  );
}
