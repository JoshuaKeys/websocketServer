module.exports = function sendToOtherUser(connection, message) {
  connection.send(JSON.stringify(message));
};
