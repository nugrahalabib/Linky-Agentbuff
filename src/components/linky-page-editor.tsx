"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpDown, Eye, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import type { LinkyPage, LinkyPageBlock, LinkyPageTheme } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { LinkyPageRenderer } from "@/components/linky-page-renderer";
import { useToast } from "@/components/ui/toast";

const BLOCK_TYPES: Array<{ kind: LinkyPageBlock["kind"]; label: string }> = [
  { kind: "header", label: "Header" },
  { kind: "link", label: "Link" },
  { kind: "social", label: "Social" },
  { kind: "text", label: "Text" },
  { kind: "divider", label: "Divider" },
  { kind: "youtube", label: "YouTube" },
  { kind: "image", label: "Image" },
  { kind: "countdown", label: "Countdown" },
];

const PRESETS = ["creator", "minimal", "neon", "student", "umkm"] as const;

export function LinkyPageEditor({ page, appUrl }: { page: LinkyPage; appUrl: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [title, setTitle] = useState(page.title);
  const [bio, setBio] = useState(page.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(page.avatarUrl ?? "");
  const [theme, setTheme] = useState<LinkyPageTheme>((page.theme as LinkyPageTheme | null) ?? { preset: "creator", primary: "#4F46E5", buttonStyle: "filled", font: "inter" });
  const [blocks, setBlocks] = useState<LinkyPageBlock[]>((page.blocks as LinkyPageBlock[]) ?? []);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDirty(true);
  }, [title, bio, avatarUrl, theme, blocks]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/linky-pages/${page.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, bio, avatarUrl, theme, blocks }),
      });
      if (res.ok) {
        setDirty(false);
        push({ title: "Tersimpan", variant: "success" });
        router.refresh();
      } else {
        push({ title: "Gagal simpan", variant: "danger" });
      }
    } finally {
      setSaving(false);
    }
  };

  const publicUrl = useMemo(() => `${appUrl}/@${page.slug}`, [appUrl, page.slug]);

  const addBlock = (kind: LinkyPageBlock["kind"]) => {
    const defaults: Record<string, Record<string, unknown>> = {
      header: {},
      link: { label: "Link baru", url: "https://" },
      social: { items: [] },
      text: { content: "Teks di sini" },
      divider: {},
      youtube: { videoId: "" },
      image: { url: "" },
      countdown: { target: new Date(Date.now() + 86400000).toISOString(), label: "Akhir promo" },
    };
    const id = `b${Date.now().toString(36)}`;
    setBlocks([...blocks, { id, kind, data: defaults[kind] ?? {} }]);
  };

  const updateBlock = (id: string, data: Record<string, unknown>) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, data: { ...b.data, ...data } } : b)));
  };

  const removeBlock = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));

  const move = (id: string, dir: -1 | 1) => {
    const i = blocks.findIndex((b) => b.id === id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/dashboard/pages">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Edit Linky Page</h1>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-[color:var(--primary)] hover:underline"
          >
            {publicUrl}
          </a>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={publicUrl} target="_blank" prefetch={false}>
              <Eye className="h-4 w-4" /> Preview
            </Link>
          </Button>
          <Button onClick={save} disabled={!dirty || saving} variant="gradient">
            <Save className="h-4 w-4" /> {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Inspector / Editor */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Profil</h2>
              <div className="space-y-1.5">
                <Label>Judul</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} />
              </div>
              <div className="space-y-1.5">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>Avatar URL (opsional)</Label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Tema</h2>
              <div>
                <Label className="mb-2 block">Preset</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setTheme({ ...theme, preset: p })}
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                        theme.preset === p
                          ? "bg-[color:var(--primary)] text-white border-[color:var(--primary)]"
                          : "border-[color:var(--border)]"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Warna utama</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primary ?? "#4F46E5"}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    className="h-10 w-12 rounded-[8px] border border-[color:var(--border)] cursor-pointer"
                  />
                  <Input
                    value={theme.primary ?? "#4F46E5"}
                    onChange={(e) => setTheme({ ...theme, primary: e.target.value })}
                    maxLength={7}
                    className="font-mono"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Gaya tombol</Label>
                <div className="flex flex-wrap gap-2">
                  {(["filled", "outline", "soft", "glass"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setTheme({ ...theme, buttonStyle: s })}
                      className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${
                        theme.buttonStyle === s
                          ? "bg-[color:var(--primary)] text-white border-[color:var(--primary)]"
                          : "border-[color:var(--border)]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Blok</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {BLOCK_TYPES.map((b) => (
                  <Button key={b.kind} size="sm" variant="outline" onClick={() => addBlock(b.kind)}>
                    <Plus className="h-3 w-3" /> {b.label}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                {blocks.length === 0 && (
                  <p className="text-sm text-[color:var(--muted-foreground)]">Belum ada blok. Tambah dari tombol di atas.</p>
                )}
                {blocks.map((b, i) => (
                  <BlockEditor
                    key={b.id}
                    block={b}
                    onUpdate={(data) => updateBlock(b.id, data)}
                    onRemove={() => removeBlock(b.id)}
                    onMoveUp={i > 0 ? () => move(b.id, -1) : undefined}
                    onMoveDown={i < blocks.length - 1 ? () => move(b.id, 1) : undefined}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-[24px] border-4 border-[color:var(--foreground)]/80 overflow-hidden bg-black max-w-[340px] mx-auto">
            <div className="h-5 bg-black flex items-center justify-center">
              <div className="h-1 w-12 rounded-full bg-white/30" />
            </div>
            <div className="bg-[color:var(--background)] max-h-[70vh] overflow-y-auto">
              <div className="scale-[0.75] origin-top">
                <LinkyPageRenderer
                  pageId="preview"
                  title={title}
                  bio={bio || null}
                  avatarUrl={avatarUrl || null}
                  theme={theme}
                  background={null}
                  blocks={blocks}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockEditor({
  block,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  block: LinkyPageBlock;
  onUpdate: (data: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}) {
  const d = block.data as Record<string, unknown>;
  return (
    <div className="rounded-[10px] border border-[color:var(--border)] p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          {block.kind}
        </div>
        <div className="flex gap-1">
          {onMoveUp && (
            <button onClick={onMoveUp} className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]" aria-label="Pindah ke atas">
              <ArrowUpDown className="h-3.5 w-3.5 rotate-180" />
            </button>
          )}
          {onMoveDown && (
            <button onClick={onMoveDown} className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]" aria-label="Pindah ke bawah">
              <ArrowUpDown className="h-3.5 w-3.5" />
            </button>
          )}
          <button onClick={onRemove} className="text-[color:var(--danger)]" aria-label="Hapus blok">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {block.kind === "link" && (
        <div className="grid gap-2">
          <Input placeholder="Label" value={String(d.label ?? "")} onChange={(e) => onUpdate({ label: e.target.value })} />
          <Input placeholder="https://..." value={String(d.url ?? "")} onChange={(e) => onUpdate({ url: e.target.value })} />
          <Input placeholder="Emoji (opsional) 🔗" value={String(d.emoji ?? "")} onChange={(e) => onUpdate({ emoji: e.target.value })} maxLength={4} />
        </div>
      )}
      {block.kind === "text" && (
        <Textarea value={String(d.content ?? "")} onChange={(e) => onUpdate({ content: e.target.value })} rows={2} maxLength={400} />
      )}
      {block.kind === "youtube" && (
        <Input
          placeholder="Video ID (contoh: dQw4w9WgXcQ)"
          value={String(d.videoId ?? "")}
          onChange={(e) => onUpdate({ videoId: e.target.value })}
          maxLength={20}
        />
      )}
      {block.kind === "image" && (
        <Input
          placeholder="https://image-url.jpg"
          value={String(d.url ?? "")}
          onChange={(e) => onUpdate({ url: e.target.value })}
        />
      )}
      {block.kind === "countdown" && (
        <div className="grid gap-2">
          <Input
            type="datetime-local"
            value={
              typeof d.target === "string" ? new Date(d.target).toISOString().slice(0, 16) : ""
            }
            onChange={(e) => onUpdate({ target: e.target.value ? new Date(e.target.value).toISOString() : "" })}
          />
          <Input placeholder="Label (mis: Akhir promo)" value={String(d.label ?? "")} onChange={(e) => onUpdate({ label: e.target.value })} />
        </div>
      )}
      {block.kind === "social" && (
        <div className="text-xs text-[color:var(--muted-foreground)]">
          Tambah dari panel preset (coming soon). Edit JSON langsung jika perlu.
        </div>
      )}
      {block.kind === "header" && (
        <div className="text-xs text-[color:var(--muted-foreground)]">
          Header otomatis ambil dari Profil (judul + bio + avatar).
        </div>
      )}
      {block.kind === "divider" && (
        <div className="text-xs text-[color:var(--muted-foreground)]">Garis pemisah sederhana.</div>
      )}
    </div>
  );
}
