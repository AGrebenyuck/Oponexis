#!/bin/bash

echo "Starting Next.js..."
npm run dev &

NEXT_PID=$!
sleep 2

echo "Starting ngrok..."
ngrok http 3000 > scripts/ngrok.log &
NGROK_PID=$!

sleep 3
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[0-9a-z\-]*\.ngrok.io' | head -n1)

echo ""
echo "--------------------------------------------------"
echo "✔ NGROK готов: $NGROK_URL"
echo "✔ Укажи этот адрес в Zadarma:"
echo "$NGROK_URL/api/zadarma-webhook"
echo "--------------------------------------------------"
echo ""

tail -f scripts/ngrok.log

trap "kill $NEXT_PID $NGROK_PID" EXIT