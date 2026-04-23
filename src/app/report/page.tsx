import { ReportForm } from "@/components/report-form";
import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ slug?: string }> }) {
  const sp = await searchParams;
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex"><Logo /></Link>
        </div>
        <Card>
          <CardContent className="pt-8 pb-6">
            <h1 className="text-2xl font-bold tracking-tight">Laporkan link</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Bantu kami menjaga Linky bersih dari phishing, spam, dan konten ilegal.
            </p>
            <ReportForm initialSlug={sp.slug ?? ""} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
