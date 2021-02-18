const httpServer = require('./server');
const webSocketServ = require('websocket').server;
const handleWsMsg = require('./lib/helpers/handleWsMsg');
var wss = new webSocketServ({
  httpServer,
});

var users = {};
var otherUser;
function originIsAllowed(origin) {
  return true;
}

wss.on('request', (request) => {
  console.log(request.origin);
  if (!originIsAllowed(request.origin)) {
    request.reject();
    return;
  }
  var conn = request.accept('echo-protocol', request.origin);

  conn.on('message', function (message) {
    var data;
    try {
      data = JSON.parse(message.utf8Data);
      console.log(data);
    } catch (e) {
      console.log('Invalid JSON');
      data = {};
    }
    handleWsMsg(data, conn, users);
  });

  conn.on('close', function () {
    console.log('Connection closed');
    if (conn.name) {
      delete users[conn.name];
      if (conn.otherUser) {
        var connect = users[conn.otherUser];
        conn.otherUser = null;

        if (conn != null) {
          sendToOtherUser(connect, {
            type: 'leave',
          });
        }
      }
    }
  });

  conn.send(JSON.stringify({ msg: 'Hello World' }));
});

wss.on('connection', function (conn) {
  console.log('User connected');
});
