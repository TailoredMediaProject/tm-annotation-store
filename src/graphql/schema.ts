import 'graphql-import-node';
import { makeExecutableSchema } from 'apollo-server';
import {GraphQLSchema} from 'graphql';
import * as typeDefs from '@redlink/tm-annotation-store-api/api/graphql/schema-1.0.2.graphql';
import resolvers from './resolvers';

const schema: GraphQLSchema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

export default schema;
