-- Sync auth.users.email changes to public.users.email
-- Triggered after Supabase confirms an email change via the built-in flow

CREATE OR REPLACE FUNCTION sync_email_to_public_users()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.users
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS sync_email_change ON auth.users;
CREATE TRIGGER sync_email_change
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_to_public_users();
