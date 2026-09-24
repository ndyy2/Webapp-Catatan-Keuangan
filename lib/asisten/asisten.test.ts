import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

process.env.BETTER_AUTH_SECRET ??= "test-secret-untuk-asisten";

import { dekripsi, enkripsi, maskKunci } from "@/lib/rahasia";
import { TOOL_TULIS, ringkasUsulan } from "./tools";
import { laksanaUsulan } from "./laksana";

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
