import "server-only";
import Groq from "groq-sdk";
import { DEFINISI_TOOLS, TOOL_TULIS, eksekusiBaca, ringkasUsulan } from "./tools";

const SYSTEM = `Kamu asisten keuangan keluarga Indonesia. Jawab Bahasa Indonesia, ringkas.
Uang dalam Rupiah (Rp1.250.000). Hari ini: ${new Date().toISOString().slice(0, 10)}.
Aturan: angka HANYA dari tool, jangan mengarang. Bila data tak ada, katakan jujur.
Tool tulis (buat/ubah/hapus/bayar/anggaran) TIDAK kamu eksekusi: panggil toolnya,
lalu minta konfirmasi user dengan merangkum aksinya dalam 1 kalimat.`;

export type Usulan = { nama: string; argumen: Record<string, unknown>; ringkasan: string };

export async function jalanAgen(
  apiKey: string,
  riwayat: { peran: string; isi: string }[],
  pesan: string,
  userId: string,
): Promise<{ jawaban: string; usulan: Usulan[] }> {
  const groq = new Groq({ apiKey });
  const msgs: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM },
    ...riwayat.slice(-20).map((p) => ({
      role: (p.peran === "asisten" ? "assistant" : "user") as "assistant" | "user",
      content: p.isi,
    })),
    { role: "user", content: pesan },
  ];
  const usulan: Usulan[] = [];
  for (let putaran = 0; putaran < 5; putaran++) {
    const res = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b",
      messages: msgs,
      tools: DEFINISI_TOOLS,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 1024,
    });
    const m = res.choices[0]?.message;
    if (!m) throw new Error("Groq tak menjawab");
    if (!m.tool_calls?.length) return { jawaban: m.content ?? "(kosong)", usulan };
    msgs.push({ role: "assistant", content: m.content ?? null, tool_calls: m.tool_calls });
    for (const tc of m.tool_calls) {
      if (tc.type !== "function") continue;
      const arg = JSON.parse(tc.function.arguments || "{}") as Record<string, unknown>;
      if (TOOL_TULIS.has(tc.function.name)) {
        usulan.push({ nama: tc.function.name, argumen: arg, ringkasan: ringkasUsulan(tc.function.name, arg) });
        msgs.push({ role: "tool", tool_call_id: tc.id, content: "DITUNDA: tunggu konfirmasi user dulu." });
      } else {
        const hasil = await eksekusiBaca(tc.function.name, arg, userId);
        msgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(hasil).slice(0, 4000) });
      }
    }
  }
  return { jawaban: "Permintaan terlalu berlapis, coba pecah jadi langkah kecil.", usulan };
}
