-- Migration: Add function to get expiring subscriptions
-- This function returns premium users whose subscription expires in 7, 3, or 1 days

CREATE OR REPLACE FUNCTION public.get_expiring_subscriptions()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  tier TEXT,
  end_date TIMESTAMPTZ,
  days_until_expiry INT,
  remaining_credits INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.user_id,
    au.email::TEXT,
    COALESCE(au.raw_user_meta_data->>'full_name', 'User')::TEXT as full_name,
    us.tier::TEXT,
    us.subscription_end_date as end_date,
    DATE_PART('day', us.subscription_end_date::timestamp - NOW()::timestamp)::INT as days_until_expiry,
    GREATEST(0, us.invoice_limit - us.current_month_count)::INT as remaining_credits
  FROM user_subscriptions us
  JOIN auth.users au ON us.user_id = au.id
  WHERE
    us.tier = 'premium'
    AND us.subscription_end_date IS NOT NULL
    AND DATE_PART('day', us.subscription_end_date::timestamp - NOW()::timestamp) IN (7, 3, 1);
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION public.get_expiring_subscriptions() TO service_role;
