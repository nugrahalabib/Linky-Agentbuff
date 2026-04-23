import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QrStudio } from "@/components/qr-studio";

export default function QrStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string; text?: string }>;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:1709";
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Studio QR</h1>
        <p className="text-sm text-[color:var(--muted-foreground)] mt-1">
          Buat QR code dengan warna yang cocok dengan brandmu. Unduh PNG atau SVG, scan dari mana saja.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Desainer QR</CardTitle>
          <CardDescription>Ubah warna, ukuran, dan teks di panel kanan.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="h-64">Memuat...</div>}>
            <QrStudioFromParams appUrl={appUrl} searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

async function QrStudioFromParams({
  appUrl,
  searchParams,
}: {
  appUrl: string;
  searchParams: Promise<{ slug?: string; text?: string }>;
}) {
  const { slug, text } = await searchParams;
  const resolved = text || (slug ? `${appUrl}/${slug}` : appUrl);
  return <QrStudio text={resolved} />;
}
