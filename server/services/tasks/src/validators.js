const { z } = require('zod');

const createTaskSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(120),
  description: z.string().max(600).optional().default(''),
  status: z.enum(['todo','doing','done']).optional(),
  priority: z.enum(['low','medium','high']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignee: z.string().max(120).optional().default('')
});

const updateTaskSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(600).optional(),
  status: z.enum(['todo','doing','done']).optional(),
  priority: z.enum(['low','medium','high']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assignee: z.string().max(120).optional()
}).strict();

module.exports = { createTaskSchema, updateTaskSchema };
