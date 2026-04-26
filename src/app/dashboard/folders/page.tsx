import { FolderManager } from "@/components/folder-manager";
import { requireUser, ensureWorkspace } from "@/lib/auth";
import { folders } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function FoldersPage() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const all = db.select().from(folders).where(eq(folders.workspaceId, ws.id)).all();
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Folder</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Kelompokkan link ke folder warna agar mudah dikelola. Bisa bersarang 3 tingkat.
        </p>
        <div className="mt-3 rounded-[10px] bg-[color:var(--primary)]/5 border border-[color:var(--primary)]/20 p-3 text-xs text-[color:var(--muted-foreground)]">
          💡 <strong>Cara pakai:</strong> Buat folder di sini → saat bikin/edit link, pilih folder dari dropdown “Folder”. Klik nama folder di kartu link untuk lihat semua isinya.
        </div>
      </div>
      <FolderManager initial={all} />
    </div>
  );
}
