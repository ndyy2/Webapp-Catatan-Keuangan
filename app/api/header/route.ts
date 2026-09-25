import { ambilUser } from "@/lib/auth";
import { getSaldo } from "@/lib/store";
import { prisma } from "@/lib/prisma";

// Ringkasan kilat untuk header: saldo + hutang tempo ≤7 hari.
export async function GET() {
  const user = await ambilUser();
  if (!user) return Response.json({ error: "Masuk dulu" }, { status: 401 });
  const [saldo, tempo] = await Promise.all([
    getSaldo("semua", user.id),
    prisma.hutang.count({
      where: {
        userId: user.id,
        status: "belum",
        jatuhTempo: { not: null, lte: new Date(Date.now() + 7 * 24 * 3600 * 1000) },
      },
    }),
  ]);
  return Response.json({ saldo: saldo.saldo, masuk: saldo.totalMasuk, keluar: saldo.totalKeluar, tempo });
}
