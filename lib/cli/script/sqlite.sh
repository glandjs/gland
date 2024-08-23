#!/bin/bash
DB_FILE=$1
QUERY=$2

echo "$QUERY" | sqlite3 "$DB_FILE"
