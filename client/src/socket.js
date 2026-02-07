import { io } from 'socket.io-client'
import { SOCKET_URL } from './api'

let socket

export function getSocket(){
  if (!socket){
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 10
    })
  }
  return socket
}
