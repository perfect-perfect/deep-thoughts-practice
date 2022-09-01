const express = require('express');

// import ApolloServer
const { ApolloServer } = require('apollo-server-express');

//import our typeDefs and resolvers
const { typeDefs, resolvers } = require('./schemas');

const { authMiddleware } = require('./utils/auth');

// import the connection to MongoDB, which was created with mongoose.
const db = require('./config/connection');

const PORT = process.env.PORT || 3001;

// create a new Apollo server and pass in our schema data
//	- with the 'new ApolloServer({})' function we provide the typeDefs and resolvers
//		- so apollo knows what our API looks like and how it resolves requests
const server = new ApolloServer({
	typeDefs,
	resolvers,
	// we set a context method that is set to return what we specify
	//	- in our case we set context to be the authMiddleware helper function which fets the token and authorizes it
	//	- context is the third argument in a resolver, so now if we want to access the headers in a resolver we just include a third 'context' argument.
	context: authMiddleware
});

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Create a new instance of an Apollo server with the GraphQL schema
const startApolloServer = async (typeDefs, resolvers) => {
	await server.start();

	// integrate our Apollo server with the Express application as middleware
	// this will create a special '/graphql' endpoint for the Express.js server that will serve as the main endpoint for accessing the entire API
	server.applyMiddleware({ app });

	// https://stackoverflow.com/questions/17867928/using-on-or-once-for-open-event-in-mongoosejs 
	db.once('open', () => {
		app.listen(PORT, () => {
			console.log(`API server running on port ${PORT}!`);
			// log where we can go test our GQL API
			console.log(`Use GraphQL at http://localhost:${PORT}${server.graphqlPath}`);
		});
	});
};

// Call the async function to start the server
startApolloServer(typeDefs, resolvers);


