const graphql = require('graphql');
const Post = require('../models/Post');
const Category = require('../models/Category');
const User = require('../models/User');

const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = "ACCESS_TOKEN_SECRET";

const {
    GraphQLObjectType,
    GraphQLString,
    GraphQLSchema,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInputObjectType,
    GraphQLError
} = graphql;

const graphqlIsoDate = require("graphql-iso-date");
const { GraphQLDateTime, GraphQLDate } = graphqlIsoDate;

const AccessType = new GraphQLObjectType({
    name: "Access",
    fields: () => ({
        accessToken: { type: GraphQLString },
    }),
});

const UserInputType = new GraphQLObjectType({
    name: 'UserInputType',
    fields: () => ({
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        password: { type: GraphQLString },
    })
});

const UserOutputType = new GraphQLObjectType({
    name: 'UserOutputType',
    fields: () => ({
        username: { type: GraphQLString },
        email: { type: GraphQLString },
        createdAt: { type: GraphQLDateTime },
        updatedAt: { type: GraphQLDateTime },
    })
});

const PostType = new GraphQLObjectType({
    name: 'Post',
    fields: () => ({
        id: { type: GraphQLID },
        title: { type: GraphQLString },
        description: { type: GraphQLString },
        category: {
            type: CategoryType,
            resolve(parent, args, context, info) {
                return Category.findById(parent.category);
            }
        }
    })
});

const CategoryType = new GraphQLObjectType({
    name: 'Category',
    fields: () => ({
        id: { type: GraphQLID },
        name: { type: GraphQLString },
        posts: {
            type: new GraphQLList(PostType),
            resolve(parent, args, context, info) {
                return Post.find({ category: parent.id });
            }
        }
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserOutputType,
            args: {
                accessToken: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args) {
                let user = {};

                jwt.verify(
                    args.accessToken,
                    ACCESS_TOKEN_SECRET,
                    (err, authData) => {
                        user = User.findById(authData.user.id);
                    }
                );
                return user;
            },
        },
        userById: {
            type: UserOutputType,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve(parent, args) {
                return (user = User.findById(args.id));
            },
        },
        posts: {
            type: new GraphQLList(PostType),
            resolve(parent, args) {
                return Post.find({});
            }
        },
        post: {
            type: PostType,
            args: { id: { type: GraphQLID } },
            resolve(parent, args) {
                return Post.findById(args.id);
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        register: {
            type: UserOutputType,
            args: {
                username: { type: new GraphQLNonNull(GraphQLString) },
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(_, args, context, info) {
                try {
                    let { username, email, password } = args;

                    password = await bcrypt.hash(password, 6);

                    const user = await new User({
                        username,
                        email,
                        password,
                    });

                    return user.save();
                } catch (err) {
                    throw err;
                }
            }
        },
        login: {
            type: AccessType,
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
            },
            async resolve(parent, args, context, info) {
                const { email, password } = args;
                const existingUser = await User.findOne({ email });
                try {
                    if (existingUser) {
                        if (await bcrypt.compare(password, existingUser.password)) {
                            const user = {
                                id: existingUser._id,
                            };
                            const accessToken = jwt.sign({ user }, ACCESS_TOKEN_SECRET, {
                                expiresIn: "1d",
                            });
                            user.accessToken = accessToken;

                            return user;
                        }
                    }
                } catch (err) {
                    throw err;
                }
            },
        },
        addPost: {
            type: PostType,
            args: {
                title: { type: new GraphQLNonNull(GraphQLString) },
                description: { type: new GraphQLNonNull(GraphQLString) },
                category: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve(parent, args, context, info) {
                let post = new Post({
                    title: args.title,
                    description: args.description,
                    category: args.category
                });

                return post.save();
            }
        },
        updatePost: {
            type: PostType,
            args: {
                id: { type: GraphQLID },
                title: { type: GraphQLString },
                description: { type: GraphQLString },
            },
            resolve(parent, args, context, info) {
                return Post.findByIdAndUpdate(args.id,
                    {
                        $set: {
                            title: args.title,
                            description: args.description,
                        }
                    },
                    {
                        new: true,
                    });
            }
        },
        deletePost: {
            type: PostType,
            args: {
                id: { type: GraphQLID },
            },
            resolve(parent, args, context, info) {
                return Post.findByIdAndRemove(args.id);
            }
        },
        addCategory: {
            type: CategoryType,
            args: {
                name: { type: new GraphQLNonNull(GraphQLString) },
            },
            resolve(parent, args, context, info) {
                let category = new Category({
                    name: args.name,
                });

                return category.save();
            }
        },
    }
});

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});