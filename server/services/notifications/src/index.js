require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { ChatMessage } = require('./models');
const { sendMessageSchema, notifySchema } = require('./validators');
const { createPubSub } = require('./pubsub');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(compression());

const PORT = process.env.PORT || 3003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/swgestor_chat';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_ORIGIN, methods: ['GET','POST'] }
});

const pubsub = createPubSub({ redisUrl: process.env.REDIS_URL || '' });

// Rooms: project:<projectId> (chat + notifications) OR "global"
io.on('connection', (socket) => {
  socket.on('join', async ({ room }) => {
    if (!room) return;
    socket.join(room);
    socket.emit('joined', { room });
  });

  socket.on('leave', async ({ room }) => {
    if (!room) return;
    socket.leave(room);
  });

  // direct chat via socket (client)
  socket.on('chat:send', async (payload, ack) => {
    try{
      const data = sendMessageSchema.parse(payload);
      const doc = await ChatMessage.create(data);
      const msg = { ...doc.toObject(), id: doc._id.toString() };
      await pubsub.publish(`chat:${data.room}`, msg);
      ack && ack({ ok:true, msg });
    }catch(e){
      ack && ack({ ok:false, error: e.message });
    }
  });
});

// Bridge pubsub -> socket rooms
(async () => {
  await pubsub.subscribe('chat:*', (msg) => {
    // wildcard not supported in fallback; handled via explicit topics from rest endpoints
  });
})().catch(()=>{});

// REST: history
app.get('/health', (req,res)=>res.json({ ok:true, service:'notifications' }));

app.get('/chat/:room', async (req,res)=>{
  const room = req.params.room;
  const limit = Math.min(parseInt(req.query.limit || '30',10), 100);
  const rows = await ChatMessage.find({ room }).sort({ createdAt: -1 }).limit(limit).lean();
  res.json(rows.reverse());
});

// REST: send chat (useful for gateway to publish events)
app.post('/chat', async (req,res)=>{
  try{
    const data = sendMessageSchema.parse(req.body);
    const doc = await ChatMessage.create(data);
    const msg = { ...doc.toObject(), id: doc._id.toString() };
    io.to(data.room).emit('chat:new', msg);
    res.status(201).json(msg);
  }catch(e){
    res.status(400).json({ message:'Datos inválidos', error: e.message });
  }
});

// REST: generic notification
app.post('/notify', async (req,res)=>{
  try{
    const data = notifySchema.parse(req.body);
    io.to(data.room).emit('notify', { ...data, ts: new Date().toISOString() });
    res.status(201).json({ ok:true });
  }catch(e){
    res.status(400).json({ message:'Datos inválidos', error: e.message });
  }
});

async function start(){
  try{
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    console.log('[notifications] MongoDB connected:', MONGODB_URI);
    server.listen(PORT, ()=>console.log(`[notifications] running on http://localhost:${PORT}`));
  }catch(e){
    console.error('[notifications] failed to start:', e.message);
    process.exit(1);
  }
}
start();

module.exports = { app, server, io };
