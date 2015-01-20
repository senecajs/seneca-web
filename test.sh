if [ ! -d "./node_modules/seneca" ]; then
  npm install git://github.com/rjrodger/seneca#0.6.0
fi

if [ ! -d "./node_modules/express" ]; then
  npm install express@4
fi

./node_modules/.bin/mocha test/*.test.js

node test/example.js --seneca.log.quiet &
NODE_PID=$!
sleep 1
FOO_BAR=`curl -m 1 -s http://localhost:3000/foo/bar?zoo=a`
ZED=`curl -m 1 -s http://localhost:3000/zed`
kill -9 $NODE_PID

if [ $FOO_BAR != '{"bar":"ab"}' ]; then
  echo "FAIL: $FOO_BAR"
  exit 1
else
  echo "PASS: $FOO_BAR"
fi

if [ $ZED != '{"dez":2}' ]; then
  echo "FAIL: $ZED"
  exit 1
else
  echo "PASS: $ZED"
fi



