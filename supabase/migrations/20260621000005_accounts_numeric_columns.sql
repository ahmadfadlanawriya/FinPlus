-- credit_limit, balance_owed, and points were typed as integer.
-- Investment tracking needs decimals (fractional shares, USD prices, coupon rates).
ALTER TABLE public.accounts
  ALTER COLUMN credit_limit TYPE numeric USING credit_limit::numeric,
  ALTER COLUMN balance_owed TYPE numeric USING balance_owed::numeric,
  ALTER COLUMN points       TYPE numeric USING points::numeric;
