import type { Translations, Language } from "@shared/schema";

export const translations: Record<Language, Translations> = {
  ar: {
    // Navigation
    dashboard: "لوحة التحكم",
    upload: "رفع صورة",
    products: "المنتجات",
    orders: "الطلبات",
    settings: "الإعدادات",
    
    // Upload page
    uploadTitle: "رفع صور المنتجات",
    uploadSubtitle: "قم برفع صور المنتجات وسيقوم الذكاء الاصطناعي بتحليلها وإنشاء وصف كامل",
    dragDrop: "اسحب الصور هنا أو انقر للاختيار",
    browseFiles: "استعراض الملفات",
    supportedFormats: "يدعم: JPG، PNG حتى 10MB",
    analyzing: "جاري التحليل...",
    
    // Products page
    productsTitle: "مكتبة المنتجات",
    noProducts: "لا توجد منتجات بعد. قم برفع صور لبدء التحليل.",
    productName: "اسم المنتج",
    description: "الوصف",
    price: "السعر",
    category: "الفئة",
    actions: "الإجراءات",
    edit: "تعديل",
    delete: "حذف",
    viewDetails: "عرض التفاصيل",
    generatePdf: "تحميل PDF",
    copyScript: "نسخ السكربت",
    
    // Orders page
    ordersTitle: "إدارة الطلبات",
    noOrders: "لا توجد طلبات بعد",
    newOrder: "طلب جديد",
    customerName: "اسم العميل",
    customerPhone: "رقم الهاتف",
    customerAddress: "العنوان",
    customerCity: "المدينة",
    notes: "ملاحظات",
    quantity: "الكمية",
    status: "الحالة",
    pending: "قيد الانتظار",
    confirmed: "مؤكد",
    cancelled: "ملغي",
    delivered: "تم التوصيل",
    confirmationScript: "سكربت التأكيد",
    selectProduct: "اختر المنتج",
    createOrder: "إنشاء الطلب",
    orderCreated: "تم إنشاء الطلب بنجاح",
    
    // Common
    save: "حفظ",
    cancel: "إلغاء",
    search: "بحث",
    filter: "تصفية",
    export: "تصدير",
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    success: "تم بنجاح",
    arabic: "العربية",
    english: "English",
    french: "Français",
    language: "اللغة",
    date: "التاريخ",
    total: "المجموع",
    
    // PDF
    downloadPdf: "تحميل PDF",
    productDetails: "تفاصيل المنتج",
    orderDetails: "تفاصيل الطلب",
  },
  en: {
    // Navigation
    dashboard: "Dashboard",
    upload: "Upload",
    products: "Products",
    orders: "Orders",
    settings: "Settings",
    
    // Upload page
    uploadTitle: "Upload Product Photos",
    uploadSubtitle: "Upload product images and AI will analyze them to generate complete descriptions",
    dragDrop: "Drag photos here or click to browse",
    browseFiles: "Browse Files",
    supportedFormats: "Supports: JPG, PNG up to 10MB",
    analyzing: "Analyzing...",
    
    // Products page
    productsTitle: "Product Library",
    noProducts: "No products yet. Upload images to start analyzing.",
    productName: "Product Name",
    description: "Description",
    price: "Price",
    category: "Category",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    viewDetails: "View Details",
    generatePdf: "Download PDF",
    copyScript: "Copy Script",
    
    // Orders page
    ordersTitle: "Order Management",
    noOrders: "No orders yet",
    newOrder: "New Order",
    customerName: "Customer Name",
    customerPhone: "Phone Number",
    customerAddress: "Address",
    customerCity: "City",
    notes: "Notes",
    quantity: "Quantity",
    status: "Status",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    delivered: "Delivered",
    confirmationScript: "Confirmation Script",
    selectProduct: "Select Product",
    createOrder: "Create Order",
    orderCreated: "Order created successfully",
    
    // Common
    save: "Save",
    cancel: "Cancel",
    search: "Search",
    filter: "Filter",
    export: "Export",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    arabic: "العربية",
    english: "English",
    french: "Français",
    language: "Language",
    date: "Date",
    total: "Total",
    
    // PDF
    downloadPdf: "Download PDF",
    productDetails: "Product Details",
    orderDetails: "Order Details",
  },
  fr: {
    // Navigation
    dashboard: "Tableau de bord",
    upload: "Télécharger",
    products: "Produits",
    orders: "Commandes",
    settings: "Paramètres",
    
    // Upload page
    uploadTitle: "Télécharger des photos de produits",
    uploadSubtitle: "Téléchargez des images de produits et l'IA les analysera pour générer des descriptions complètes",
    dragDrop: "Glissez les photos ici ou cliquez pour parcourir",
    browseFiles: "Parcourir les fichiers",
    supportedFormats: "Formats: JPG, PNG jusqu'à 10MB",
    analyzing: "Analyse en cours...",
    
    // Products page
    productsTitle: "Bibliothèque de produits",
    noProducts: "Pas encore de produits. Téléchargez des images pour commencer l'analyse.",
    productName: "Nom du produit",
    description: "Description",
    price: "Prix",
    category: "Catégorie",
    actions: "Actions",
    edit: "Modifier",
    delete: "Supprimer",
    viewDetails: "Voir les détails",
    generatePdf: "Télécharger PDF",
    copyScript: "Copier le script",
    
    // Orders page
    ordersTitle: "Gestion des commandes",
    noOrders: "Pas encore de commandes",
    newOrder: "Nouvelle commande",
    customerName: "Nom du client",
    customerPhone: "Numéro de téléphone",
    customerAddress: "Adresse",
    customerCity: "Ville",
    notes: "Notes",
    quantity: "Quantité",
    status: "Statut",
    pending: "En attente",
    confirmed: "Confirmé",
    cancelled: "Annulé",
    delivered: "Livré",
    confirmationScript: "Script de confirmation",
    selectProduct: "Sélectionner un produit",
    createOrder: "Créer la commande",
    orderCreated: "Commande créée avec succès",
    
    // Common
    save: "Enregistrer",
    cancel: "Annuler",
    search: "Rechercher",
    filter: "Filtrer",
    export: "Exporter",
    loading: "Chargement...",
    error: "Une erreur s'est produite",
    success: "Succès",
    arabic: "العربية",
    english: "English",
    french: "Français",
    language: "Langue",
    date: "Date",
    total: "Total",
    
    // PDF
    downloadPdf: "Télécharger PDF",
    productDetails: "Détails du produit",
    orderDetails: "Détails de la commande",
  },
};

export function getTranslation(lang: Language): Translations {
  return translations[lang];
}

export function isRTL(lang: Language): boolean {
  return lang === "ar";
}
