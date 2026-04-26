"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown, Folder as FolderIcon, Info, Save, Sparkles, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Folder = { id: string; name: string; color: string };
type Tag = { id: string; name: string; color: string };
type Recipe = {
  id: string;
  name: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
};

export function CreateLinkForm({
  appUrl,
  initial,
  editId,
}: {
  appUrl: string;
  initial?: Record<string, unknown>;
  editId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(editId);
  const [destinationUrl, setDestinationUrl] = useState<string>(String(initial?.destinationUrl ?? ""));
  const [customSlug, setCustomSlug] = useState<string>(String(initial?.slug ?? ""));
  const [title, setTitle] = useState<string>(String(initial?.title ?? ""));
  const [description, setDescription] = useState<string>(String(initial?.description ?? ""));
  const [password, setPassword] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>(
    initial?.expiresAt ? new Date(initial.expiresAt as number).toISOString().slice(0, 16) : "",
  );
  const [clickLimit, setClickLimit] = useState<string>(
    initial?.clickLimit != null ? String(initial.clickLimit) : "",
  );
  const [iosUrl, setIosUrl] = useState<string>(String(initial?.iosUrl ?? ""));
  const [androidUrl, setAndroidUrl] = useState<string>(String(initial?.androidUrl ?? ""));
  const utm = (initial?.utmParams ?? {}) as Record<string, string>;
  const [utmSource, setUtmSource] = useState(utm.utm_source ?? "");
  const [utmMedium, setUtmMedium] = useState(utm.utm_medium ?? "");
  const [utmCampaign, setUtmCampaign] = useState(utm.utm_campaign ?? "");
  const [utmTerm, setUtmTerm] = useState(utm.utm_term ?? "");
  const [utmContent, setUtmContent] = useState(utm.utm_content ?? "");

  // Folder & Tags
  const [folderId, setFolderId] = useState<string>(String((initial?.folderId as string) ?? ""));
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const initialTags = (initial?.tags as Tag[] | undefined) ?? [];
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");

  // UTM Recipes
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipePickerOpen, setRecipePickerOpen] = useState(false);

  const [openAdvanced, setOpenAdvanced] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setOpenAdvanced((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });

  // Load folders, tags, recipes
  useEffect(() => {
    fetch("/api/folders")
      .then((r) => r.json())
      .then((d) => setFolders(d.folders ?? []))
      .catch(() => undefined);
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []))
      .catch(() => undefined);
    fetch("/api/utm-recipes")
      .then((r) => r.json())
      .then((d) => setRecipes(d.recipes ?? []))
      .catch(() => undefined);
  }, []);

  // Init selected tags from initial
  useEffect(() => {
    if (initialTags.length > 0) {
      setSelectedTagIds(new Set(initialTags.map((t) => t.id)));
    } else if (editId) {
      // Load assigned tags for edit mode
      fetch(`/api/links/${editId}/tags`)
        .then((r) => r.json())
        .then((d) => {
          if (d.tags) setSelectedTagIds(new Set(d.tags.map((t: Tag) => t.id)));
        })
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Pre-fill UTM from ?recipe=<id> query param
  useEffect(() => {
    const recipeId = searchParams.get("recipe");
    if (recipeId && recipes.length > 0) {
      const r = recipes.find((x) => x.id === recipeId);
      if (r) {
        setOpenAdvanced((prev) => new Set([...prev, "utm"]));
        if (r.utmSource) setUtmSource(r.utmSource);
        if (r.utmMedium) setUtmMedium(r.utmMedium);
        if (r.utmCampaign) setUtmCampaign(r.utmCampaign);
        if (r.utmTerm) setUtmTerm(r.utmTerm);
        if (r.utmContent) setUtmContent(r.utmContent);
        push({ title: `Recipe '${r.name}' diterapkan`, variant: "success" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, recipes.length]);

  const applyRecipe = (r: Recipe) => {
    setUtmSource(r.utmSource ?? "");
    setUtmMedium(r.utmMedium ?? "");
    setUtmCampaign(r.utmCampaign ?? "");
    setUtmTerm(r.utmTerm ?? "");
    setUtmContent(r.utmContent ?? "");
    setRecipePickerOpen(false);
    push({ title: `Recipe '${r.name}' diterapkan`, variant: "success" });
  };

  const saveAsRecipe = async () => {
    if (!utmSource && !utmMedium && !utmCampaign) {
      push({ title: "Isi minimal source/medium/campaign dulu", variant: "danger" });
      return;
    }
    const name = window.prompt("Nama recipe:", "Recipe baru");
    if (!name?.trim()) return;
    const res = await fetch("/api/utm-recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), utmSource, utmMedium, utmCampaign, utmTerm, utmContent }),
    });
    const data = await res.json();
    if (!res.ok) {
      push({ title: "Gagal", description: data.error, variant: "danger" });
      return;
    }
    setRecipes((prev) => [...prev, data.recipe]);
    push({ title: "Recipe disimpan!", variant: "success" });
  };

  const toggleTag = (id: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const createNewTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTagName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      push({ title: "Gagal", description: data.error, variant: "danger" });
      return;
    }
    setTags((prev) => [...prev, data.tag]);
    setSelectedTagIds((prev) => new Set([...prev, data.tag.id]));
    setNewTagName("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tagIds = Array.from(selectedTagIds);
      const body: Record<string, unknown> = {
        destinationUrl,
        customSlug: customSlug || undefined,
        title: title || undefined,
        description: description || undefined,
        password: password || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : "",
        clickLimit: clickLimit ? Number(clickLimit) : "",
        iosUrl: iosUrl || "",
        androidUrl: androidUrl || "",
        utmSource: utmSource || undefined,
        utmMedium: utmMedium || undefined,
        utmCampaign: utmCampaign || undefined,
        utmTerm: utmTerm || undefined,
        utmContent: utmContent || undefined,
        folderId: folderId || null,
        tagIds: isEdit ? undefined : tagIds, // POST accepts; PATCH uses separate tags endpoint
      };
      const url = isEdit ? `/api/links/${editId}` : "/api/links";
      const method = isEdit ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        push({ title: "Gagal menyimpan", description: data.error ?? "Coba lagi.", variant: "danger" });
        return;
      }

      const id = data.link?.id ?? editId;

      // Update tags via dedicated endpoint (works for both create + edit)
      if (id && tagIds.length >= 0) {
        await fetch(`/api/links/${id}/tags`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tagIds }),
        }).catch(() => undefined);
      }

      push({ title: isEdit ? "Tersimpan!" : "Link dibuat!", variant: "success" });
      if (id) router.replace(`/dashboard/links/${id}`);
      router.refresh();
    } catch {
      push({ title: "Kesalahan jaringan", variant: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="destination">URL tujuan <span className="text-red-500">*</span></Label>
            <Input
              id="destination"
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://contoh.com/halaman-panjang"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug custom (opsional)</Label>
            <div className="flex items-center gap-2 rounded-[10px] border border-[color:var(--border)] px-3 bg-[color:var(--background)]">
              <span className="text-sm text-[color:var(--muted-foreground)] font-mono">
                {new URL(appUrl).host}/
              </span>
              <Input
                id="slug"
                value={customSlug}
                onChange={(e) => setCustomSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                placeholder="slug-kustom"
                maxLength={50}
                disabled={isEdit}
                className="border-0 bg-transparent focus-visible:ring-0 px-0 font-mono"
              />
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Kosongkan untuk slug acak. {isEdit && "Slug tidak bisa diubah setelah dibuat."}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="title">Judul (opsional)</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Deskripsi (opsional)</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── ORGANIZE: Folder + Tag ─────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FolderIcon className="h-4 w-4 text-[color:var(--primary)]" />
            Organisasi
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="folder">Folder</Label>
            <div className="flex gap-2">
              <select
                id="folder"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="flex-1 h-10 rounded-[8px] border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm"
              >
                <option value="">— Tanpa folder —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <Button asChild type="button" variant="outline" size="sm">
                <Link href="/dashboard/folders" prefetch={false} target="_blank">
                  + Folder baru
                </Link>
              </Button>
            </div>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Folder = wadah untuk kelompokkan link berdasar project/kategori.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Tag</Label>
            <div className="flex flex-wrap gap-1.5 mb-1.5 min-h-[32px]">
              {Array.from(selectedTagIds).map((tid) => {
                const t = tags.find((x) => x.id === tid);
                if (!t) return null;
                return (
                  <span
                    key={tid}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                    style={{ background: t.color }}
                  >
                    {t.name}
                    <button type="button" onClick={() => toggleTag(tid)} aria-label="Lepas tag">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
              <button
                type="button"
                onClick={() => setTagPickerOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[color:var(--border)] px-2.5 py-1 text-xs text-[color:var(--muted-foreground)] hover:border-[color:var(--primary)]"
              >
                <TagIcon className="h-3 w-3" /> {tagPickerOpen ? "Tutup" : "+ Tag"}
              </button>
            </div>
            {tagPickerOpen && (
              <div className="rounded-[10px] border border-[color:var(--border)] p-3 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {tags.length === 0 ? (
                    <p className="text-xs text-[color:var(--muted-foreground)]">Belum ada tag.</p>
                  ) : (
                    tags.map((t) => {
                      const active = selectedTagIds.has(t.id);
                      return (
                        <button
                          type="button"
                          key={t.id}
                          onClick={() => toggleTag(t.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors",
                            active
                              ? "text-white border-transparent"
                              : "border-[color:var(--border)] text-[color:var(--foreground)]",
                          )}
                          style={active ? { background: t.color } : undefined}
                        >
                          {t.name}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-[color:var(--border)]">
                  <Input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="Nama tag baru"
                    maxLength={40}
                    className="h-8 text-xs"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        createNewTag();
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={createNewTag} disabled={!newTagName.trim()}>
                    Buat
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Tag = label berwarna lintas folder. Satu link bisa punya banyak tag untuk filtering.
            </p>
          </div>
        </CardContent>
      </Card>

      <AdvancedSection
        label="Keamanan & batas"
        open={openAdvanced.has("security")}
        onToggle={() => toggle("security")}
      >
        <div className="space-y-1.5">
          <Label htmlFor="password">Kata sandi (opsional)</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEdit ? "Biarkan kosong = tidak diubah" : "Minimal 4 karakter"}
            minLength={isEdit ? 0 : 4}
          />
          <p className="text-xs text-[color:var(--muted-foreground)]">
            Pengunjung harus mengetik kata sandi sebelum redirect.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="expiresAt">Kedaluwarsa (opsional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="clickLimit">Batas klik (opsional)</Label>
            <Input
              id="clickLimit"
              type="number"
              min={1}
              value={clickLimit}
              onChange={(e) => setClickLimit(e.target.value)}
              placeholder="misal: 1000"
            />
          </div>
        </div>
      </AdvancedSection>

      <AdvancedSection
        label="Deep link aplikasi"
        open={openAdvanced.has("deep")}
        onToggle={() => toggle("deep")}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="iosUrl">iOS URL</Label>
            <Input
              id="iosUrl"
              type="url"
              value={iosUrl}
              onChange={(e) => setIosUrl(e.target.value)}
              placeholder="https://apps.apple.com/..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="androidUrl">Android URL</Label>
            <Input
              id="androidUrl"
              type="url"
              value={androidUrl}
              onChange={(e) => setAndroidUrl(e.target.value)}
              placeholder="https://play.google.com/..."
            />
          </div>
        </div>
        <p className="text-xs text-[color:var(--muted-foreground)]">
          Pengunjung iOS/Android akan diarahkan ke URL ini; lainnya ke URL tujuan utama.
        </p>
      </AdvancedSection>

      <AdvancedSection
        label="UTM tracking parameters"
        open={openAdvanced.has("utm")}
        onToggle={() => toggle("utm")}
      >
        {/* UTM Explainer */}
        <div className="rounded-[10px] bg-[color:var(--primary)]/5 border border-[color:var(--primary)]/20 p-3 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold text-[color:var(--primary)]">
            <Info className="h-3.5 w-3.5" /> Apa itu UTM?
          </div>
          <p className="text-[color:var(--muted-foreground)] leading-relaxed">
            UTM adalah parameter tambahan di URL yang membantumu lacak <strong>dari mana visitor datang</strong>.
            Contoh saat kamu paste UTM <code className="bg-[color:var(--muted)] px-1 rounded">source=instagram</code>,
            link tujuanmu akan jadi:
          </p>
          <code className="block bg-[color:var(--muted)] p-2 rounded text-[10px] break-all">
            https://example.com?utm_source=instagram&utm_medium=social
          </code>
          <p className="text-[color:var(--muted-foreground)]">
            Lalu Google Analytics / Meta Pixel di website tujuan bisa baca: <em>"oh, visitor ini datang dari Instagram"</em>.
          </p>
        </div>

        {/* Recipe applier */}
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecipePickerOpen((o) => !o)}
            >
              <Sparkles className="h-3.5 w-3.5" /> Apply Recipe
              <ChevronDown className="h-3 w-3" />
            </Button>
            {recipePickerOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setRecipePickerOpen(false)} />
                <div className="absolute z-40 mt-1 w-64 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--card)] shadow-xl overflow-hidden">
                  <ul className="max-h-60 overflow-y-auto py-1">
                    {recipes.length === 0 ? (
                      <li className="px-3 py-2 text-xs text-[color:var(--muted-foreground)]">
                        Belum ada recipe.{" "}
                        <Link href="/dashboard/utm-recipes" className="text-[color:var(--primary)] hover:underline">
                          Buat dulu
                        </Link>
                      </li>
                    ) : (
                      recipes.map((r) => (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => applyRecipe(r)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-[color:var(--muted)]"
                          >
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-[color:var(--muted-foreground)] truncate">
                              {[r.utmSource && `src=${r.utmSource}`, r.utmMedium && `med=${r.utmMedium}`, r.utmCampaign && `cmp=${r.utmCampaign}`]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </div>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
          {(utmSource || utmMedium || utmCampaign) && (
            <Button type="button" variant="outline" size="sm" onClick={saveAsRecipe}>
              💾 Simpan sebagai Recipe
            </Button>
          )}
          <Button asChild type="button" variant="ghost" size="sm">
            <Link href="/dashboard/utm-recipes" prefetch={false} target="_blank">
              Kelola Recipes →
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="utmSource">Source</Label>
            <Input id="utmSource" value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="facebook" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utmMedium">Medium</Label>
            <Input id="utmMedium" value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="cpc" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utmCampaign">Campaign</Label>
            <Input id="utmCampaign" value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="ramadan2026" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="utmTerm">Term (opsional)</Label>
            <Input id="utmTerm" value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="kata-kunci" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="utmContent">Content (opsional)</Label>
            <Input id="utmContent" value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="banner-atas" />
          </div>
        </div>

        {/* Live preview */}
        {(utmSource || utmMedium || utmCampaign) && destinationUrl && (
          <div className="rounded-[10px] bg-[color:var(--muted)]/50 p-3 text-xs">
            <div className="text-[color:var(--muted-foreground)] mb-1 font-semibold">Pratinjau URL tujuan:</div>
            <code className="block break-all text-[color:var(--foreground)]">
              {(() => {
                try {
                  const u = new URL(destinationUrl);
                  if (utmSource) u.searchParams.set("utm_source", utmSource);
                  if (utmMedium) u.searchParams.set("utm_medium", utmMedium);
                  if (utmCampaign) u.searchParams.set("utm_campaign", utmCampaign);
                  if (utmTerm) u.searchParams.set("utm_term", utmTerm);
                  if (utmContent) u.searchParams.set("utm_content", utmContent);
                  return u.toString();
                } catch {
                  return destinationUrl;
                }
              })()}
            </code>
          </div>
        )}
      </AdvancedSection>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={loading || !destinationUrl}>
          <Save className="h-4 w-4" />
          {loading ? "Menyimpan..." : isEdit ? "Simpan perubahan" : "Buat link"}
        </Button>
      </div>
    </form>
  );
}

function AdvancedSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left font-medium text-sm hover:bg-[color:var(--muted)]/50 rounded-t-[16px]"
      >
        <span>{label}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="px-6 pb-6 space-y-4 border-t border-[color:var(--border)] pt-4">{children}</div>}
    </Card>
  );
}
