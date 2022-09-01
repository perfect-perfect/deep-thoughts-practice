// import the gql tagged template function from apollo-server-express
//  - tagged templates are an advanced use of template literals
//  - typically from a library that provides explicit details on how it's used in that situation, so we don't have to know too much for now
//      - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
const { gql } = require('apollo-server-express');

// create our typeDefs
//  - defining every piece of data that the client can expect to work with through query or mutation
//  - defines the endpoint
//  - defines exact data  and parameters that are tied to endpoint
// to define our query we use type Query = {}
//  - type Query = {} is a data type built into GraphQL
//      - tou can then define your different types of queries by naming them and giving the data type
//          - we created a query named 'helloWorld' and specified that data returned will be a string
//  - thoughts: [Thought]
//      - we want this query to retrieve an array of all thought data from the database
//      - [Thought] 
//          - we can create our own custome types that define what we want to have returned from this query
//          - we're instructing our query that we'll return an array, as noted by the [] around the returning data 'Thought' we are about to create
//  - type Thought {// code}
//      - custome data type
//      - we are able to instruct the 'thoughts' query so that each thought that returns can include '_id', 'thoughtText', 'username', 'reactionCount' with their respective scalars
//      - new scalars
//          - ID
//              - same as string except that it is looking for a unique identifier
//          - Int
//              - integer
// thoughts(username: String): [Thought]
//  - we've define our 'thoughts' query so it COULD receive a parameter if we wanted
//  - the parameter would be identified as 'username' and would be a String data type.
// reactions: [Reaction]
//  - will be an nearws array of our custom data type 'Reaction'
//      - how do we query nested data like this?
// type Query {...user(username: String!): User... }
//  - the exclamation point indicatesthat for the query to be queried out, that data MUST EXIST
//      - apollo will return an erro rot the client making the request and the query won't even reach the resolver function associated with it
//  - if we want to look up a single thought or user, we need to know which one and this necessitates a parameter
// type Auth {}
//  - token: !ID
//      - must return a token
//  - user: User
//      - can optionally include any other 'user' data

const typeDefs = gql`
    
    type User {
        _id: ID
        username: String
        email: String
        friendCount: Int
        thoughts: [Thought]
        friends: [User]
    }

    type Thought {
        _id: ID
        thoughtText: String
        createdAt: String
        username: String
        reactionCount: Int
        reactions: [Reaction]
    }

    type Reaction {
        _id: ID
        reactionBody: String
        createdAt: String
        username: String
    }

    type Auth {
        token: ID!
        user: User
    }

    type Query {
        me: User
        users: [User]
        user(username: String!): User
        thoughts(username: String): [Thought]
        thought(_id: ID!): Thought
    }

    type Mutation {
        login(email: String!, password: String!): Auth
        addUser(username: String!, email: String!, password: String!): Auth
        addThought(thoughtText: String!): Thought
        addReaction(thoughtId: ID!, reactionBody: String!): Thought
        addFriend(friendId: ID!): User
    }
`;

//export the typeDefs
module.exports = typeDefs;