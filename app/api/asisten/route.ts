import { ambilUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dekripsi } from "@/lib/rahasia";
import { jalanAgen } from "@/lib/asisten/agen";

const BATAS_HARIAN = 20; // pertukaran pesan per user per hari

export async function POST(req: Request) {
  const user = await ambilUser();
  if (!user) return Response.json({ error: "Masuk dulu" }, { status: 401 });
  const { pesan } = (await req.json().catch(() => ({}))) as { pesan?: string };
  if (!pesan?.trim() || pesan.length > 2000) {
    return Response.json({ error: "Pesan kosong atau kepanjangan" }, { status: 400 });
  }
  const akun = await prisma.user.findUnique({ where: { id: user.id }, select: { groqKey: true } });
  if (!akun?.groqKey) {
    return Response.json({ error: "Kunci Groq belum diisi", perluKunci: true }, { status: 400 });
  }
  const mulaiHari = new Date();
  mulaiHari.setHours(0, 0, 0, 0);
  const hitung = await prisma.pesanAsisten.count({
    where: { userId: user.id, peran: "user", createdAt: { gte: mulaiHari } },
  });
  if (hitung >= BATAS_HARIAN) {
    return Response.json({ error: `Batas ${BATAS_HARIAN} pesan/hari tercapai` }, { status: 429 });
  }
  let apiKey: string;
  try {
    apiKey = dekripsi(akun.groqKey);
  } catch {
    return Response.json({ error: "Kunci Groq rusak, isi ulang di pengaturan", perluKunci: true }, { status: 400 });
  }
  const riwayat = await prisma.pesanAsisten.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { peran: true, isi: true },
  });
  try {
    const { jawaban, usulan } = await jalanAgen(
      apiKey,
      [...riwayat].reverse(),
      pesan.trim(),
      user.id,
    );
    await prisma.pesanAsisten.createMany({
      data: [
        { userId: user.id, peran: "user", isi: pesan.trim().slice(0, 2000) },
        { userId: user.id, peran: "asisten", isi: jawaban.slice(0, 4000) },
      ],
    });
    return Response.json({ jawaban, usulan });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Groq gagal";
    const status = /401|invalid_api_key|unauthorized/i.test(msg) ? 401 : 502;
    return Response.json(
      { error: status === 401 ? "Kunci Groq ditolak, periksa di pengaturan" : `Groq gagal: ${msg.slice(0, 200)}` },
      { status },
    );
  }
}
