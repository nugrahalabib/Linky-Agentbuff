import { CreateLinkForm } from "@/components/create-link-form";

export default function NewLinkPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Buat link baru</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Tempel URL tujuan dan atur opsi kustomisasi. Semua bisa diubah nanti.
        </p>
      </div>
      <CreateLinkForm appUrl={appUrl} />
    </div>
  );
}
