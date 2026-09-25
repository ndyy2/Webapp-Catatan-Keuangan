"use client";
import { motion, useReducedMotion } from "motion/react";

const SARAN = [
  "Saldo bulan ini berapa?",
  "Kategori apa yang paling boros?",
  "Catat keluar 50000 pangan",
];

export function AsistenSaran({ onPilih, sibuk }: { onPilih: (s: string) => void; sibuk: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex flex-wrap gap-1.5">
      {SARAN.map((s, i) => (
        <motion.button
          key={s}
          type="button"
          disabled={sibuk}
          onClick={() => onPilih(s)}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : i * 0.07 }}
          className="rounded-full border border-line bg-transparent px-3 py-1.5 text-[13px] text-muted outline-none transition-colors hover:border-irish/50 hover:text-ink focus-visible:ring-2 focus-visible:ring-glow/60 disabled:opacity-50"
        >
          {s}
        </motion.button>
      ))}
    </div>
  );
}
