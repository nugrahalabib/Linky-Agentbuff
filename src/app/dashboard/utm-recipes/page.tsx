import { UtmRecipeManager } from "@/components/utm-recipe-manager";
import { requireUser, ensureWorkspace } from "@/lib/auth";
import { utmRecipes } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";

export default async function UtmRecipesPage() {
  const user = await requireUser();
  const ws = await ensureWorkspace(user.id);
  const all = db.select().from(utmRecipes).where(eq(utmRecipes.workspaceId, ws.id)).all();
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">UTM Recipes</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Simpan kombinasi UTM yang sering dipakai. Bisa di-apply sekali klik saat buat link.
        </p>
      </div>
      <UtmRecipeManager initial={all} />
    </div>
  );
}
