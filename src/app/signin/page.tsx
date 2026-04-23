"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex"><Logo /></Link>
        </div>
        <Card>
          <CardContent className="pt-8 pb-6">
            <h1 className="text-2xl font-bold tracking-tight">Masuk ke Linky</h1>
            <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
              Lanjutkan kelola link dan analitikmu.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Kata sandi</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="text-sm text-[color:var(--danger)]" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Memverifikasi..." : "Masuk"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-[color:var(--muted-foreground)]">
              Belum punya akun?{" "}
              <Link href="/signup" className="font-medium text-[color:var(--primary)] hover:underline">
                Daftar gratis
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
