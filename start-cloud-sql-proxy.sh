#!/bin/bash
echo "🔗 Starting Cloud SQL Proxy..."
./cloud_sql_proxy -instances=lfa-legacy-go:europe-west1:lfa-legacy-go-postgres=tcp:5432 &
PROXY_PID=$!
echo "Cloud SQL Proxy started with PID: $PROXY_PID"
echo "To stop proxy: kill $PROXY_PID"
echo "Connection available at: localhost:5432"
