-- Update handle_new_user function to support paid signups
-- This migration updates the trigger function to check user metadata for subscription tier

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  selected_tier text;
  is_trial_signup boolean;
  subscription_tier_value text;
  subscription_status_value text;
begin
  -- Extract signup metadata
  selected_tier := new.raw_user_meta_data ->> 'selected_tier';
  is_trial_signup := coalesce((new.raw_user_meta_data ->> 'is_trial_signup')::boolean, true);
  
  -- Determine subscription tier and status based on signup type
  if selected_tier is not null and selected_tier in ('accelerator', 'optimizer', 'enterprise') then
    if is_trial_signup = false then
      -- Paid signup: set tier but inactive status (no stripe_customer_id yet)
      subscription_tier_value := selected_tier;
      subscription_status_value := 'inactive';
    else
      -- Trial signup: no tier set, trial status
      subscription_tier_value := null;
      subscription_status_value := 'trial';
    end if;
  else
    -- Default: trial signup
    subscription_tier_value := null;
    subscription_status_value := 'trial';
  end if;

  insert into public.profiles (
    id, 
    role, 
    trial_ends_at, 
    user_agent, 
    signup_method,
    subscription_tier,
    subscription_status
  )
  values (
    new.id,
    'user', -- Default role
    now() + interval '24 hours', -- Trial period
    new.raw_user_meta_data ->> 'user_agent', -- Extract user_agent
    coalesce(new.raw_app_meta_data ->> 'provider', 'email'), -- Extract provider or default to 'email'
    subscription_tier_value,
    subscription_status_value
  );
  return new;
end;
$$;