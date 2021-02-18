var http = require('http');
const express = require('express');

const app = express();
app.get('/', (req, res) => {
  console.log('Hello World');
  res.send('Hello World');
});
const server = http.createServer(app);

server.listen(3000, () => {
  console.log('App listening at port 3000');
});

module.exports = server;
