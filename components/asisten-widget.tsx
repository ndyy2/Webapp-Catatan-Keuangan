"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

type Usulan = { nama: string; argumen: Record<string, unknown>; ringkasan: string };
type Pesan = { peran: "user" | "asisten"; isi: string; usulan?: Usulan[]; kunci?: number };

let SEQ = 0;

export function AsistenWidget() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [buka, setBuka] = useState(false);
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [input, setInput] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [err, setErr] = useState("");
  const bawahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [pesan, buka, reduce]);

  if (pathname === "/login" || pathname === "/register") return null;

  const kirim = async () => {
    const teks = input.trim();
    if (!teks || sibuk) return;
    setInput("");
    setErr("");
    setPesan((p) => [...p, { peran: "user", isi: teks }]);
    setSibuk(true);
    try {
      const res = await fetch("/api/asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan: teks }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Asisten gagal");
        if (data.perluKunci) {
          setPesan((p) => [
            ...p,
            { peran: "asisten", isi: "Isi dulu kunci Groq di Pengaturan, lalu coba lagi." },
          ]);
        }
        return;
      }
      setPesan((p) => [
        ...p,
        {
          peran: "asisten",
          isi: String(data.jawaban ?? "(kosong)"),
          usulan: Array.isArray(data.usulan) ? data.usulan : [],
          kunci: SEQ++,
        },
      ]);
    } catch {
      setErr("Jaringan gagal, coba lagi");
    } finally {
      setSibuk(false);
    }
  };

  const laksana = async (u: Usulan) => {
    setSibuk(true);
    setErr("");
    try {
      const res = await fetch("/api/asisten/laksana", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: u.nama, argumen: u.argumen }),
      });
      const data = await res.json().catch(() => ({}));
      setPesan((p) => [
        ...p,
        {
          peran: "asisten",
          isi: res.ok ? `Berhasil: ${data.hasil}` : `Gagal: ${data.error ?? "tak diketahui"}`,
        },
      ]);
    } catch {
      setErr("Jaringan gagal, coba lagi");
    } finally {
      setSibuk(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setBuka((b) => !b)}
        aria-label={buka ? "Tutup asisten AI" : "Buka asisten AI"}
        className="fixed right-4 bottom-20 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-irish-deep text-white shadow-overlay outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-glow/60 md:bottom-6"
      >
        {buka ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {buka && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-36 z-40 md:inset-x-auto md:right-4 md:bottom-20 md:w-[380px]"
          >
            <Card className="flex max-h-[60vh] flex-col shadow-overlay md:max-h-[520px]">
              <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  <Sparkles className="h-3.5 w-3.5" />
                  Asisten AI
                </p>
                <div className="scroll-slim min-h-40 flex-1 space-y-2 overflow-y-auto pr-1" role="log" aria-live="polite">
                  {pesan.length === 0 && (
                    <p className="text-sm text-muted">
                      Tanya saldo, tren belanja, atau minta catatkan transaksi. Tulis selalu minta konfirmasi dulu.
                    </p>
                  )}
                  {pesan.map((m, i) => (
                    <div key={`${i}-${m.kunci ?? 0}`}>
                      <div
                        className={
                          m.peran === "user"
                            ? "ml-8 rounded-xl rounded-br-sm bg-irish-deep px-3 py-2 text-sm text-white"
                            : "mr-8 rounded-xl rounded-bl-sm border border-line bg-accent px-3 py-2 text-sm"
                        }
                      >
                        {m.isi}
                      </div>
                      {m.usulan?.map((u, j) => (
                        <div key={j} className="mr-8 mt-1 rounded-xl border border-warn/40 bg-warn/10 p-2.5 text-sm">
                          <p className="mb-2">Jalankan? {u.ringkasan}</p>
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="secondary" disabled={sibuk} onClick={() => laksana(u)}>
                              <Check className="h-3.5 w-3.5" />
                              Jalankan
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={sibuk}
                              onClick={() =>
                                setPesan((p) => [...p, { peran: "asisten", isi: "Baik, dibatalkan." }])
                              }
                            >
                              Batal
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {sibuk && <p className="text-sm text-muted">Mengetik…</p>}
                  <div ref={bawahRef} />
                </div>
                {err && <p role="alert" className="text-[13px] text-bad">{err}</p>}
                <div className="flex gap-1.5">
                  <Input
                    placeholder="Tanya atau minta catat…"
                    aria-label="Pesan untuk asisten AI"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") kirim();
                    }}
                  />
                  <Button size="icon" aria-label="Kirim" onClick={kirim} disabled={sibuk || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
