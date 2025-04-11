export default () => ({
  // Postgres
  postgres: {
    host: process.env.POSTGRES_HOST || 'db',
    port: parseInt(process.env.POSTGRES_PORT!, 10) || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    pwd: process.env.POSTGRES_PASSWORD || 'postgres',
    db: process.env.POSTGRES_DB || 'savepoint',
    url:
      process.env.POSTGRES_URL ||
      `postgres://postgres:postgres@postgres:5432/savepoint`,
  },
});
