import { CsvImporter } from "@/components/csv-importer";
import { ProviderGuide } from "@/components/provider-guide";

export default function ImportPage() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Migrasi & Import CSV</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Pindahkan link dari Bit.ly, Rebrandly, TinyURL, Dub.co, Short.io — hingga 10.000 baris per batch.
          Auto-detect format, mapping kolom interaktif, parse tags, conflict handling.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <CsvImporter />
        <ProviderGuide />
      </div>
    </div>
  );
}
