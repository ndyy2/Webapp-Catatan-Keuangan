import "server-only";
import { prisma } from "@/lib/prisma";

const MAKS_MEMORI = 20;

// Fakta singkat terbaru user (untuk konteks system prompt).
export async function bacaMemori(userId: string): Promise<string[]> {
  const rows = await prisma.memoriAsisten.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: MAKS_MEMORI,
    select: { isi: true },
  });
  return rows.map((r) => r.isi);
}

// Simpan fakta baru; duplikat persis dilewati, kelebihan dibuang yang terlama.
export async function simpanMemori(userId: string, isi: string): Promise<boolean> {
  const fakta = isi.trim().slice(0, 300);
  if (!fakta) return false;
  const ada = await prisma.memoriAsisten.findFirst({ where: { userId, isi: fakta }, select: { id: true } });
  if (ada) {
    await prisma.memoriAsisten.update({ where: { id: ada.id }, data: {} });
    return false;
  }
  await prisma.memoriAsisten.create({ data: { userId, isi: fakta } });
  const lebih = await prisma.memoriAsisten.count({ where: { userId } });
  if (lebih > MAKS_MEMORI) {
    const tua = await prisma.memoriAsisten.findMany({
      where: { userId },
      orderBy: { updatedAt: "asc" },
      take: lebih - MAKS_MEMORI,
      select: { id: true },
    });
    await prisma.memoriAsisten.deleteMany({ where: { id: { in: tua.map((t) => t.id) } } });
  }
  return true;
}

export async function hapusMemori(userId: string, id: string): Promise<void> {
  await prisma.memoriAsisten.deleteMany({ where: { id, userId } });
}
