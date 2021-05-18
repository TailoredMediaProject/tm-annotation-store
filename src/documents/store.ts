import {ObjectId} from 'mongodb';
import {AnnotationCount, TextDocument} from './model';
import express from 'express';
import {DocumentStoreConfig} from './config';

export class DocumentStore {
    constructor(private config: DocumentStoreConfig) {}

    public applyMiddleware(app: express.Application, path: string = '/api/docs'):void {
        const router = express.Router();
        router.route('/texts')
            .get((req, res) => {
                this.listTextDocuments(res);
            })
            .post((req, res) => {
                this.createTextDocument(req, res)
            });
        router.route('/texts/:id')
            .get((req, res) => {
                this.getTextDocument(res, req.params.id)
            })
            .delete((req, res) => {
                this.deleteTextDocument(res, req.params.id)
            });
        app.use(path, router);
    }

    private listTextDocuments(res: any): void {
        this.config.documentsCollection.find().toArray((err, docs) => {
            if(err) {
                DocumentStore.setError(res, 500, err.message);
            } else {
                this.setStatisticsToDocuments(docs.map(d => TextDocument.fromStorage(d, this.config.documentBaseURI)))
                    .then(_docs => res.json(_docs));
            }
        });
    }

    private createTextDocument(req: any, res: any): void {
        try {
            const document = TextDocument.fromRequest(req.body);
            this.config.documentsCollection.insertOne(document, {}, (err, doc) => {
                if(err) {
                    DocumentStore.setError(res, 500, err.message);
                } else {
                    this.setStatistics(TextDocument.fromStorage(doc.ops[0], this.config.documentBaseURI))
                        .then(_doc => res.status(201).json(_doc));
                }
            })
        } catch (err) {
            DocumentStore.setError(res, 400, err.message);
        }
    }

    private getTextDocument(res: any, id: string) {
        try {
            const _id = new ObjectId(id);
            this.config.documentsCollection.find({_id}).toArray((err, docs) => {
                if(err) {
                    DocumentStore.setError(res, 500, err.message);
                } else {
                    if(docs.length === 0) {
                        DocumentStore.setError(res, 404, 'Not Found');
                    } else {
                        this.setStatistics(TextDocument.fromStorage(docs[0], this.config.documentBaseURI))
                            .then(_doc => res.json(_doc));
                    }
                }
            });
        } catch (err) {
            DocumentStore.setError(res, 400, 'Not a valid id');
        }
    }

    private deleteTextDocument(res: any, id: string):void {
        try {
            const _id = new ObjectId(id);
            this.config.documentsCollection.deleteOne({_id},(err) => {
                if(err) {
                    DocumentStore.setError(res, 500, err.message);
                } else {
                    res.status(200).end();
                }
            });
        } catch (err) {
            DocumentStore.setError(res, 400, 'Not a valid id');
        }
    }

    private static setError(res: any, status: number, msg: string) {
        res.status(status).json({status, msg});
    }

    private async setStatisticsToDocuments(docs: TextDocument[]): Promise<TextDocument[]> {
        return Promise.all(docs.map(doc => this.setStatistics(doc)));
    }

    private async setStatistics(doc: TextDocument): Promise<TextDocument> {
        doc.statistics.annotationCount = new AnnotationCount(
            await this.count({'target.id':{'$eq': doc.getMongoId()}}),
            await this.count({'target.source':{'$eq': doc.getMongoId()}})
        )
        return doc;
    }

    private async count(query:any):Promise<number> {
        return new Promise((resolve) => {
            this.config.annotationsCollection.countDocuments(query, (err, count) => {
                if(err) {
                    console.error('Cannot get statistics for document', err);
                    resolve(-1);
                }
                resolve(count);
            })
        });
    }
}
