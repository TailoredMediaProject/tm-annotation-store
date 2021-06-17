import { IResolvers } from "apollo-server";
import {AnnotationStore} from '../annotations/store';
import {Annotation, Filter} from '../annotations/model';
import {GraphQLScalarType} from 'graphql';

const resolvers: IResolvers = {
    Void: new GraphQLScalarType({
        name: 'Void',

        description: 'Represents NULL values',

        serialize() {
            return null
        },

        parseValue() {
            return null
        },

        parseLiteral() {
            return null
        }
    }),
    Target: {
        __resolveType(obj: {type: string}) {
            if(obj.type === 'SpecificResource') {
                return 'SpecificResource'
            } else {
                return 'TargetResource'
            }
        }
    },
    Selector: {
        __resolveType(obj: {type: string}) {
            return obj.type;
        }
    },
    Body: {
        __resolveType(obj: {type: string}) {
            if(obj.type === 'TextualBody') {
                return 'BodyText'
            } else {
                return 'BodyResource'
            }
        }
    },
    Query: {
        annotations: (parent, args, context) => {
            const filter = args.filter ? new Filter(args.filter) : undefined;
            return (context.dataSources.annotations as AnnotationStore).listAnnotations(filter);
        },
        annotation: (parent, args, context) => {
            return (context.dataSources.annotations as AnnotationStore).getAnnotationFromUrl(args.id);
        }
    },
    Mutation: {
        deleteAnnotation: (parent, {id}, context) => {
            return (context.dataSources.annotations as AnnotationStore).deleteAnnotation(id);
        },
        deleteAnnotations: (parent, args, context) => {
            return (context.dataSources.annotations as AnnotationStore).deleteAnnotations(new Filter(args.filter));
        },
        addAnnotation: (parent, {
            bodyResource, bodyText, targetResource, targetTextSelector, targetFragmentSelector
        }, context) => {

            const annotation = Annotation.create();

            if(bodyResource) {
                annotation.setBody(bodyResource, 'bodyResource')
            } else if(bodyText) {
                annotation.setBody(bodyText, 'bodyText')
            } else {
                throw new Error('Body has to be set');
            }

            if(targetResource) {
                annotation.setTarget(targetResource, 'targetResource');
            } else if(targetTextSelector) {
                annotation.setTarget(targetTextSelector, 'targetTextSelector')
            } else if(targetFragmentSelector) {
                annotation.setTarget(targetFragmentSelector, 'targetFragmentSelector')
            } else {
                throw new Error('Target has to be set');
            }

            return (context.dataSources.annotations as AnnotationStore).pushAnnotation(annotation);
        }
    }
};

export default resolvers;
