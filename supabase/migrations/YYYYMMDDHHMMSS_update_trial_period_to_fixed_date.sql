-- /supabase/migrations/YYYYMMDDHHMMSS_update_trial_period_to_fixed_date.sql

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
    '2025-05-23 23:59:59 UTC', -- New fixed trial end date
    new.raw_user_meta_data ->> 'user_agent', -- Extract user_agent
    coalesce(new.raw_app_meta_data ->> 'provider', 'email') -- Extract provider or default to 'email'
  );
  return new;
end;
$$;

-- Note: The trigger on_auth_user_created does not need to be redefined
-- as it already calls public.handle_new_user(). 