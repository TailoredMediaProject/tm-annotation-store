import {DataSource} from 'apollo-datasource';
import {ObjectId} from 'mongodb';
import {Filter} from './model';
import {AnnotationStoreConfig} from './config';
import { ValidationError } from 'apollo-server';
import express from 'express';

export class AnnotationStore extends DataSource {

    private readonly annotationBaseURI: string;
    private readonly contextLinks: any[];

    constructor(private config: AnnotationStoreConfig) {
        super();
        this.annotationBaseURI = `${ config.baseURI }${ config.annotationBasePath }`;
        this.contextLinks = [
            'https://www.w3.org/ns/anno.jsonld',
            {"anno": this.annotationBaseURI}
        ]
    }

    public applyMiddleware(app: express.Application):void {
        const router = express.Router();
        router.route('/:id')
            .get((req, res) => {
                this.getAnnotationFromId(req.params.id).then((annotation:any) => {
                    res.json(this.addContextLink(annotation))
                },() => {
                    res.status(404).end();
                })
            })
        app.use(this.config.annotationBasePath, router);
    }

    private addContextLink(annotation: any): any {
        annotation['@context'] = this.contextLinks;
        return annotation;
    }

    private cleanId(doc: any): any {
        if(doc) {
            doc.id = `anno:${doc._id}`;
            delete doc._id;
        }
        return doc;
    }

    pushAnnotation(annotation: any): Promise<any> {
        return new Promise((resolve, reject) => {
            if(annotation._id || annotation.id) {
                reject('annotation may not include id');
            } else {
                this.config.annotationsCollection.insertOne(annotation, {}, (err, doc) => {
                    if(err) {
                        reject(err);
                    } else {
                        resolve(this.cleanId(doc.ops[0]));
                    }
                })
            }
        })
    }

    public getAnnotationFromId(id: string): Promise<any> {
        return this.getAnnotation(new ObjectId(id));
    }

    public getAnnotationFromUrl(url: string): Promise<any> {
        return this.getAnnotation(this.objectIdFromUrl(url));
    }

    private getAnnotation(_id: ObjectId): Promise<any> {
        return new Promise((resolve,reject) => {
            this.config.annotationsCollection.find({_id}).toArray((err, docs) => {
                if(err || !docs || docs.length === 0) {
                    reject(err);
                } else {
                    resolve(this.cleanId(docs[0]));
                }
            });
        });
    }

    listAnnotations(filter?: Filter): Promise<any> {
        return new Promise((resolve,reject) => {
            this.config.annotationsCollection.find(filter ? filter.toMongoFilter() : {}).toArray((err, docs) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(docs.map(d => this.cleanId(d)));
                }
            });
        });
    }

    deleteAnnotation(url: string): Promise<void> {
        const _id = this.objectIdFromUrl(url);
        return new Promise((resolve,reject) => {
            this.config.annotationsCollection.deleteOne({_id},(err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    deleteAnnotations(filter: Filter): Promise<void> {
        return new Promise((resolve,reject) => {
            this.config.annotationsCollection.deleteMany(filter.toMongoFilter(),(err) => {
                if(err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
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
