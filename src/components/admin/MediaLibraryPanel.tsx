import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";

type StorageFolder = "all" | "products" | "settings";

type MediaItem = {
  path: string;
  name: string;
  folder: "products" | "settings" | "root";
  publicUrl: string;
  createdAt?: string;
};

const BUCKET = "product-images";

function getPublicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function detectFolderFromPath(path: string): MediaItem["folder"] {
  if (path.startsWith("products/")) return "products";
  if (path.startsWith("settings/")) return "settings";
  return "root";
}

async function listFolder(folder: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } });

  if (error) throw error;
  return (data ?? [])
    .filter((o) => !!o.name && o.name !== ".emptyFolderPlaceholder")
    .filter((o) => !(o.metadata && o.metadata["isFolder"]))
    .map((o) => {
      const path = folder ? `${folder}/${o.name}` : o.name;
      return {
        path,
        name: o.name,
        folder: detectFolderFromPath(path),
        publicUrl: getPublicUrl(path),
        createdAt: (o as any).created_at,
      } satisfies MediaItem;
    });
}

export function MediaLibraryPanel() {
  const [activeFolder, setActiveFolder] = useState<StorageFolder>("all");
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);
  const [replaceTargetPath, setReplaceTargetPath] = useState<string | null>(null);

  const replaceInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = async () => {
    setIsLoading(true);
    try {
      // We know uploads currently land in these two prefixes.
      const [root, products, settings] = await Promise.all([
        listFolder(""),
        listFolder("products"),
        listFolder("settings"),
      ]);

      const merged = [...settings, ...products, ...root];
      // Deduplicate by path
      const dedup = Array.from(new Map(merged.map((i) => [i.path, i])).values());
      setItems(dedup);
    } catch (e) {
      console.error("Error fetching media:", e);
      toast.error("Failed to load media library");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => {
        if (activeFolder === "all") return true;
        return i.folder === activeFolder;
      })
      .filter((i) => (q ? i.path.toLowerCase().includes(q) : true));
  }, [items, activeFolder, query]);

  const handleDelete = async () => {
    const path = confirmDeletePath;
    if (!path) return;

    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path]);
      if (error) throw error;
      toast.success("File deleted");
      setItems((prev) => prev.filter((i) => i.path !== path));
    } catch (e) {
      console.error("Error deleting file:", e);
      toast.error("Failed to delete file");
    } finally {
      setConfirmDeletePath(null);
    }
  };

  const openReplace = (path: string) => {
    setReplaceTargetPath(path);
    // reset the input so selecting the same file twice still triggers change
    if (replaceInputRef.current) replaceInputRef.current.value = "";
    replaceInputRef.current?.click();
  };

  const handleReplace = async (file?: File) => {
    const targetPath = replaceTargetPath;
    if (!targetPath || !file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or less");
      return;
    }

    try {
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(targetPath, file, { upsert: true, contentType: file.type });
      if (error) throw error;

      toast.success("File replaced");
      const publicUrl = getPublicUrl(targetPath);
      // Force refresh in case the CDN caches aggressively
      const cacheBusted = `${publicUrl}${publicUrl.includes("?") ? "&" : "?"}t=${Date.now()}`;
      setItems((prev) => prev.map((i) => (i.path === targetPath ? { ...i, publicUrl: cacheBusted } : i)));
    } catch (e) {
      console.error("Error replacing file:", e);
      toast.error("Failed to replace file");
    } finally {
      setReplaceTargetPath(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Media Library</h3>
          </div>
          <Button variant="outline" size="icon" onClick={fetchMedia} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant={activeFolder === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFolder("all")}
            >
              All
            </Button>
            <Button
              type="button"
              variant={activeFolder === "products" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFolder("products")}
            >
              Products
            </Button>
            <Button
              type="button"
              variant={activeFolder === "settings" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFolder("settings")}
            >
              Settings
            </Button>
          </div>

          <div className="sm:ml-auto w-full sm:w-72">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by path…"
            />
          </div>
        </div>
      </div>

      {/* Hidden input used for replace */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleReplace(e.target.files?.[0])}
      />

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No files found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <div key={item.path} className="bg-card rounded-lg border overflow-hidden">
              <div className="aspect-[4/3] bg-muted">
                <img
                  src={item.publicUrl}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate" title={item.path}>
                      {item.path}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {item.folder}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => openReplace(item.path)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Replace
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setConfirmDeletePath(item.path)}
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmDeletePath} onOpenChange={() => setConfirmDeletePath(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the file from storage. Existing product/settings references may break if they still point to this URL.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
