import {AnnotationStoreConfig} from "./config";
import {DataSource} from "apollo-datasource";
import express from "express";
import {ObjectId} from "mongodb";
import {ValidationError} from "apollo-server";
import {Annotation} from "./annotation.model";
import {AnnotationDto} from "./annotation-dto.model";

export abstract class AnnotationMethods extends DataSource {
    readonly annotationBaseURI: string;
    readonly contextLinks: any[];

    constructor(protected config: AnnotationStoreConfig) {
        super();
        this.annotationBaseURI = `${ config.baseURI }${ config.annotationBasePath }`;
        this.contextLinks = [
            'https://www.w3.org/ns/anno.jsonld'
        ]
        console.info(`Initialized AnnotationStore with baseURI <${this.annotationBaseURI}>`);
    }

    protected getAnnotationBaseURI(): string {
        return this.annotationBaseURI;
    }

    public applyMiddleware(app: express.Application): void {
        const router = this.addRoutes(express.Router());

        app.use(this.config.annotationBasePath, router);
    }

    protected abstract addRoutes(router: express.Router): express.Router;

    public pushAnnotation(annotation: any): Promise<any> {
        return this.config.annotationsCollection
            .insertOne(annotation)
            .then(document => this.getAnnotationFromId(document.ops[0]._id));
    }

    public pushAnnotations(annotations: any): Promise<any> {
        return this.config.annotationsCollection
            .insertMany(annotations)
            // @ts-ignore
            .then(documents => this.listAnnotations({'_id': {'$in': documents.ops}}));
    }

    public getAnnotationFromId(id: string | ObjectId): Promise<any> {
        return this.getAnnotation(new ObjectId(id), true);
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

    public listAnnotations(filter?: Document[]): Promise<any> {
        return this.config.annotationsCollection
            .find(filter)
            .toArray();
    }

    public deleteAnnotation(url: string): Promise<void> {
        // @ts-ignore
        return this.deleteAnnotations({_id: this.objectIdFromUrl(url)});
    }

    public deleteAnnotations(filter: Document[]): Promise<void> {
        return this.config.annotationsCollection.deleteMany(filter).then();
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

    protected abstract exportDboToDto(annotation: any): any;
}