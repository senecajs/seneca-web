if [ ! -d "./node_modules/seneca" ]; then
  npm install seneca
fi
./node_modules/.bin/mocha test/*.test.js
