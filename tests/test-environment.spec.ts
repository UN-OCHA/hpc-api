import ContextProvider from './testContext';

const context = ContextProvider.Instance;

describe('Ensure test Environment is setup correctly', () => {
  it('should be able to run a test', () => {
    expect(true).toBe(true);
  });
});

describe('ContextProvider should be defined', () => {
  it('should be defined', () => {
    expect(context).toBeDefined();
  });

  it('should have a connection', () => {
    expect(context.conn).toBeDefined();
  });

  it('connection should be a knex connection', () => {
    expect(context.conn).toBeDefined();
    expect(context.conn?.client.config.client).toEqual('pg');
  });

  it('knex connection should be connected', async () => {
    expect(context.conn).toBeDefined();
    const res = await context.conn?.raw('SELECT NOW()');
    expect(res.rows[0].now).toBeDefined();
  });
});
