var http = require('http');
const express = require('express');

const app = express();
app.use(express.static('public'));
const server = http.createServer(app);
app.get('/test', (req, res) => {
  res.send('Hello World');
});
server.listen(3000, () => {
  console.log('App listening at port 3000');
});

module.exports = server;
