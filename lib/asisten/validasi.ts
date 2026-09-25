// Validasi grounding: setiap nominal Rp di jawaban HARUS muncul di hasil tool.
// Murni (tanpa DB) agar bisa di-unit-test.

// Ambil semua angka dari teks:
// "Rp1.250.000" -> [1250000], "Rp1,250,000" -> [1250000],
// "Rp1,5jt"/"Rp1.5 juta" -> [1500000], "Rp50rb" -> [50000].
const MULT: Record<string, number> = { jt: 1e6, juta: 1e6, rb: 1e3, ribu: 1e3, k: 1e3, m: 1e9 };

export function ekstrakNominal(teks: string): number[] {
  const out: number[] = [];
  const re = /Rp\s?([\d.,]+)\s*(jt|juta|rb|ribu|k|m)?(?![a-zA-Z0-9])/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks)) !== null) {
    const akhiran = (m[2] ?? "").toLowerCase();
    let n: number;
    if (akhiran && MULT[akhiran]) {
      // Dengan akhiran: titik = desimal KECUALI pola ribuan (1.550.000);
      // koma selalu desimal ("1,5").
      const ribuan = /^\d{1,3}(\.\d{3})+$/;
      const dasar = ribuan.test(m[1]) ? m[1].replace(/\./g, "") : m[1].replace(/,/g, ".");
      n = Math.round(Number(dasar) * MULT[akhiran]);
    } else {
      // Tanpa akhiran: titik DAN koma dianggap pemisah ribuan.
      n = Number(m[1].replace(/[.,]/g, ""));
    }
    if (Number.isInteger(n) && n > 0) out.push(n);
  }
  return out;
}

// Angka bebas (tanpa Rp) untuk konteks user, mis. "catat 50000" -> [50000].
// Minimal 4 digit agar tanggal/satuan kecil tak ikut.
export function ekstrakBebas(teks: string): number[] {
  const out: number[] = [];
  const re = /\b(\d[\d.]*)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(teks)) !== null) {
    const n = Number(m[1].replace(/\./g, ""));
    if (Number.isInteger(n) && n >= 1000) out.push(n);
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
// `konteks` = teks user + riwayat: angka yang user sendiri tulis boleh
// digaungkan kembali (bukan halusinasi).
export function validasiJawaban(
  jawaban: string,
  hasilTools: unknown[],
  konteks: string[] = [],
): { ok: boolean; asing: number[] } {
  const sumber = angkaSumber(hasilTools);
  for (const k of konteks) {
    for (const n of ekstrakNominal(k)) sumber.add(n);
    for (const n of ekstrakBebas(k)) sumber.add(n);
  }
  const asing = ekstrakNominal(jawaban).filter((n) => !sumber.has(n));
  return { ok: asing.length === 0, asing };
}
