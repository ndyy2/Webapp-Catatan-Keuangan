"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Wallet } from "lucide-react";
import { formatRupiah } from "@/lib/format";

type Ringkas = { saldo: number; tempo: number } | null;

export function HeaderWidgets() {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [data, setData] = useState<Ringkas>(null);

  useEffect(() => {
    let batal = false;
    fetch("/api/header")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (!batal && j && typeof j.saldo === "number") setData({ saldo: j.saldo, tempo: j.tempo ?? 0 });
      })
      .catch(() => {});
    return () => {
      batal = true;
    };
  }, [pathname]);

  const cari = () => {
    if (!q.trim()) return;
    router.push(`/transaksi?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <>
      <form
        action="/transaksi"
        method="get"
        role="search"
        className="relative ml-auto hidden min-w-40 flex-1 max-w-xs items-center md:flex"
        onSubmit={(e) => {
          e.preventDefault();
          cari();
        }}
      >
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-muted" />
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari transaksi…"
          aria-label="Cari transaksi"
          className="h-9 w-full rounded-xl border border-line bg-transparent pr-3 pl-8 text-sm outline-none placeholder:text-muted focus:border-muted"
        />
      </form>
      {data && (
        <Link
          href="/"
          aria-label="Saldo keseluruhan"
          className="hidden items-center gap-1.5 rounded-full border border-line px-3 py-1.5 font-mono text-[12px] outline-none transition-colors hover:border-muted focus-visible:ring-2 focus-visible:ring-glow/60 sm:inline-flex"
        >
          <Wallet className="h-3.5 w-3.5 text-irish-soft" />
          <span className={data.saldo < 0 ? "text-bad" : "text-ink"}>Rp{formatRupiah(data.saldo)}</span>
        </Link>
      )}
      <Link
        href="/hutang"
        aria-label={data && data.tempo > 0 ? `${data.tempo} hutang jatuh tempo` : "Hutang"}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted outline-none transition-colors hover:border-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-glow/60"
      >
        <Bell className="h-4 w-4" />
        {data && data.tempo > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-bad px-1 font-mono text-[10px] font-bold text-white">
            {data.tempo > 9 ? "9+" : data.tempo}
          </span>
        )}
      </Link>
    </>
  );
}
