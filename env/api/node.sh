#!/usr/bin/with-contenv sh

cd "$NODE_APP_DIR"

if [ ! -d "node_modules" ]; then
  echo "==> Installing npm dependencies"
  npm install
fi

echo "==> Waiting for postgres to start"
/wait

echo "==> Starting the server"
npm run dev
