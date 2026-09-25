"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2 } from "lucide-react";
import { hapusGroqKey, simpanGroqKey, statusGroqKey } from "@/lib/actions/kunci";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function KunciGroq({ maskAwal }: { maskAwal: string | null }) {
  const router = useRouter();
  const [kunci, setKunci] = useState("");
  const [mask, setMask] = useState(maskAwal);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [pending, start] = useTransition();

  const simpan = () =>
    start(async () => {
      setErr("");
      setInfo("");
      try {
        await simpanGroqKey(kunci);
        setKunci("");
        setMask(await statusGroqKey());
        setInfo("Kunci tersimpan terenkripsi.");
        router.refresh();
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Gagal menyimpan");
      }
    });

  const hapus = () => {
    if (!confirm("Hapus kunci Groq? Asisten AI jadi nonaktif.")) return;
    start(async () => {
      await hapusGroqKey();
      setMask(null);
      setInfo("Kunci dihapus.");
      router.refresh();
    });
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="flex items-center gap-1.5 font-semibold">
          <KeyRound className="h-4 w-4 text-muted" />
          Kunci Groq (asisten AI)
        </p>
        <p className="text-sm text-muted">
          {mask ? (
            <>Terpasang: <span className="font-mono">{mask}</span>. Buat kunci gratis di console.groq.com.</>
          ) : (
            <>Belum ada kunci. Buat gratis di console.groq.com, lalu tempel di sini.</>
          )}
        </p>
        <Field label="Kunci baru (gsk_…)" htmlFor="kunci-groq">
          <Input
            id="kunci-groq"
            type="password"
            autoComplete="off"
            placeholder="gsk_…"
            value={kunci}
            onChange={(e) => setKunci(e.target.value)}
          />
        </Field>
        {err && <p role="alert" className="text-sm text-bad">{err}</p>}
        {info && <p role="status" className="text-sm text-ok">{info}</p>}
        <div className="flex gap-2">
          <Button onClick={simpan} disabled={pending || !kunci.trim()} variant="secondary">
            Simpan kunci
          </Button>
          {mask && (
            <Button onClick={hapus} disabled={pending} variant="secondary" className="hover:border-bad/50 hover:text-bad">
              <Trash2 className="h-4 w-4" />
              Hapus
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
