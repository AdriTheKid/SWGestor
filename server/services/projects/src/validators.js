const { z } = require('zod');

const createProjectSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(240).optional().default('')
});

module.exports = { createProjectSchema };
