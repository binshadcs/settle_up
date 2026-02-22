CREATE TABLE public.user_app_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_app_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own app data"
ON public.user_app_data
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own app data"
ON public.user_app_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own app data"
ON public.user_app_data
FOR UPDATE
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_app_data_updated_at ON public.user_app_data;
CREATE TRIGGER update_user_app_data_updated_at
BEFORE UPDATE ON public.user_app_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
