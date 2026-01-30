#! /bin/bash

docker run --name fitcheck \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=fitness_tracker \
  -p 5432:5432 \
  -d postgres:16

sleep 15

cd ../db

psql \
  -h localhost \
  -p 5432 \
  -U postgres \
  -d fitness_tracker \
  -f schema.sql

echo "PostgreSQL is running on port 5432"