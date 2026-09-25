"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { wajibUser } from "@/lib/auth";
import { enkripsi, maskKunci } from "@/lib/rahasia";

// Simpan kunci Groq user (terenkripsi, tak pernah kembali ke client utuh).
export async function simpanGroqKey(kunci: string) {
  const user = await wajibUser();
  const k = kunci.trim();
  if (!k) throw new Error("Kunci kosong");
  if (k.length < 10 || k.length > 300) throw new Error("Format kunci mencurigakan");
  await prisma.user.update({ where: { id: user.id }, data: { groqKey: enkripsi(k) } });
  revalidatePath("/pengaturan");
}

// Mask untuk UI, null bila belum ada.
export async function statusGroqKey(): Promise<string | null> {
  const user = await wajibUser();
  const u = await prisma.user.findUnique({ where: { id: user.id }, select: { groqKey: true } });
  if (!u?.groqKey) return null;
  try {
    const { dekripsi } = await import("@/lib/rahasia");
    return maskKunci(dekripsi(u.groqKey));
  } catch {
    return "rusak (isi ulang)";
  }
}

export async function hapusGroqKey() {
  const user = await wajibUser();
  await prisma.user.update({ where: { id: user.id }, data: { groqKey: null } });
  revalidatePath("/pengaturan");
}
