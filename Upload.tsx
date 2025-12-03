import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, X, ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import type { Product } from "@shared/schema";

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  status: "uploading" | "analyzing" | "complete" | "error";
  progress: number;
  product?: Product;
  error?: string;
}

export default function UploadPage() {
  const { t, language, isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const errorMessages = {
    ar: {
      imageOnly: "يرجى اختيار صور فقط",
      apiKeyMissing: "مفتاح OpenAI API غير متوفر. يرجى إعداده للاستمرار.",
      uploadFailed: "فشل رفع الصورة",
      analyzed: "تم تحليل المنتج بنجاح",
    },
    en: {
      imageOnly: "Please select only images",
      apiKeyMissing: "OpenAI API key is not set. Please configure it to continue.",
      uploadFailed: "Image upload failed",
      analyzed: "Product analyzed successfully",
    },
    fr: {
      imageOnly: "Veuillez sélectionner uniquement des images",
      apiKeyMissing: "La clé API OpenAI n'est pas configurée. Veuillez la configurer pour continuer.",
      uploadFailed: "Échec du téléchargement de l'image",
      analyzed: "Produit analysé avec succès",
    },
  };

  const queueText = {
    ar: "قائمة الانتظار",
    en: "Upload Queue",
    fr: "File d'attente",
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
        throw new Error(error.message || errorMessages[language].uploadFailed);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
    },
  });

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const imageFiles = Array.from(fileList).filter((file) =>
      file.type.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      toast({
        title: t.error,
        description: errorMessages[language].imageOnly,
        variant: "destructive",
      });
      return;
    }

    const newFiles: UploadingFile[] = imageFiles.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: "uploading" as const,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (const uploadFile of newFiles) {
      try {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "analyzing" as const, progress: 50 }
              : f
          )
        );

        const product = await uploadMutation.mutateAsync(uploadFile.file);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? { ...f, status: "complete" as const, progress: 100, product }
              : f
          )
        );

        toast({
          title: t.success,
          description: `"${product.name}" - ${errorMessages[language].analyzed}`,
        });
      } catch (error: any) {
        const errorMessage = error.message.includes("OPENAI_API_KEY")
          ? errorMessages[language].apiKeyMissing
          : error.message;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: "error" as const,
                  progress: 0,
                  error: errorMessage,
                }
              : f
          )
        );

        toast({
          title: t.error,
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  }, [uploadMutation, t, language, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-upload-title">
          {t.uploadTitle}
        </h1>
        <p className="text-sm text-muted-foreground mt-1" data-testid="text-upload-subtitle">{t.uploadSubtitle}</p>
      </div>

      {/* Drop Zone */}
      <Card
        className={`border-2 border-dashed transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="dropzone-upload"
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div
            className={`p-4 rounded-full mb-4 ${
              isDragging ? "bg-primary/10" : "bg-muted"
            }`}
          >
            <UploadIcon
              className={`h-10 w-10 ${
                isDragging ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>
          <p className="text-lg font-medium mb-1" data-testid="text-drag-drop">{t.dragDrop}</p>
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-supported-formats">
            {t.supportedFormats}
          </p>
          <label>
            <Button asChild className="cursor-pointer" data-testid="button-browse-files">
              <span>
                <UploadIcon className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                {t.browseFiles}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileInput}
              data-testid="input-file-upload"
            />
          </label>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold" data-testid="text-queue-title">
            {queueText[language]}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {files.map((file) => (
              <Card key={file.id} data-testid={`card-upload-${file.id}`}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt=""
                          className="w-full h-full object-cover"
                          data-testid={`img-preview-${file.id}`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      {file.status === "analyzing" && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium truncate" data-testid={`text-file-name-${file.id}`}>
                          {file.product?.name || file.file.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 -mt-1 -mr-1"
                          onClick={() => removeFile(file.id)}
                          data-testid={`button-remove-${file.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2" data-testid={`text-file-size-${file.id}`}>
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <div className="flex items-center gap-2">
                        {file.status === "uploading" && (
                          <>
                            <Progress value={file.progress} className="h-1" />
                            <span className="text-xs text-muted-foreground">
                              {file.progress}%
                            </span>
                          </>
                        )}
                        {file.status === "analyzing" && (
                          <span className="text-xs text-primary flex items-center gap-1" data-testid={`status-analyzing-${file.id}`}>
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {t.analyzing}
                          </span>
                        )}
                        {file.status === "complete" && (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1" data-testid={`status-complete-${file.id}`}>
                            <CheckCircle className="h-3 w-3" />
                            {t.success}
                          </span>
                        )}
                        {file.status === "error" && (
                          <span className="text-xs text-destructive flex items-center gap-1" data-testid={`status-error-${file.id}`}>
                            <AlertCircle className="h-3 w-3" />
                            {file.error || t.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
