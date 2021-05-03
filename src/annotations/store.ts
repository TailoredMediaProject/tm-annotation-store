import {DataSource} from 'apollo-datasource';
import {ObjectId} from 'mongodb';
import {Filter} from './model';
import {AnnotationStoreConfig} from './config';
import { ValidationError } from 'apollo-server';

export class AnnotationStore extends DataSource {

    constructor(private config: AnnotationStoreConfig) {
        super();
    }

    private cleanId(doc: any): any {
        if(doc) {
            doc.id = `${this.config.annotationBaseURI}${doc._id}`;
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

    getAnnotation(url: string): Promise<any> {
        const _id = this.objectIdFromUrl(url);
        return new Promise((resolve,reject) => {
            this.config.annotationsCollection.find({_id}).toArray((err, docs) => {
                if(err) {
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
        if(!url.startsWith(this.config.annotationBaseURI)) {
            throw new ValidationError(`annotation url is not correct, must start with ${this.config.annotationBaseURI}`);
        }
        try {
            return new ObjectId(url.substr(url.lastIndexOf('/')+1));
        } catch (err) {
            console.error(err);
            throw new ValidationError('annotation url is not correct, trailing id not valid')
        }
    }
}
