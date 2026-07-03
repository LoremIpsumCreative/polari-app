-- handle_new_user is only meant to run as the auth.users insert trigger, never as a direct RPC call
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- record_daily_engagement should only be callable by signed-in users, not anon
revoke execute on function public.record_daily_engagement() from public;
revoke execute on function public.record_daily_engagement() from anon;
grant execute on function public.record_daily_engagement() to authenticated;
