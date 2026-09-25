import "server-only";
import type Groq from "groq-sdk";
import {
  getAnggaranVsRealisasi,
  getHutang,
  getRingkasanKategori,
  getSaldo,
  getTransaksiPage,
  getTrenHarga,
} from "@/lib/store";

// Definisi tool untuk Groq. Baca dieksekusi langsung; tulis ditunda
// dan dikembalikan sebagai usulan konfirmasi (lihat laksana.ts).
export const DEFINISI_TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "baca_saldo",
      description: "Total masuk, keluar, dan saldo user pada periode.",
      parameters: {
        type: "object",
        properties: { periode: { type: "string", enum: ["semua", "minggu", "bulan"] } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "baca_kategori",
      description: "Rincian pengeluaran per kategori + persen pada periode.",
      parameters: {
        type: "object",
        properties: { periode: { type: "string", enum: ["semua", "minggu", "bulan"] } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cari_transaksi",
      description: "Cari transaksi (kategori, catatan, nominal, tanggal). Maks 10 terbaru.",
      parameters: {
        type: "object",
        properties: {
          q: { type: "string" },
          jenis: { type: "string", enum: ["masuk", "keluar"] },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "baca_hutang",
      description: "Daftar hutang dan piutang belum lunas + sisa.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "baca_anggaran",
      description: "Anggaran vs realisasi per kategori bulan YYYY-MM.",
      parameters: {
        type: "object",
        properties: { bulan: { type: "string", description: "YYYY-MM, default bulan berjalan" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "tren_harga",
      description: "Tren harga produk yang dibeli berulang.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "buat_transaksi",
      description: "USULKAN mencatat transaksi baru. Jangan eksekusi sendiri, selalu minta konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          jenis: { type: "string", enum: ["masuk", "keluar"] },
          jumlah: { type: "number", description: "Rupiah murni" },
          tanggal: { type: "string", description: "YYYY-MM-DD" },
          kategori: { type: "string" },
          catatan: { type: "string" },
        },
        required: ["jenis", "jumlah", "tanggal", "kategori"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ubah_transaksi",
      description: "USULKAN mengubah transaksi (cari id dulu via cari_transaksi). Selalu minta konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          jumlah: { type: "number" },
          tanggal: { type: "string" },
          kategori: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "hapus_transaksi",
      description: "USULKAN menghapus (masuk sampah, bisa dipulihkan). Selalu minta konfirmasi.",
      parameters: {
        type: "object",
        properties: { ids: { type: "array", items: { type: "string" } } },
        required: ["ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bayar_hutang",
      description: "USULKAN pembayaran hutang/piutang (nominal Rupiah). Selalu minta konfirmasi.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" }, nominal: { type: "number" } },
        required: ["id", "nominal"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buat_anggaran",
      description: "USULKAN anggaran bulanan kategori. Selalu minta konfirmasi.",
      parameters: {
        type: "object",
        properties: {
          kategori: { type: "string" },
          batas: { type: "number", description: "Rupiah per bulan" },
          bulan: { type: "string", description: "YYYY-MM" },
        },
        required: ["kategori", "batas", "bulan"],
      },
    },
  },
];

export const TOOL_TULIS = new Set([
  "buat_transaksi",
  "ubah_transaksi",
  "hapus_transaksi",
  "bayar_hutang",
  "buat_anggaran",
]);

// Eksekutor tool BACA (scope userId sesi).
export async function eksekusiBaca(
  nama: string,
  arg: Record<string, unknown>,
  userId: string,
): Promise<unknown> {
  switch (nama) {
    case "baca_saldo":
      return getSaldo((arg.periode as "semua" | "minggu" | "bulan" | undefined) ?? "semua", userId);
    case "baca_kategori":
      return getRingkasanKategori((arg.periode as "semua" | "minggu" | "bulan" | undefined) ?? "semua", userId);
    case "cari_transaksi": {
      const { rows } = await getTransaksiPage({
        userId,
        search: String(arg.q ?? ""),
        jenis: (arg.jenis as "masuk" | "keluar" | undefined) ?? undefined,
        limit: 10,
      });
      return rows.map((t) => ({
        id: t.id,
        jenis: t.jenis,
        jumlah: t.jumlah,
        tanggal: t.tanggal,
        kategori: t.kategori,
      }));
    }
    case "baca_hutang": {
      const h = await getHutang(userId);
      const ringkas = (rows: { id: string; pihak: string; jumlah: number; dibayar: number }[]) =>
        rows.map((r) => ({ id: r.id, pihak: r.pihak, sisa: r.jumlah - r.dibayar }));
      return { hutang: ringkas(h.hutang), piutang: ringkas(h.piutang) };
    }
    case "baca_anggaran":
      return getAnggaranVsRealisasi(typeof arg.bulan === "string" ? arg.bulan : undefined, userId);
    case "tren_harga": {
      const tren = await getTrenHarga(userId);
      return Object.entries(tren).slice(0, 10);
    }
    default:
      throw new Error(`Tool tak dikenal: ${nama}`);
  }
}

// Ringkasan usulan tulis untuk kartu konfirmasi UI.
export function ringkasUsulan(nama: string, arg: Record<string, unknown>): string {
  const rp = (n: unknown) => `Rp${Number(n ?? 0).toLocaleString("id-ID")}`;
  switch (nama) {
    case "buat_transaksi":
      return `${arg.jenis} ${rp(arg.jumlah)} ${arg.kategori} (${arg.tanggal})`;
    case "ubah_transaksi":
      return `Ubah ${String(arg.id).slice(0, 6)}…`;
    case "hapus_transaksi":
      return `Hapus ${(arg.ids as string[]).length} transaksi (masuk sampah)`;
    case "bayar_hutang":
      return `Bayar ${rp(arg.nominal)}`;
    case "buat_anggaran":
      return `Anggaran ${arg.kategori} ${rp(arg.batas)}/bln (${arg.bulan})`;
    default:
      return nama;
  }
}
