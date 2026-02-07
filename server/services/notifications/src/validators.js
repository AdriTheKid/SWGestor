const { z } = require('zod');

const sendMessageSchema = z.object({
  room: z.string().min(1).max(120),
  user: z.string().min(1).max(80),
  message: z.string().min(1).max(1000)
});

const notifySchema = z.object({
  room: z.string().min(1).max(120),
  type: z.enum(['info','success','warning','error']).default('info'),
  title: z.string().min(1).max(120),
  body: z.string().max(500).optional().default('')
});

module.exports = { sendMessageSchema, notifySchema };
