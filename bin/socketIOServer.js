// const { token } = require('morgan')
const io = require('socket.io')
function start(server, options) {
    const ioServer = io(server, options)
    const rooms = {};
    const socks = {};
    ioServer.on('connection', (socket, req) => {
        console.log(`${socket.id}连接成功`)
        socket.emit(WebSocketType.CONNECTION_SUCCESS, socket.id)
        socket.on(WebSocketType.USER_LEAVE, user => {
            const { userName, roomId, sockId} = user
            console.log(`userName: ${userName}, roomId: ${roomId}, sockId: ${sockId} 断开了连接...`);
            if (roomId && rooms[roomId] && rooms[roomId].length) {
                rooms[roomId] = rooms[roomId].filter(item => item.sockId !== sockId);
                console.log(rooms[roomId])
                ioServer.in(roomId).emit(WebSocketType.USER_LEAVE, rooms[roomId]);
                console.log(`userName: ${userName}, roomId: ${roomId}, sockId: ${sockId} 离开了房间...`);
            }
        })
        socket.on(WebSocketType.CHECK_ROOM, ({ userName, roomId, sockId } = user) => {
          socket.user = { userName, roomId, sockId }
            rooms[roomId] = rooms[roomId] || [];
            socket.emit(WebSocketType.CHECK_ROOM_SUCCESS, rooms[roomId]);
            if (rooms[roomId].length > 1) return false;
            rooms[roomId].push({ userName, roomId, sockId});
            // console.log(socket.join(roomId))
            socket.join(roomId, () => {
                // ioServer.in(roomId).emit(WebSocketType.JOIN_ROOM_SUCCESS, rooms[roomId]);
                // socks[sockId] = socket;
                // console.log(`userName: ${userName}, roomId: ${roomId}, sockId: ${sockId} 成功加入房间!!!`);
            });
            ioServer.in(roomId).emit(WebSocketType.JOIN_ROOM_SUCCESS, rooms[roomId]);
            socks[sockId] = socket;
            console.log(`userName: ${userName}, roomId: ${roomId}, sockId: ${sockId} 成功加入房间!!!`);
        })
        // 发送视频
        socket.on(WebSocketType.TO_SEND_VIDEO, (user) => {
          console.log(`${user.sockId} 发出视频邀请, ${user.roomId}`)
          ioServer.in(user.roomId).emit(WebSocketType.RECEIVE_VIDEO, user);
        });
        // 取消发送视频
        socket.on(WebSocketType.CANCEL_SEND_VIDEO, (user) => {
          ioServer.in(user.roomId).emit(WebSocketType.CANCEL_SEND_VIDEO, user);
        });
        // 接收视频邀请
        socket.on(WebSocketType.RECEIVE_VIDEO, (user) => {
            ioServer.in(user.roomId).emit(WebSocketType.RECEIVE_VIDEO, user);
        });
        // 拒绝接收视频
        socket.on(WebSocketType.REJECT_RECEIVE_VIDEO, (user) => {
            ioServer.in(user.roomId).emit(WebSocketType.REJECT_RECEIVE_VIDEO, user);
        });
        // 接听视频
        socket.on(WebSocketType.ANSWER_VIDEO, (user) => {
            ioServer.in(user.roomId).emit(WebSocketType.ANSWER_VIDEO, user);
        });
        // 挂断视频
        socket.on(WebSocketType.HANG_UP_VIDEO, (user) => {
            ioServer.in(user.roomId).emit(WebSocketType.HANG_UP_VIDEO, user);
        });
        // addIceCandidate
        socket.on(WebSocketType.ADD_ICE_CANDIDATE, (data) => {
            const toUser = rooms[data.user.roomId].find(item=>item.sockId!==data.user.sockId);
            socks[toUser.sockId].emit(WebSocketType.ADD_ICE_CANDIDATE, data.candidate);
        });
        socket.on(WebSocketType.RECEIVE_OFFER, (data) => {
            const toUser = rooms[data.user.roomId].find(item=>item.sockId!==data.user.sockId);
            socks[toUser.sockId].emit(WebSocketType.RECEIVE_OFFER, data.offer);
        });
        socket.on(WebSocketType.RECEIVE_ANSWER, (data) => {
            const toUser = rooms[data.user.roomId].find(item=>item.sockId!==data.user.sockId);
            socks[toUser.sockId].emit(WebSocketType.RECEIVE_ANSWER, data.answer);
        });
        socket.on('disconnect', data => {
          console.log('disconnect', data, socket.user)
          if (!socket.user) {
            return
          }
          const { userName, roomId, sockId} = socket.user
          console.log(`userName: ${userName}, roomId: ${roomId}, sockId: ${sockId} 断开了连接...`);
          if (roomId && rooms[roomId] && rooms[roomId].length) {
              rooms[roomId] = rooms[roomId].filter(item => item.sockId !== sockId);
              console.log(rooms[roomId])
              ioServer.in(roomId).emit(WebSocketType.USER_LEAVE, rooms[roomId]);
              console.log(`userName: ${userName}, roomId: ${roomId}, sockId: ${sockId} 离开了房间...`);
          }
          // socket.emit(WebSocketType.USER_LEAVE, socket.user)
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
    ANSWER_VIDEO: 6,
    RECEIVE_OFFER: 7,
    ADD_ICE_CANDIDATE: 8,
    RECEIVE_ANSWER: 9,
    CANCEL_SEND_VIDEO: 10,
    RECEIVE_VIDEO: 11,
    REJECT_RECEIVE_VIDEO: 12,
    HANG_UP_VIDEO: 13,
    TO_SEND_VIDEO: 14,
    CONNECTION_SUCCESS: 15
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