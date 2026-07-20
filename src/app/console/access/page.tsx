import { redirect } from 'next/navigation';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import {
  createConsoleInviteAction,
  removeManufacturerMembershipAction,
  revokeConsoleInviteAction,
  saveManufacturerMembershipAction,
  updateProfileRoleAction,
} from '@/app/console/access/actions';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { buildInviteUrl } from '@/lib/console-invites';

type AccessProfile = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: 'super_admin' | 'vendor_editor' | 'user';
  created_at: string;
};

type MembershipRecord = {
  id: string;
  user_id: string;
  manufacturer_id: string;
  role: 'owner' | 'editor' | 'reviewer';
};

type ManufacturerRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type InviteRecord = {
  id: string;
  email: string;
  token: string;
  app_role: 'super_admin' | 'vendor_editor' | 'user';
  manufacturer_id: string | null;
  membership_role: 'owner' | 'editor' | 'reviewer' | null;
  status: 'pending' | 'accepted' | 'revoked';
  expires_at: string;
  accepted_at: string | null;
};

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function hasAssignedConsoleAccess(profile: AccessProfile, memberships: MembershipRecord[]) {
  if (profile.role === 'super_admin') {
    return true;
  }

  return profile.role === 'vendor_editor' && memberships.length > 0;
}

export default async function ConsoleAccessPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();

  if (session.profile.role !== 'super_admin') {
    redirect('/console');
  }

  const supabase = await createServerSupabaseClient();
  const searchParams = await props.searchParams;
  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);

  const [{ data: profiles }, { data: manufacturers }, { data: memberships }, { data: invites }] = await Promise.all([
    supabase.from('profiles').select('id,email,display_name,role,created_at').order('created_at', { ascending: false }),
    supabase.from('manufacturers').select('id,name,slug,status').order('name'),
    supabase.from('manufacturer_memberships').select('id,user_id,manufacturer_id,role').order('created_at', { ascending: false }),
    supabase
      .from('console_access_invites')
      .select('id,email,token,app_role,manufacturer_id,membership_role,status,expires_at,accepted_at')
      .order('created_at', { ascending: false }),
  ]);

  const manufacturerMap = new Map<string, ManufacturerRecord>(
    ((manufacturers ?? []) as ManufacturerRecord[]).map((manufacturer) => [manufacturer.id, manufacturer])
  );
  const membershipsByUser = ((memberships ?? []) as MembershipRecord[]).reduce<Record<string, MembershipRecord[]>>(
    (accumulator, membership) => {
      accumulator[membership.user_id] = accumulator[membership.user_id] ?? [];
      accumulator[membership.user_id].push(membership);
      return accumulator;
    },
    {}
  );
  const inviteToken = getMessage(searchParams.inviteToken);
  const pendingInvites = ((invites ?? []) as InviteRecord[]).filter((invite) => invite.status === 'pending');
  const recentResolvedInvites = ((invites ?? []) as InviteRecord[]).filter((invite) => invite.status !== 'pending').slice(0, 6);

  return (
    <ConsoleShell
      session={session}
      title="Access Control"
      description="Grant console roles, assign manufacturer scope, and manage the approval step after account registration."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Workflow</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Registration and approval</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                New users can create an account from `/console/login`. They only get console access after you assign a
                `vendor_editor` role plus at least one manufacturer membership, or elevate them to `super_admin`.
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              Pending accounts remain visible here even before access is granted.
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Registered Accounts</div>
            <div className="mt-2 text-4xl font-bold text-white">{profiles?.length ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Assigned Memberships</div>
            <div className="mt-2 text-4xl font-bold text-white">{memberships?.length ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Manufacturers Available</div>
            <div className="mt-2 text-4xl font-bold text-white">{manufacturers?.length ?? 0}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Invite Registration</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">Create invitation links</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Invitations pre-authorize a future account. When the invited email finishes signup and verification, the
                trigger applies the assigned role and manufacturer membership automatically.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-sm text-slate-300">
              Pending invites: <span className="font-semibold text-white">{pendingInvites.length}</span>
            </div>
          </div>

          {inviteToken ? (
            <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="text-sm font-semibold text-white">Latest invite link</div>
              <div className="mt-2 break-all text-sm text-emerald-200">{buildInviteUrl(inviteToken)}</div>
            </div>
          ) : null}

          <form action={createConsoleInviteAction} className="mt-6 grid gap-4 xl:grid-cols-2">
            <label className="text-sm text-slate-300">
              Invite email
              <input
                name="email"
                type="email"
                required
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              />
            </label>

            <label className="text-sm text-slate-300">
              App role
              <select
                name="app_role"
                defaultValue="vendor_editor"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              >
                <option value="vendor_editor">vendor_editor</option>
                <option value="super_admin">super_admin</option>
                <option value="user">user</option>
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Manufacturer
              <select
                name="manufacturer_id"
                defaultValue=""
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              >
                <option value="">No manufacturer scope</option>
                {((manufacturers ?? []) as ManufacturerRecord[]).map((manufacturer) => (
                  <option key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Membership role
              <select
                name="membership_role"
                defaultValue="editor"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              >
                <option value="editor">editor</option>
                <option value="owner">owner</option>
                <option value="reviewer">reviewer</option>
              </select>
            </label>

            <label className="text-sm text-slate-300">
              Expires in days
              <input
                name="expires_in_days"
                type="number"
                min={1}
                max={30}
                defaultValue={7}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              />
            </label>

            <label className="text-sm text-slate-300">
              Notes
              <input
                name="notes"
                type="text"
                placeholder="Optional context for this invite"
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
              />
            </label>

            <div className="xl:col-span-2">
              <button
                type="submit"
                className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                Create Invite Link
              </button>
            </div>
          </form>

          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
              <div className="text-sm font-semibold text-white">Pending invites</div>
              <div className="mt-4 space-y-3">
                {pendingInvites.length > 0 ? (
                  pendingInvites.map((invite) => (
                    <div key={invite.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <div className="font-medium text-white">{invite.email}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {invite.app_role}
                        {invite.membership_role ? ` · ${invite.membership_role}` : ''}
                        {invite.manufacturer_id ? ` · ${manufacturerMap.get(invite.manufacturer_id)?.name ?? 'Unknown manufacturer'}` : ''}
                      </div>
                      <div className="mt-3 break-all text-xs text-emerald-300">{buildInviteUrl(invite.token)}</div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                        <span>Expires {new Date(invite.expires_at).toLocaleString()}</span>
                        <form action={revokeConsoleInviteAction}>
                          <input type="hidden" name="invite_id" value={invite.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:border-rose-400 hover:text-white"
                          >
                            Revoke
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500">
                    No pending invites.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
              <div className="text-sm font-semibold text-white">Recent resolved invites</div>
              <div className="mt-4 space-y-3">
                {recentResolvedInvites.length > 0 ? (
                  recentResolvedInvites.map((invite) => (
                    <div key={invite.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                      <div className="font-medium text-white">{invite.email}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {invite.status}
                        {invite.accepted_at ? ` · ${new Date(invite.accepted_at).toLocaleString()}` : ''}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500">
                    No resolved invites yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {((profiles ?? []) as AccessProfile[]).map((profile) => {
            const userMemberships = membershipsByUser[profile.id] ?? [];
            const accessGranted = hasAssignedConsoleAccess(profile, userMemberships);

            return (
              <div key={profile.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-white">{profile.display_name ?? 'Unnamed user'}</div>
                    <div className="mt-1 text-sm text-slate-400">{profile.email ?? 'No email available'}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-slate-700 bg-black/30 px-3 py-1 text-xs text-slate-300">
                        App role: {profile.role}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          accessGranted
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        {accessGranted ? 'Console access granted' : 'Pending access assignment'}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-500">Created {new Date(profile.created_at).toLocaleString()}</div>
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
                    <div className="text-sm font-semibold text-white">Profile role</div>
                    <p className="mt-1 text-sm text-slate-400">
                      `super_admin` has global control. `vendor_editor` needs manufacturer scope to enter console.
                    </p>

                    <form action={updateProfileRoleAction} className="mt-4 flex flex-wrap items-end gap-3">
                      <input type="hidden" name="user_id" value={profile.id} />
                      <label className="min-w-[220px] flex-1 text-sm text-slate-300">
                        Application role
                        <select
                          name="role"
                          defaultValue={profile.role}
                          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                        >
                          <option value="super_admin">super_admin</option>
                          <option value="vendor_editor">vendor_editor</option>
                          <option value="user">user</option>
                        </select>
                      </label>

                      <button
                        type="submit"
                        className="rounded-full border border-slate-700 px-4 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
                      >
                        Save Role
                      </button>
                    </form>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-black/30 p-5">
                    <div className="text-sm font-semibold text-white">Manufacturer memberships</div>
                    <p className="mt-1 text-sm text-slate-400">
                      Memberships define the vendor scope available inside chips and benchmark management.
                    </p>

                    <div className="mt-4 space-y-3">
                      {userMemberships.length > 0 ? (
                        userMemberships.map((membership) => {
                          const manufacturer = manufacturerMap.get(membership.manufacturer_id);

                          return (
                            <div
                              key={membership.id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3"
                            >
                              <div>
                                <div className="font-medium text-white">{manufacturer?.name ?? 'Unknown manufacturer'}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                  membership role: {membership.role}
                                  {manufacturer?.status ? ` · ${manufacturer.status}` : ''}
                                </div>
                              </div>

                              <form action={removeManufacturerMembershipAction}>
                                <input type="hidden" name="membership_id" value={membership.id} />
                                <button
                                  type="submit"
                                  className="rounded-full border border-rose-500/30 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400 hover:text-white"
                                >
                                  Remove
                                </button>
                              </form>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-800 px-4 py-5 text-sm text-slate-500">
                          No manufacturer memberships assigned yet.
                        </div>
                      )}
                    </div>

                    <form action={saveManufacturerMembershipAction} className="mt-5 grid gap-3 md:grid-cols-2">
                      <input type="hidden" name="user_id" value={profile.id} />
                      <label className="text-sm text-slate-300">
                        Manufacturer
                        <select
                          name="manufacturer_id"
                          required
                          defaultValue=""
                          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                        >
                          <option value="" disabled>
                            Select manufacturer
                          </option>
                          {((manufacturers ?? []) as ManufacturerRecord[]).map((manufacturer) => (
                            <option key={manufacturer.id} value={manufacturer.id}>
                              {manufacturer.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="text-sm text-slate-300">
                        Membership role
                        <select
                          name="membership_role"
                          defaultValue="editor"
                          className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                        >
                          <option value="owner">owner</option>
                          <option value="editor">editor</option>
                          <option value="reviewer">reviewer</option>
                        </select>
                      </label>

                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                        >
                          Save Membership
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ConsoleShell>
  );
}
