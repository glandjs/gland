#!/bin/bash
USER=$1
PASSWORD=$2
QUERY=$3

echo "$QUERY" | sqlcmd -U "$USER" -P "$PASSWORD"