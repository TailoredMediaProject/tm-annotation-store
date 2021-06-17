import {DataSource} from 'apollo-datasource';
import {ObjectId} from 'mongodb';
import {Annotation, Filter} from './model';
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
            'https://www.w3.org/ns/anno.jsonld'
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

    pushAnnotation(annotation: Annotation): Promise<any> {
        return new Promise((resolve, reject) => {
            this.config.annotationsCollection.insertOne(annotation.setHashSum(), {}, (err, doc) => {
                if(err) {
                    reject(err);
                } else {
                    resolve(Annotation.fromJson(doc.ops[0]).getValue(this.annotationBaseURI));
                }
            })
        })
    }

    public getAnnotationFromId(id: string): Promise<any> {
        return this.getAnnotation(new ObjectId(id), true);
    }

    public getAnnotationFromUrl(url: string): Promise<any> {
        return this.getAnnotation(this.objectIdFromUrl(url));
    }

    private getAnnotation(_id: ObjectId, prefixed = false): Promise<any> {
        return new Promise((resolve,reject) => {
            this.config.annotationsCollection.find({_id}).toArray((err, docs) => {
                if(err || !docs || docs.length === 0) {
                    reject(err);
                } else {
                    resolve(Annotation.fromJson(docs[0]).getValue(this.annotationBaseURI));
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
                    resolve(docs.map(d => Annotation.fromJson(d).getValue(this.annotationBaseURI)));
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
