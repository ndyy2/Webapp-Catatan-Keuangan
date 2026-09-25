import "server-only";
import { bayarHutang } from "@/lib/actions/hutang";
import { upsertAnggaran } from "@/lib/actions/anggaran";
import { createTransaksi, deleteTransaksi, updateTransaksi } from "@/lib/actions/transaksi";
import { TOOL_TULIS } from "./tools";

// Eksekusi usulan tulis yang SUDAH dikonfirmasi user di UI.
// Memakai actions existing (scope userId + validasi + revalidate).
export async function laksanaUsulan(
  nama: string,
  arg: Record<string, unknown>,
): Promise<{ ok: boolean; hasil: string }> {
  if (!TOOL_TULIS.has(nama)) throw new Error(`Bukan tool tulis: ${nama}`);
  switch (nama) {
    case "buat_transaksi": {
      const id = await createTransaksi({
        jenis: arg.jenis as "masuk" | "keluar",
        jumlah: String(arg.jumlah ?? ""),
        tanggal: String(arg.tanggal ?? ""),
        kategori: String(arg.kategori ?? ""),
        catatan: typeof arg.catatan === "string" ? arg.catatan : undefined,
      });
      return { ok: true, hasil: `Transaksi tercatat (${id.slice(0, 6)}…)` };
    }
    case "ubah_transaksi": {
      await updateTransaksi(String(arg.id), {
        ...(arg.jumlah != null ? { jumlah: String(arg.jumlah) } : {}),
        ...(typeof arg.tanggal === "string" ? { tanggal: arg.tanggal } : {}),
        ...(typeof arg.kategori === "string" ? { kategori: arg.kategori } : {}),
      });
      return { ok: true, hasil: "Transaksi diubah" };
    }
    case "hapus_transaksi": {
      const ids = Array.isArray(arg.ids) ? arg.ids.map(String) : [];
      if (ids.length === 0) throw new Error("ids kosong");
      await deleteTransaksi(ids);
      return { ok: true, hasil: `${ids.length} transaksi masuk sampah (bisa dipulihkan)` };
    }
    case "bayar_hutang": {
      await bayarHutang(String(arg.id), String(arg.nominal ?? ""));
      return { ok: true, hasil: "Pembayaran tercatat" };
    }
    case "buat_anggaran": {
      await upsertAnggaran({
        kategori: String(arg.kategori ?? ""),
        batas: String(arg.batas ?? ""),
        bulan: String(arg.bulan ?? ""),
      });
      return { ok: true, hasil: "Anggaran disimpan" };
    }
    default:
      throw new Error(`Tool tak dikenal: ${nama}`);
  }
}
