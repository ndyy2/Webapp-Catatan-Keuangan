import { ambilUser } from "@/lib/auth";
import { laksanaUsulan } from "@/lib/asisten/laksana";

// Eksekusi usulan tulis yang SUDAH dikonfirmasi user di UI.
export async function POST(req: Request) {
  const user = await ambilUser();
  if (!user) return Response.json({ error: "Masuk dulu" }, { status: 401 });
  const { nama, argumen } = (await req.json().catch(() => ({}))) as {
    nama?: string;
    argumen?: Record<string, unknown>;
  };
  if (!nama || typeof argumen !== "object" || !argumen) {
    return Response.json({ error: "Usulan tidak valid" }, { status: 400 });
  }
  try {
    const r = await laksanaUsulan(nama, argumen);
    return Response.json(r);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message.slice(0, 200) : "Gagal menjalankan" },
      { status: 400 },
    );
  }
}
