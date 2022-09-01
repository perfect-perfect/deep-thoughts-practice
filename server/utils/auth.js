const jwt = require('jsonwebtoken');

// enables the server to verify whether it recognizes the token
const secret = 'mysecret';

const expiration = '2h';

module.exports = {
    // expects a user object
    signToken: function({ username, email, _id }) {
        const payload = { username, email, _id };
        // turns the user data into a jwt tokenized string
        return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
    },
    // is ran as middle with every request. for example if we addThoguht this automatically runs before addThought and verifies our token and gets the info from it and adds it to req.user. This if now because accesible using the context arguement in your mutations and refersing context.user
    authMiddleware: function({ req }) {
        // allows token to be sent via req.body, req.query, or headers
        let token = req.body.token || req.query.token || req.headers.authorization;

        // separate "Bearer" from "<tokenvalue>"
        if (req.headers.authorization) {
            token = token
                .split(' ')
                .pop()
                .trim();
        }

        // if no token, return request object as is
        if (!token) {
            return req
        }

        
        // we use a try catch because we want to mute the error and manually throw an authentication error on the resolver side 
        try {
            // decode and attach user data to request object
            // if the secret on 'jwt.verify()' doesn't match the secret that was used with 'jwt.sign()' the object won't be decoded
            // when jwt.verify fails an error is thrown
            const { data } = jwt.verify(token, secret, { maxAge: expiration});
            // do we create req.user? or is tehre one already in the req object?
            req.user = data;
        } catch {
            console.log('Invalid token');
        }


        // return updated request object
        return req;
    }
};