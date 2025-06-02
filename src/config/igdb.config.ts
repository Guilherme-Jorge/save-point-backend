export default () => ({
  // IGDB
  igdb: {
    clientId: process.env.IGDB_CLIENT_ID,
    clientSecret: process.env.IGDB_CLIENT_SECRET,
    accessToken: process.env.IGDB_ACCESS_TOKEN,
    webhookSecret: process.env.IGDB_WEBHOOK_SECRET,
  },
});
