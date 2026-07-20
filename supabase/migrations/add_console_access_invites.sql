create table if not exists public.console_access_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  app_role text not null default 'vendor_editor' check (app_role in ('super_admin', 'vendor_editor', 'user')),
  manufacturer_id uuid references public.manufacturers(id) on delete set null,
  membership_role text check (membership_role in ('owner', 'editor', 'reviewer')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  expires_at timestamp without time zone not null,
  invited_by uuid references public.profiles(id),
  accepted_by uuid references public.profiles(id),
  accepted_at timestamp without time zone,
  notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  check (
    (app_role = 'super_admin' and manufacturer_id is null and membership_role is null)
    or (app_role = 'vendor_editor' and manufacturer_id is not null and membership_role is not null)
    or (app_role = 'user' and manufacturer_id is null and membership_role is null)
  )
);

create unique index if not exists console_access_invites_pending_email_idx
  on public.console_access_invites (lower(email))
  where status = 'pending';

create index if not exists console_access_invites_token_idx
  on public.console_access_invites (token);

create index if not exists console_access_invites_status_idx
  on public.console_access_invites (status);

drop trigger if exists console_access_invites_set_updated_at on public.console_access_invites;
create trigger console_access_invites_set_updated_at
before update on public.console_access_invites
for each row
execute function public.set_updated_at_timestamp();

alter table public.console_access_invites enable row level security;

drop policy if exists "Console access invites manageable by admins" on public.console_access_invites;
drop policy if exists "Public can read active console invite by token" on public.console_access_invites;

create policy "Console access invites manageable by admins"
  on public.console_access_invites
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Public can read active console invite by token"
  on public.console_access_invites
  for select
  to anon, authenticated
  using (status = 'pending' and expires_at > now());

create or replace function public.apply_console_access_invite_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.console_access_invites%rowtype;
  derived_name text;
  assigned_role text;
begin
  select *
  into invite_record
  from public.console_access_invites
  where lower(email) = lower(coalesce(new.email, ''))
    and status = 'pending'
    and expires_at > now()
  order by created_at desc
  limit 1;

  if not found then
    return new;
  end if;

  assigned_role := invite_record.app_role;

  if invite_record.app_role <> 'super_admin'
    and not exists (
      select 1
      from public.profiles
      where role = 'super_admin'
        and id <> new.id
    ) then
    assigned_role := 'super_admin';
  end if;

  derived_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, nullif(derived_name, ''), assigned_role)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        role = assigned_role;

  if invite_record.manufacturer_id is not null and invite_record.membership_role is not null then
    insert into public.manufacturer_memberships (manufacturer_id, user_id, role)
    values (invite_record.manufacturer_id, new.id, invite_record.membership_role)
    on conflict (manufacturer_id, user_id) do update
      set role = excluded.role;
  end if;

  update public.console_access_invites
  set status = 'accepted',
      accepted_by = new.id,
      accepted_at = now(),
      updated_at = now()
  where id = invite_record.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_apply_console_access_invite on auth.users;
create trigger on_auth_user_created_apply_console_access_invite
after insert on auth.users
for each row
execute function public.apply_console_access_invite_for_user();
