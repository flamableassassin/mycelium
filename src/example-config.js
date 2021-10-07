module.exports = {
  defaultFrequency: 3600000, // default checking frequency =  60 mins
  plugins: { // config stuff for source plugins such as twiter
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