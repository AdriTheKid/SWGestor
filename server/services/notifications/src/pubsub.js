const { EventEmitter } = require('events');

function createPubSub({ redisUrl, channelPrefix='swgestor' }){
  if (redisUrl){
    const Redis = require('ioredis');
    const pub = new Redis(redisUrl);
    const sub = new Redis(redisUrl);
    const emitter = new EventEmitter();

    sub.on('message', (channel, payload) => {
      try { emitter.emit(channel, JSON.parse(payload)); } catch { /* ignore */ }
    });

    return {
      async subscribe(channel, handler){
        const full = `${channelPrefix}:${channel}`;
        emitter.on(full, handler);
        await sub.subscribe(full);
        return () => emitter.off(full, handler);
      },
      async publish(channel, message){
        const full = `${channelPrefix}:${channel}`;
        await pub.publish(full, JSON.stringify(message));
      }
    };
  }

  // fallback: in-process only (ok for local dev)
  const emitter = new EventEmitter();
  return {
    async subscribe(channel, handler){
      emitter.on(channel, handler);
      return () => emitter.off(channel, handler);
    },
    async publish(channel, message){
      emitter.emit(channel, message);
    }
  };
}

module.exports = { createPubSub };
