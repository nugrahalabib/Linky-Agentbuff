import { CsvImporter } from "@/components/csv-importer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ImportPage() {
  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Import CSV</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Migrasi link dari platform lain. Hingga 10.000 baris per batch.
        </p>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Format yang diharapkan</CardTitle>
          <CardDescription>
            Kolom <code>destination_url</code> wajib. Kolom lain opsional: <code>slug</code>, <code>title</code>,
            <code>description</code>, <code>password</code>, <code>expires_at</code>, <code>click_limit</code>,
            <code>ios_url</code>, <code>android_url</code>, <code>utm_source</code>, <code>utm_medium</code>,
            <code>utm_campaign</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="data:text/csv;charset=utf-8,destination_url,slug,title,password,expires_at,utm_source%0Ahttps://example.com,my-slug,Contoh,,,fb"
            download="linky-template.csv"
            className="text-sm text-[color:var(--primary)] hover:underline"
          >
            Unduh template CSV
          </a>
        </CardContent>
      </Card>
      <CsvImporter />
    </div>
  );
}
