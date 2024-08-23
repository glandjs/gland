#!/bin/bash
USER=$1
PASSWORD=$2
QUERY=$3

export PGPASSWORD="$PASSWORD"
echo "$QUERY" | psql -U "$USER"
