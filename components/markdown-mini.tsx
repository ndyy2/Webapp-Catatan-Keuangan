"use client";
import { Fragment } from "react";

// Markdown super-ringkas TANPA HTML mentah: **tebal** + baris + daftar "- ".
// Cukup untuk jawaban asisten (angka, rincian). Bukan parser umum.
export function MarkdownMini({ teks }: { teks: string }) {
  const baris = teks.split("\n");
  return (
    <>
      {baris.map((b, i) => {
        const item = /^\s*[-*]\s+/.test(b);
        const bersih = item ? b.replace(/^\s*[-*]\s+/, "") : b;
        return (
          <p key={i} className={item ? "flex gap-1.5" : undefined}>
            {item && (
              <span aria-hidden className="text-irish-soft">
                •
              </span>
            )}
            <span>
              {bersih.split(/(\*\*[^*]+\*\*)/g).map((pot, j) =>
                pot.startsWith("**") && pot.endsWith("**") && pot.length > 4 ? (
                  <strong key={j} className="font-semibold text-ink">
                    {pot.slice(2, -2)}
                  </strong>
                ) : (
                  <Fragment key={j}>{pot}</Fragment>
                ),
              )}
            </span>
          </p>
        );
      })}
    </>
  );
}
