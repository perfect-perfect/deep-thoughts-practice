const { User, Thought } = require("../models");
// module states that AuthenticationError is error handling built into GraphQL. 
const { AuthenticationError } = require('apollo-server-express');

const { signToken } = require('../utils/auth');

// resolvers
//  - functions that perform the query or mutations that were defined in typeDefs.js
//  - can accept four arguments in the following order
//      1. parent: 
//          - if we used nested resolvers to handle more complicated actions
//          - it would hold the reference to th resolver that executed the nested resolver function
//      2. args:
//          - an object of all the values passed into a query or mutation request as parameters
//          - in our case, we destructure the 'username' parameter out to be used
//      3. context:
//          - if we were to need the same data to be accessible by all resolvers, such as a logged-in user's status or API access token, this data will come through the 'context' paramater as an object
//      4. info:
//          - this will contain extra info about an operation's current state
const resolvers = {
    // nested object that holds a series of methods
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({ _id: context.user._id })
                    .select('-__v -password')
                    .populate('thoughts')
                    .populate('friends');

                return userData;
            }

            throw new AuthenticationError('Not logged in');
        },
        // these methods get the same name of the query or mutation they are resolvers for
        thoughts: async (parent, { username }) => {
            // we use a ternary operator to check if 'username' exists
            //  - if it does, we set 'params' to an object with a 'username' key set to that value
            //      - if it doesn't we set params to an empty object
            const params = username ? { username } : {};
            // now when we query 'thoughts'
            //  - we will perform a '.find()' method on the 'Thought' model
            //      - if there is a data in params it will perform a lookup by a specific username
            //  - .sort() we use to return the data in descending order
            //  - we don't have to worry about error handling here because Apollo can infer if something goes wrong and respond for us.
            return Thought.find(params).sort({ createdAt: -1 });
        },
        thought: async (parent, { _id }) => {
            return Thought.findOne({ _id });
        },
        // get all users
        // this a great feature of GraphQL. we have a single function that will return every single piece of data associated with a user
        //  - but none of it will be returned unless we explicitly list those fields when we perform our queries.
        users: async () => {
            return User.find()
                // omit the mongoose specific '__v' and the user's password
                .select('-__v -password')
                // return the associated 'friends' data
                // we populate the fields for 'friends' and 'thoughts' so we can get any associated data in return
                .populate('friends')
                .populate('thoughts');
        },
        // get a user by username
        user: async (parent, { username }) => {
            return User.findOne({ username })
                .select('-__v -password')
                .populate('friends')
                .populate('thoughts');
        }

    },
    Mutation: {
        addUser: async (parent, args) => {

            const user = await User.create(args);

            const token = signToken(user);

            // return Auth type
            return { token, user };

        },
        login: async (parent, { email, password }) => {
            // find user
            const user = await User.findOne({ email });
            //if no user throw error
            if (!user) {
                throw new AuthenticationError('incorrect credentials');
            }
            // check if password is correct using a method we set uo on the User schema
            //  - it uses bcrypt.compare() to compare the submitted password with the actual password
            const correctPw = await user.isCorrectPassword(password);
            // if correctPw is false and password was incorrect
            if (!correctPw) {
                throw new AuthenticationError('Incorrect credentials');
            }

            const token = signToken(user);

            // { token, user } - this is the Auth type.
            // So we are returning an Auth type 
            return { token, user };
        },
        addThought: async (parent, args, context) => {
            // context.user exists if the user has a token
            if (context.user) {
                // we grab username from context.user.username which was created when the middleware context: authMiddle was ran
                const thought = await Thought.create({ ...args, username: context.user.username });

                // we add the thought 
                await User.findByIdAndUpdate(
                    // uses context which 
                    { _id: context.user._id },
                    { $push: { thoughts: thought._id } },
                    // tells Mongo to return the new and updated User instead of the previous version
                    { new: true }
                );

                return thought;
            }

            throw new AuthenticationError('You need to be logged in!');
        },
        addReaction: async (parent, { thoughtId, reactionBody }, context) => {
            if (context.user) {

                const updatedThought = await Thought.findOneAndUpdate(
                    // _id of the Thought we are updated is set to the thoughtId we passed into the addReaction resolver function
                    { _id: thoughtId },
                    // reactions are stored as arrays on the 'Thought' model
                    //  - so we'll use the Mongo '$push' operator
                    { $push: { reactions: { reactionBody, username: context.user.username } } },
                    { new: true, runValidators: true }
                );

                return updatedThought;
            }

            throw new AuthenticationError('You need to be logged in!')
        },
        // will look for an incoming 'friendId'
        addFriend: async (parent, { friendId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    // add that friendId to our current 'friends' array
                    // A user can't be friends with the same person twice
                    //  - hence why we use $addToSet operator instead of $push to prevent duplicate entries
                    { $addToSet: { friends: friendId } },
                    { new: true }
                )
                .populate('friends');

                return updatedUser;
            }

            throw new AuthenticationError('You need to be logged in!');
        }
    }
};

module.exports = resolvers;