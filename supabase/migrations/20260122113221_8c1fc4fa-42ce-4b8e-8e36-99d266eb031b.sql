DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Admins can insert user roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can insert user roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Admins can update user roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update user roles" ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_roles'
      AND policyname = 'Admins can delete user roles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can delete user roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), ''admin''::public.app_role))';
  END IF;
END $$;