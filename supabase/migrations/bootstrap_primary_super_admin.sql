update public.profiles
set role = 'super_admin'
where lower(email) = lower('josteingaarder@163.com');

update public.console_access_invites
set status = 'revoked',
    updated_at = now(),
    notes = trim(both ' ' from concat(coalesce(notes, ''), ' superseded by bootstrap super admin access'))
where lower(email) = lower('josteingaarder@163.com')
  and status = 'pending'
  and app_role <> 'super_admin';

insert into public.console_access_invites (
  email,
  token,
  app_role,
  expires_at,
  notes
)
select
  'josteingaarder@163.com',
  gen_random_uuid()::text,
  'super_admin',
  now() + interval '30 days',
  'Bootstrap super admin access for the primary admin email.'
where not exists (
    select 1
    from public.profiles
    where lower(email) = lower('josteingaarder@163.com')
  )
  and not exists (
    select 1
    from public.console_access_invites
    where lower(email) = lower('josteingaarder@163.com')
      and status = 'pending'
      and app_role = 'super_admin'
  );
