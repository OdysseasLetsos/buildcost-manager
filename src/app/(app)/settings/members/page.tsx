import {
  createInvitation,
  disableMember,
  getCurrentCompany,
  listCompanyMembers,
  updateMemberRole,
} from "@/src/core/tenants";
import { getCurrentUser } from "@/src/core/auth";
import { requireRole } from "@/src/core/roles";

const roleOptions = [
  { value: "admin", label: "Διαχειριστής" },
  { value: "office", label: "Γραφείο" },
  { value: "foreman", label: "Εργοδηγός" },
  { value: "viewer", label: "Προβολή" },
];

const roleLabels: Record<string, string> = {
  owner: "Ιδιοκτήτης",
  admin: "Διαχειριστής",
  office: "Γραφείο",
  foreman: "Εργοδηγός",
  viewer: "Προβολή",
};

const statusLabels: Record<string, string> = {
  active: "Ενεργό",
  suspended: "Ανενεργό",
  invited: "Πρόσκληση",
};

type MembersPageProps = {
  searchParams?: Promise<{
    invite?: string;
    error?: string;
  }>;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  const currentCompany = await getCurrentCompany();

  if (!currentCompany) {
    return null;
  }

  let canManageMembers = false;

  try {
    await requireRole(currentCompany.company.id, ["owner", "admin"]);
    canManageMembers = true;
  } catch {
    canManageMembers = false;
  }

  const members = canManageMembers
    ? await listCompanyMembers(currentCompany.company.id)
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-blue-700">Ρυθμίσεις</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-950">
          Μέλη εταιρείας
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Διαχείριση προσκλήσεων, ρόλων και πρόσβασης για την εταιρεία.
        </p>
      </section>

      {!canManageMembers ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            Δεν έχετε δικαίωμα διαχείρισης μελών
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Μόνο ιδιοκτήτες και διαχειριστές μπορούν να διαχειριστούν μέλη.
          </p>
        </section>
      ) : null}

      {canManageMembers ? (
        <>
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">
              Πρόσκληση χρήστη
            </h3>

            {params?.error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                {params.error}
              </p>
            ) : null}

            {params?.invite ? (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-sm font-medium text-emerald-900">
                  Σύνδεσμος πρόσκλησης για ανάπτυξη
                </p>
                <p className="mt-2 break-all text-sm text-emerald-800">
                  {params.invite}
                </p>
              </div>
            ) : null}

            <form action={createInvitation} className="mt-5 grid gap-4 md:grid-cols-[1fr_180px_auto]">
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                Ρόλος
                <select
                  name="role"
                  defaultValue="viewer"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-slate-950 outline-none transition focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  {roleOptions.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                className="self-end rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                Αποστολή πρόσκλησης
              </button>
            </form>
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-950">
                Υφιστάμενα μέλη
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Ρόλος</th>
                    <th className="px-6 py-3 font-semibold">Κατάσταση</th>
                    <th className="px-6 py-3 font-semibold">Δημιουργήθηκε</th>
                    <th className="px-6 py-3 font-semibold">Ενέργειες</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => {
                    const isCurrentUser = member.user_id === user?.id;
                    const isSuspended = member.status === "suspended";

                    return (
                      <tr key={member.membership_id}>
                        <td className="px-6 py-4 text-slate-950">{member.email}</td>
                        <td className="px-6 py-4 text-slate-700">
                          {roleLabels[member.role] ?? member.role}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {statusLabels[member.status] ?? member.status}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {new Date(member.created_at).toLocaleDateString("el-GR")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <form action={updateMemberRole} className="flex gap-2">
                              <input
                                type="hidden"
                                name="membershipId"
                                value={member.membership_id}
                              />
                              <select
                                name="role"
                                defaultValue={
                                  member.role === "owner" ? "admin" : member.role
                                }
                                disabled={member.role === "owner" && isCurrentUser}
                                className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-950"
                              >
                                {roleOptions.map((role) => (
                                  <option key={role.value} value={role.value}>
                                    {role.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="submit"
                                disabled={isSuspended}
                                className="rounded-lg border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                              >
                                Αλλαγή
                              </button>
                            </form>

                            <form action={disableMember}>
                              <input
                                type="hidden"
                                name="membershipId"
                                value={member.membership_id}
                              />
                              <button
                                type="submit"
                                disabled={isCurrentUser || isSuspended}
                                className="rounded-lg border border-red-200 px-3 py-1 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                Απενεργοποίηση
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
