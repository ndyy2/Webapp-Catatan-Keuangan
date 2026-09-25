import { ambilUser } from "@/lib/auth";
import { getDompetSaya } from "@/lib/actions/dompet";
import { statusGroqKey } from "@/lib/actions/kunci";
import { PageHeader } from "@/components/ui/field";
import { DompetManager } from "@/components/dompet-manager";
import { KunciGroq } from "@/components/kunci-groq";
import { PengaturanClient } from "./_client";

export default async function PengaturanPage() {
  const user = await ambilUser();
  const [dompets, mask] = user ? await Promise.all([getDompetSaya(), statusGroqKey()]) : [[], null];
  return (
    <div className="space-y-3">
      <PageHeader
        title="Pengaturan"
        description="akun, dompet, AI, export, tema"
      />
      <PengaturanClient csvHref="/api/export" hutangHref="/api/export/hutang" user={user} />
      <KunciGroq maskAwal={mask} />
      <DompetManager initial={dompets} />
    </div>
  );
}
