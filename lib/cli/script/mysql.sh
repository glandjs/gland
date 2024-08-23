#!/bin/bash
USER=$1
PASSWORD=$2
QUERY=$3

mysql -u$USER -p$PASSWORD -e "$QUERY"