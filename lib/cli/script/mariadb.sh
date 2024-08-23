#!/bin/bash
USER=$1
PASSWORD=$2
QUERY=$3

echo "$QUERY" | mariadb -u "$USER" -p"$PASSWORD"