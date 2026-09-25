"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  Check,
  HandCoins,
  Pencil,
  PiggyBank,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AsistenSaran } from "@/components/asisten-saran";
import { MarkdownMini } from "@/components/markdown-mini";

type Usulan = { nama: string; argumen: Record<string, unknown>; ringkasan: string };
type Pesan = {
  peran: "user" | "asisten";
  isi: string;
  usulan?: Usulan[];
  kunci?: number;
  waktu?: number;
};

let SEQ = 0;

const IKON_USULAN: Record<string, typeof Plus> = {
  buat_transaksi: Plus,
  ubah_transaksi: Pencil,
  hapus_transaksi: Trash2,
  bayar_hutang: HandCoins,
  buat_anggaran: PiggyBank,
};

function kapan(waktu?: number): string {
  if (!waktu) return "";
  const dtk = Math.max(0, Math.floor((Date.now() - waktu) / 1000));
  if (dtk < 10) return "baru saja";
  if (dtk < 60) return `${dtk} dtk lalu`;
  const mnt = Math.floor(dtk / 60);
  if (mnt < 60) return `${mnt} mnt lalu`;
  return `${Math.floor(mnt / 60)} jam lalu`;
}

function TitikMengetik() {
  const reduce = useReducedMotion();
  return (
    <span className="inline-flex items-center gap-1 px-1 py-2" aria-label="Asisten mengetik">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-irish-soft"
          animate={reduce ? undefined : { opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

export function AsistenWidget() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [buka, setBuka] = useState(false);
  const [adaUsulan, setAdaUsulan] = useState(false);
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [input, setInput] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [err, setErr] = useState("");
  const bawahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bawahRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "end" });
  }, [pesan, buka, reduce]);

  useEffect(() => {
    if (buka) setAdaUsulan(false);
  }, [buka ]);

  if (pathname === "/login" || pathname === "/register") return null;

  const kirimTeks = async (teks: string) => {
    const bersih = teks.trim();
    if (!bersih || sibuk) return;
    setInput("");
    setErr("");
    setPesan((p) => [...p, { peran: "user", isi: bersih, waktu: Date.now() }]);
    setSibuk(true);
    try {
      const res = await fetch("/api/asisten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pesan: bersih }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "Asisten gagal");
        if (data.perluKunci) {
          setPesan((p) => [
            ...p,
            { peran: "asisten", isi: "Isi dulu kunci Groq di Pengaturan, lalu coba lagi.", waktu: Date.now() },
          ]);
        }
        return;
      }
      const usulan: Usulan[] = Array.isArray(data.usulan) ? data.usulan : [];
      if (usulan.length > 0) setAdaUsulan(true);
      setPesan((p) => [
        ...p,
        {
          peran: "asisten",
          isi: String(data.jawaban ?? "(kosong)"),
          usulan,
          kunci: SEQ++,
          waktu: Date.now(),
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
          waktu: Date.now(),
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
        className="fixed right-4 bottom-20 z-40 flex h-13 w-13 items-center justify-center rounded-full bg-gradient-to-br from-irish-deep to-irish text-white shadow-overlay outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-glow/60 md:bottom-6"
      >
        {buka ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        {adaUsulan && !buka && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            {!reduce && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warn opacity-70" />
            )}
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-canvas bg-warn" />
          </span>
        )}
      </button>
      <AnimatePresence>
        {buka && (
          <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduce ? 0 : 16, scale: reduce ? 1 : 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-3 bottom-36 z-40 md:inset-x-auto md:right-4 md:bottom-20 md:w-[400px]"
            role="dialog"
            aria-label="Asisten AI"
          >
            <Card className="flex max-h-[70dvh] flex-col overflow-hidden shadow-overlay md:max-h-[540px]">
              <div className="flex items-center gap-2.5 border-b border-line/70 bg-gradient-to-r from-irish-deep/25 to-transparent px-3.5 py-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-irish-deep text-white">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">Tanya</p>
                  <p className="flex items-center gap-1 font-mono text-[11px] text-ok">
                    <span className="h-1.5 w-1.5 rounded-full bg-ok" />
                    online
                  </p>
                </div>
                <button
                  onClick={() => setBuka(false)}
                  aria-label="Tutup"
                  className="rounded-lg p-1.5 text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-glow/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
                <div className="scroll-slim min-h-44 flex-1 space-y-2.5 overflow-y-auto pr-1" role="log" aria-live="polite">
                  {pesan.length === 0 && (
                    <div className="space-y-2.5">
                      <div className="mr-10 flex gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-irish-deep text-white">
                          <Sparkles className="h-3 w-3" />
                        </span>
                        <p className="rounded-2xl rounded-bl-sm border border-line bg-accent px-3 py-2 text-sm">
                          Halo! Tanya saldo, tren belanja, atau minta aku catatkan transaksi.
                        </p>
                      </div>
                      <AsistenSaran onPilih={(s) => kirimTeks(s)} sibuk={sibuk} />
                    </div>
                  )}
                  {pesan.map((m, i) => (
                    <motion.div
                      key={`${i}-${m.kunci ?? 0}`}
                      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduce ? 0 : 0.25 }}
                    >
                      <div className={m.peran === "user" ? "flex justify-end" : "flex gap-2"}>
                        {m.peran === "asisten" && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-irish-deep text-white">
                            <Sparkles className="h-3 w-3" />
                          </span>
                        )}
                        <div className="min-w-0">
                          <div
                            className={
                              m.peran === "user"
                                ? "ml-10 rounded-2xl rounded-br-sm bg-irish-deep px-3 py-2 text-sm text-white"
                                : "rounded-2xl rounded-bl-sm border border-line bg-accent px-3 py-2 text-sm leading-relaxed"
                            }
                          >
                            {m.peran === "asisten" ? <MarkdownMini teks={m.isi} /> : m.isi}
                          </div>
                          <p className="mt-0.5 font-mono text-[10px] text-muted/70">{kapan(m.waktu)}</p>
                        </div>
                      </div>
                      {m.usulan?.map((u, j) => {
                        const Ikon = IKON_USULAN[u.nama] ?? Sparkles;
                        return (
                          <div key={j} className="mt-1.5 mr-2 ml-8 rounded-2xl border border-warn/40 bg-warn/10 p-3 text-sm">
                            <p className="mb-1 flex items-center gap-1.5 font-semibold">
                              <Ikon className="h-4 w-4 text-warn" />
                              Perlu persetujuanmu
                            </p>
                            <p className="mb-2.5 text-muted">{u.ringkasan}</p>
                            <div className="flex gap-1.5">
                              <Button size="sm" disabled={sibuk} onClick={() => laksana(u)}>
                                <Check className="h-3.5 w-3.5" />
                                Jalankan
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={sibuk}
                                onClick={() => setPesan((p) => [...p, { peran: "asisten", isi: "Baik, dibatalkan.", waktu: Date.now() }])}
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  ))}
                  {sibuk && (
                    <div className="flex gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-irish-deep text-white">
                        <Sparkles className="h-3 w-3" />
                      </span>
                      <div className="rounded-2xl rounded-bl-sm border border-line bg-accent px-2">
                        <TitikMengetik />
                      </div>
                    </div>
                  )}
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
                      if (e.key === "Enter") kirimTeks(input);
                      if (e.key === "Escape") setBuka(false);
                    }}
                  />
                  <Button size="icon" aria-label="Kirim" onClick={() => kirimTeks(input)} disabled={sibuk || !input.trim()}>
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
