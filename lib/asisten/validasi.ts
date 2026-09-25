// Validasi grounding: setiap nominal Rp di jawaban HARUS muncul di hasil tool.
// Murni (tanpa DB) agar bisa di-unit-test.

// Ambil semua angka dari teks "Rp1.250.000" -> [1250000].
export function ekstrakNominal(teks: string): number[] {
  const out: number[] = [];
  const re = /Rp\s?([\d.]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks)) !== null) {
    const n = Number(m[1].replace(/\./g, ""));
    if (Number.isInteger(n) && n > 0) out.push(n);
  }
  return out;
}

// Kumpulkan semua bilangan bulat positif dari hasil tool (rekursif).
function kumpulAngka(data: unknown, ke: Set<number>): void {
  if (typeof data === "number" && Number.isInteger(data) && data > 0) {
    ke.add(data);
    return;
  }
  if (Array.isArray(data)) {
    for (const v of data) kumpulAngka(v, ke);
    return;
  }
  if (data && typeof data === "object") {
    for (const v of Object.values(data)) kumpulAngka(v, ke);
  }
}

export function angkaSumber(hasilTools: unknown[]): Set<number> {
  const ke = new Set<number>();
  for (const h of hasilTools) kumpulAngka(h, ke);
  return ke;
}

// Nominal jawaban yang tak ada di sumber = halusinasi (dengan toleransi
// persen: angka ≤100 yang muncul dengan tanda % diabaikan).
export function validasiJawaban(jawaban: string, hasilTools: unknown[]): { ok: boolean; asing: number[] } {
  const sumber = angkaSumber(hasilTools);
  const asing = ekstrakNominal(jawaban).filter((n) => !sumber.has(n));
  return { ok: asing.length === 0, asing };
}
