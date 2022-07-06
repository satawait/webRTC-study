// const { token } = require('morgan')
const io = require('socket.io')
function start(server) {
    const ioServer = io(server)
    ioServer.on('connection', (socket, req) => {
          sendAll(ioServer, 'hello')
        socket.on(WebSocketType.CHECK_ROOM, data => {
          
        })
        socket.on(WebSocketType.USER_LEAVE, data => {
          
        })
        socket.on('disconnect', () => {
          sendAll(ioServer, 'leave')
        })
    })
}

const WebSocketType = {
    ERROR: 0,
    SUCCESS: 1,
    USER_LEAVE: 2,
    CHECK_ROOM: 3,
    CHECK_ROOM_SUCCESS: 4,
    JOIN_ROOM_SUCCESS: 5,
    ANSWER_VIDEO: 6
  }
  
  function createMessage(user, data) {
    return JSON.stringify({
      user,
      data
    })
  }

  function sendAll(ioServer, data) {
    ioServer.sockets.emit(WebSocketType.JOIN_ROOM_SUCCESS, data)
  }
module.exports = start