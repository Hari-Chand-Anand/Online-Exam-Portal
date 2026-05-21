import { prisma } from "@/lib/prisma";
import type { CandidateStatus, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DeleteCandidateButton } from "@/components/delete-candidate-button";

export const dynamic = "force-dynamic";

async function addCandidate(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const college = String(formData.get("college") || "").trim();
  const roleApplied = String(formData.get("roleApplied") || "").trim();
  const status = String(formData.get("status") || "ACTIVE") as CandidateStatus;

  if (!name || !email) {
    return;
  }

  await prisma.candidate.upsert({
    where: { email },
    update: {
      name,
      phone: phone || null,
      college: college || null,
      roleApplied: roleApplied || null,
      status,
    },
    create: {
      name,
      email,
      phone: phone || null,
      college: college || null,
      roleApplied: roleApplied || null,
      status,
    },
  });

  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
}

async function toggleCandidateStatus(formData: FormData) {
  "use server";

  const candidateId = String(formData.get("candidateId"));
  const currentStatus = String(formData.get("currentStatus"));

  const nextStatus: CandidateStatus =
    currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

  await prisma.candidate.update({
    where: { id: candidateId },
    data: { status: nextStatus },
  });

  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
}

async function deleteCandidate(formData: FormData) {
  "use server";

  const candidateId = String(formData.get("candidateId"));

  await prisma.$transaction(async (tx) => {
    const attempts = await tx.examAttempt.findMany({
      where: { candidateId },
      select: { id: true },
    });

    const attemptIds = attempts.map((attempt) => attempt.id);

    if (attemptIds.length > 0) {
      await tx.result.deleteMany({
        where: {
          attemptId: {
            in: attemptIds,
          },
        },
      });

      await tx.candidateAnswer.deleteMany({
        where: {
          attemptId: {
            in: attemptIds,
          },
        },
      });

      await tx.proctoringEvent.deleteMany({
        where: {
          attemptId: {
            in: attemptIds,
          },
        },
      });

      await tx.examAttempt.deleteMany({
        where: {
          id: {
            in: attemptIds,
          },
        },
      });
    }

    await tx.examAssignment.deleteMany({
      where: { candidateId },
    });

    await tx.candidate.delete({
      where: { id: candidateId },
    });
  });

  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/results");
  revalidatePath("/admin/proctoring");
}

function statusBadge(status: CandidateStatus) {
  if (status === "ACTIVE") {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        ACTIVE
      </span>
    );
  }

  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
      INACTIVE
    </span>
  );
}

export default async function CandidatesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = String(params?.q || "").trim();

  const where: Prisma.CandidateWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { college: { contains: q, mode: "insensitive" } },
          { roleApplied: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const candidates = await prisma.candidate.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      attempts: {
        select: { id: true },
      },
    },
  });

  async function searchCandidates(formData: FormData) {
    "use server";

    const query = String(formData.get("q") || "").trim();

    if (!query) {
      redirect("/admin/candidates");
    }

    redirect(`/admin/candidates?q=${encodeURIComponent(query)}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Candidate Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add, activate, deactivate, delete and export candidates.
          </p>
        </div>

        <Button asChild variant="outline">
          <a href="/api/admin/candidates/export">Export CSV</a>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-slate-950">
            Add Candidate
          </h2>

          <form action={addCandidate} className="space-y-4">
            <Input name="name" placeholder="Name" required />
            <Input name="email" type="email" placeholder="Email" required />
            <Input name="phone" placeholder="Phone" />
            <Input name="college" placeholder="College" />
            <Input name="roleApplied" placeholder="Role applied" />

            <select
              name="status"
              defaultValue="ACTIVE"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>

            <Button className="w-full bg-slate-950 hover:bg-slate-800">
              Save Candidate
            </Button>
          </form>

          <Button asChild variant="outline" className="mt-4 w-full">
            <Link href="/admin/candidates/import">Bulk Import CSV</Link>
          </Button>
        </Card>

        <Card className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                All Candidates
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {candidates.length} candidate(s)
              </p>
            </div>

            <form action={searchCandidates} className="flex gap-2">
              <Input
                name="q"
                defaultValue={q}
                placeholder="Search name, email, college"
                className="w-[320px]"
              />
              <Button variant="outline">Search</Button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">College</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Attempts</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {candidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No candidates found.
                    </td>
                  </tr>
                ) : (
                  candidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-4 font-medium text-slate-950">
                        {candidate.name}
                      </td>
                      <td className="px-4 py-4">{candidate.email}</td>
                      <td className="px-4 py-4">
                        {candidate.college || "-"}
                      </td>
                      <td className="px-4 py-4">
                        {candidate.roleApplied || "-"}
                      </td>
                      <td className="px-4 py-4">
                        {statusBadge(candidate.status)}
                      </td>
                      <td className="px-4 py-4">
                        {candidate.attempts.length}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <form action={toggleCandidateStatus}>
                            <input
                              type="hidden"
                              name="candidateId"
                              value={candidate.id}
                            />
                            <input
                              type="hidden"
                              name="currentStatus"
                              value={candidate.status}
                            />

                            <Button variant="outline">
                              {candidate.status === "ACTIVE"
                                ? "Deactivate"
                                : "Activate"}
                            </Button>
                          </form>

                          <form action={deleteCandidate}>
                            <input
                              type="hidden"
                              name="candidateId"
                              value={candidate.id}
                            />

                            <DeleteCandidateButton
                              name={candidate.name || candidate.email}
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}