-- /supabase/migrations/20230101000000_create_profile_on_signup.sql

-- Function to handle new user signup and create a profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, trial_ends_at, user_agent, signup_method)
  values (
    new.id,
    'user', -- Default role
    now() + interval '24 hours', -- Trial period
    new.raw_user_meta_data ->> 'user_agent', -- Extract user_agent
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') -- Extract provider or default to 'email'
  );
  return new;
end;
$$;

-- Trigger to call handle_new_user after a new user is created in auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 