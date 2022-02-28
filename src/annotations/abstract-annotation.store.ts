import {AnnotationStoreConfig} from "./config";
import {DataSource} from "apollo-datasource";
import express from "express";
import {Filter, InsertManyResult, ObjectId, WithId} from 'mongodb';
import {ValidationError} from "apollo-server";
import {Body} from "../openapi";

export abstract class AbstractAnnotationStore extends DataSource {
    protected readonly annotationBaseURI: string;
    readonly contextLinks: any[];

    constructor(protected config: AnnotationStoreConfig) {
        super();
        this.annotationBaseURI = `${ config.baseURI }${ config.annotationBasePath }`;
        this.contextLinks = [
            'https://www.w3.org/ns/anno.jsonld'
        ]
        console.info(`Initialized AnnotationStore with baseURI ${this.annotationBaseURI}`);
    }

    protected getAnnotationBaseURI(): string {
        return this.annotationBaseURI;
    }

    public applyMiddleware(app: express.Application): void {
        const router = this.addRoutes(express.Router());

        app.use(this.config.annotationBasePath, router);
    }

    protected abstract addRoutes(router: express.Router): express.Router;

    public pushAnnotation(annotation: any): Promise<ObjectId> {
        return this.config.annotationsCollection
            .insertOne({
                ...annotation,
                _id: null,
                created: new Date(),
            })
            .then(document => document.insertedId);
    }

    public pushAnnotations(annotations: any): Promise<any> {
        return this.config.annotationsCollection
            .insertMany(annotations.map((annotation: any) => ({
                ...annotation,
                // @ts-ignore
                _id: undefined,
                created: new Date(),
                body: Array.isArray(annotation.body) ? annotation.body.map((body: Body) => ({
                    ...body,
                    id: new ObjectId()
                })) : annotation.body.id = {...annotation.body, id: new ObjectId()}
            })))
            .then((document: InsertManyResult<Document>) => this
                .listAnnotations({'_id': {'$in': Object.keys(document.insertedIds)
                        .map((key: any) => document.insertedIds[key])}}));
    }

    protected insertOneIfNotExisting(annotation: any): Promise<any> {
        return this.config.annotationsCollection
            .updateOne({
                origin: annotation.origin,
                body: annotation.body,
                target: annotation.target
            }, {
                $setOnInsert: {
                    ...annotation,
                    _id: null,
                    created: new Date(),
                }
            }, {
                upsert: true
            }).then(document => document);
    }

    public getAnnotationFromId(id: string | ObjectId): Promise<any> {
        try {
            return this.getAnnotation(new ObjectId(id), true);
        } catch (error){
            return Promise.reject('Object ID not valid!');
        }
    }

    public getAnnotationFromUrl(url: string): Promise<any> {
        return this.getAnnotation(this.objectIdFromUrl(url));
    }

    protected getAnnotation(_id: ObjectId, prefixed = false): Promise<any> {
        return this.config.annotationsCollection
            .find({_id})
            .toArray()
            .then(document => {
                if (!document || document.length < 1) {
                    return Promise.reject('No document found with id ' + _id.toHexString());
                }
                return document[0];
            });
    }

    public listAnnotations(filter?: Filter<any>): Promise<any> {
        // @ts-ignore
        return this.config.annotationsCollection
            // @ts-ignore
            .find(filter)
            .toArray();
    }

    public deleteAnnotation(url: string): Promise<void> {
        // @ts-ignore
        return this.deleteAnnotations({_id: this.objectIdFromUrl(url)});
    }

    public deleteAnnotations(filter: any): Promise<void> {
        return this.config.annotationsCollection.deleteMany(filter).then();
    }

    protected idExists(id: string | ObjectId): Promise<boolean> {
        try {
            const oId = new ObjectId(id);
            return this.config.annotationsCollection
                .countDocuments({'_id': oId}, {limit: 1})
                .then(count => count > 0);
        } catch (e) {
            return Promise.resolve(false);
        }
    }

    private objectIdFromUrl(url: string): ObjectId {
        if(url.startsWith(this.annotationBaseURI)) {
            try {
                return new ObjectId(url.substr(url.lastIndexOf('/')+1));
            } catch (err) {
                console.error(err);
                throw new ValidationError('annotation url is not correct, trailing id not valid')
            }
        } else if(url.startsWith('anno')) {
            try {
                return new ObjectId(url.substr(url.lastIndexOf(':')+1));
            } catch (err) {
                console.error(err);
                throw new ValidationError('annotation id is not correct, trailing id not valid')
            }
        } else {
            throw new ValidationError('annotation url is not correct')
        }
    }

}
