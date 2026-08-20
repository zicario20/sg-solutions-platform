-- Drizzle custom migration generated with:
-- drizzle-kit generate --custom --name m004_communications_role_bootstrap
--
-- PostgreSQL roles are cluster-global while Drizzle migrations are database-local. The guarded
-- bootstrap makes the chain reproducible in multiple disposable databases on one cluster.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'atlas_communications_gateway') THEN
    CREATE ROLE atlas_communications_gateway
      NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
  END IF;

  ALTER ROLE atlas_communications_gateway WITH
    NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS;
END
$$;
