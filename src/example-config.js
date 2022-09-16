module.exports = {
  dbURL: '', // The database url see https://www.prisma.io/docs/reference/database-reference/connection-urls. Note: This project was built for postgres if you wish to use another database you will need to alter the schema
  defaultFrequency: 3600000, // default checking frequency =  60 mins
  plugins: { // config stuff for source plugins such as twitter
    twitter: { // Example twitter config
      exclude_replies: true,
      secrets: {
        consumer_key: '',
        consumer_secret: '',
        access_token_key: '',
        access_token_secret: ''
      }
    }
  }
};