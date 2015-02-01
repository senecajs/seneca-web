if [ ! -d "./node_modules/seneca" ]; then
  npm install seneca@plugin
fi

if [ ! -d "./node_modules/express" ]; then
  npm install express@4
fi

if [ ! -d "./node_modules/body-parser" ]; then
  npm install body-parser@1
fi

if [ ! -d "./node_modules/needle" ]; then
  npm install needle@0
fi


./node_modules/.bin/mocha test/*.test.js

node test/example.js --seneca.log=level:warn &
NODE_PID=$!
sleep 1
GET_FOO_BAR=`curl -m 1 -s http://localhost:3000/my-api/bar?zoo=a`
POST_FOO_QAZ=`curl -m 1 -s -H 'Content-Type: application/json' -d '{"zoo":"b"}' http://localhost:3000/my-api/qaz`
ZED=`curl -m 1 -s http://localhost:3000/zed`
COLOR_RED=`curl -m 1 -s http://localhost:3000/color/red`
COLOR_GREEN=`curl -m 1 -s http://localhost:3000/color/green`
COLOR_BLUE=`curl -m 1 -s http://localhost:3000/color/blue`
kill -9 $NODE_PID

if [ $GET_FOO_BAR != '{"bar":"ab"}' ]; then
  echo "FAIL: $GET_FOO_BAR"
  exit 1
else
  echo "PASS: $GET_FOO_BAR"
fi

if [ $POST_FOO_QAZ != '{"qaz":"bz"}' ]; then
  echo "FAIL: $POST_FOO_QAZ"
  exit 1
else
  echo "PASS: $POST_FOO_QAZ"
fi

if [ $ZED != '{"dez":2}' ]; then
  echo "FAIL: $ZED"
  exit 1
else
  echo "PASS: $ZED"
fi


if [ $COLOR_RED != '{"color":"#F00"}' ]; then
  echo "FAIL: $COLOR_RED"
  exit 1
else
  echo "PASS: $COLOR_RED"
fi

if [ $COLOR_GREEN != '{"color":"#0F0"}' ]; then
  echo "FAIL: $COLOR_GREEN"
  exit 1
else
  echo "PASS: $COLOR_GREEN"
fi

if [ $COLOR_BLUE != '{"color":"#00F"}' ]; then
  echo "FAIL: $COLOR_BLUE"
  exit 1
else
  echo "PASS: $COLOR_BLUE"
fi



node test/test-server.js --seneca.log=level:fatal &
NODE_PID=$!
sleep 1
node test/test-client.js
kill -9 $NODE_PID
