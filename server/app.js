const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const schema = require('./schema/');
const mongoose = require('mongoose');
const cors = require('cors');
const expressPlayground = require('graphql-playground-middleware-express').default;


const app = express();

// allow cross-origin requests
app.use(cors());


// connect to mongoDB database
// make sure to replace my db string & creds with your own
mongoose.connect('mongodb://localhost:27017/graphql_nodejs_blog', { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.connection.once('open', () => {
    console.log('conneted to database');
});


// bind express with graphql
app.use('/graphql', graphqlHTTP({
    schema
}));

app.get('/playground', expressPlayground({ endpoint: '/graphql' }));

app.listen(4000, () => {
    console.log('🚀 Server ready at http://localhost:4000/playground');
});