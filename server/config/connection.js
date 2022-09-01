// the server uses Mongoose for all its MongoDB data handling
// rather then connecting to the database rigt from 'server.js', it's actually handling the connection here in the 'config/connection.js' file
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/deep-thoughts', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
});

// the connection is exported
module.exports = mongoose.connection;
