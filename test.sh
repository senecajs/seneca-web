if [ ! -d "./node_modules/seneca" ]; then
  npm install git://github.com/rjrodger/seneca#0.6.0
fi

if [ ! -d "./node_modules/express" ]; then
  npm install express@4
fi

./node_modules/.bin/mocha test/*.test.js

node test/example.js &
NODE_PID=$!
sleep 1
FOO_BAR=`curl -m 1 -s http://localhost:3000/foo/bar?zoo=a`
kill -9 $NODE_PID

if [ $FOO_BAR != '{"xbar":"ab"}' ]; then
  echo "FAIL: $FOO_BAR"
  exit 1
fi



