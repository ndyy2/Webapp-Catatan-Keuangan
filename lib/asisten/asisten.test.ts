import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

process.env.BETTER_AUTH_SECRET ??= "test-secret-untuk-asisten";

import { dekripsi, enkripsi, maskKunci } from "@/lib/rahasia";
import { TOOL_TULIS, ringkasUsulan } from "./tools";
import { laksanaUsulan } from "./laksana";
import { angkaSumber, ekstrakNominal, validasiJawaban } from "./validasi";
import { bacaMemori, hapusMemori, simpanMemori } from "./memori";

describe("rahasia", () => {
  it("roundtrip + format paket", () => {
    const paket = enkripsi("gsk_test123");
    expect(paket.split(":")).toHaveLength(3);
    expect(dekripsi(paket)).toBe("gsk_test123");
  });

  it("salah secret / format rusak melempar", () => {
    expect(() => dekripsi("bukan-paket")).toThrow("Format rahasia rusak");
    expect(() => dekripsi(enkripsi("x").replace(/.$/, "y"))).toThrow();
  });

  it("mask tak membocorkan utuh", () => {
    const m = maskKunci("gsk_abcdefghij");
    expect(m).not.toContain("abcdefghij");
    expect(m).toContain("gsk_");
  });
});

describe("usulan tulis", () => {
  it("terdaftar lengkap", () => {
    expect([...TOOL_TULIS].sort()).toEqual([
      "bayar_hutang",
      "buat_anggaran",
      "buat_transaksi",
      "hapus_transaksi",
      "ubah_transaksi",
    ]);
  });

  it("ringkasan Rupiah id-ID", () => {
    expect(ringkasUsulan("buat_transaksi", { jenis: "keluar", jumlah: 50000, tanggal: "2026-09-01", kategori: "Pangan" })).toBe(
      "keluar Rp50.000 Pangan (2026-09-01)",
    );
  });

  it("menolak tool tak dikenal tanpa sentuh DB", async () => {
    await expect(laksanaUsulan("ngawur", {})).rejects.toThrow("Bukan tool tulis");
  });
});

describe("validasi grounding", () => {
  it("ekstrak nominal id-ID", () => {
    expect(ekstrakNominal("Saldo Rp1.250.000 dan Rp500")).toEqual([1250000, 500]);
    expect(ekstrakNominal("tanpa angka")).toEqual([]);
  });

  it("lolos bila semua angka ada di sumber", () => {
    const sumber = [{ masuk: 3000000, keluar: 1750000 }, [{ kategori: "Pangan", jumlah: 1550000 }]];
    expect(angkaSumber(sumber).has(1550000)).toBe(true);
    expect(validasiJawaban("Saldo Rp1.250.000 dari masuk Rp3.000.000", sumber)).toEqual({ ok: false, asing: [1250000] });
    expect(validasiJawaban("Masuk Rp3.000.000, Pangan Rp1.550.000", sumber).ok).toBe(true);
  });

  it("persen kecil bukan nominal (tak ditulis Rp) diabaikan", () => {
    expect(validasiJawaban("Naik 20% bulan ini", [{ keluar: 100000 }]).ok).toBe(true);
  });
});

describe("memori singkat", () => {
  it("simpan + baca + dedup + batas", async () => {
    const { prisma } = await import("@/lib/prisma");
    const { randomUUID } = await import("node:crypto");
    const uid = (
      await prisma.user.create({ data: { id: randomUUID(), name: "M", email: `m${Date.now()}@x.id` } })
    ).id;
    expect(await simpanMemori(uid, "Gaji tiap Senin")).toBe(true);
    expect(await simpanMemori(uid, "Gaji tiap Senin")).toBe(false);
    expect(await bacaMemori(uid)).toEqual(["Gaji tiap Senin"]);
    for (let i = 0; i < 25; i++) await simpanMemori(uid, `fakta ${i}`);
    expect((await bacaMemori(uid)).length).toBe(20);
    const satu = await prisma.memoriAsisten.findFirstOrThrow({ where: { userId: uid } });
    await hapusMemori(uid, satu.id);
    expect((await bacaMemori(uid)).length).toBe(19);
    await prisma.memoriAsisten.deleteMany({ where: { userId: uid } });
    await prisma.user.delete({ where: { id: uid } });
    await prisma.$disconnect();
  });
});
