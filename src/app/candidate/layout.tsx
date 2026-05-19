import { requireCandidate } from "@/lib/rbac";

export default async function CandidateLayout({ children }: { children: React.ReactNode }) {
  await requireCandidate();
  return <div className="gradient-shell min-h-screen">{children}</div>;
}
