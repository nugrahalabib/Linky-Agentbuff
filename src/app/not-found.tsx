import Link from "next/link";
import { SearchX } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex"><Logo /></Link>
        </div>
        <Card>
          <CardContent className="pt-8 pb-6 text-center">
            <div className="inline-flex h-12 w-12 rounded-full bg-[color:var(--muted)] text-[color:var(--muted-foreground)] items-center justify-center">
              <SearchX className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-xl font-semibold">Link tidak ditemukan.</h1>
            <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">
              Link yang kamu cari sepertinya tidak ada — atau sudah dihapus.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/">Kembali ke beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
