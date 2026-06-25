#!/bin/bash
export PGPASSWORD=postgres

# Wait for postgres to be ready
until psql -h localhost -p 15432 -U postgres -d integrity -c '\q'; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done

echo "Postgres is up - applying migrations"
for f in migrations/*.sql; do
  psql -h localhost -p 15432 -U postgres -d integrity -f "$f"
done

echo "Applying seeds"
psql -h localhost -p 15432 -U postgres -d integrity -f seed.sql
psql -h localhost -p 15432 -U postgres -d integrity -f seed_xibalba_agent.sql
psql -h localhost -p 15432 -U postgres -d integrity -f seed_wallet.sql
psql -h localhost -p 15432 -U postgres -d integrity -f seed_loans.sql
psql -h localhost -p 15432 -U postgres -d integrity -f seed_full_agent.sql

echo "Done"
