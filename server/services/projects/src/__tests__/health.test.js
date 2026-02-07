const request = require('supertest');
const app = require('../index'); // app exported

describe('projects service', () => {
  it('health ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
