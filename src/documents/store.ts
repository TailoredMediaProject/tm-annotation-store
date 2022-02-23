import {
    CollectionInsertOneOptions,
    DeleteWriteOpResultObject,
    InsertOneWriteOpResult,
    MongoCallback,
    ObjectId
} from 'mongodb';
import {AnnotationCount, TextDocument} from './model';
import express from 'express';
import {DocumentStoreConfig} from './config';

export class DocumentStore {
    private readonly textDocumentBaseURI: string;

    constructor(private config: DocumentStoreConfig) {
        this.textDocumentBaseURI = `${ config.baseURI }${ config.documentBasePath }texts/`
        console.info(`Initialized DocumentStore with baseURI <${this.textDocumentBaseURI}>`);
    }

    public applyMiddleware(app: express.Application):void {
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
                //TODO delete annotations, too
                this.deleteTextDocument(res, req.params.id)
            });
        app.use(this.config.documentBasePath, router);
    }



    private listTextDocuments(res: any): void {
        this.config.documentsCollection.find().toArray((err, docs) => {
            if(err) {
                DocumentStore.setError(res, 500, err.message);
            } else {
                this.setStatisticsToDocuments(docs.map(d => TextDocument.fromStorage(d, this.textDocumentBaseURI)))
                    .then(_docs => res.json(_docs));
            }
        });
    }

    private createTextDocument(req: any, res: any): void {
        try {
            const document = TextDocument.fromRequest(req.body);
            this.createDocument({title:document.title, content:document.content}, {}, (err, doc) => {
                if(err) {
                    DocumentStore.setError(res, 500, err.message);
                } else {
                    this.setStatistics(TextDocument.fromStorage(doc.ops[0], this.textDocumentBaseURI))
                        .then(_doc => res.status(201).json(_doc));
                }
            })
        } catch (err) {
            // @ts-ignore
            DocumentStore.setError(res, 400, err.message);
        }
    }

    createDocument(content: any, options: CollectionInsertOneOptions, callback: MongoCallback<InsertOneWriteOpResult<any>>): void {
        this.config.documentsCollection.insertOne({title: content.title, content: content.content}, options, callback);
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
                        this.setStatistics(TextDocument.fromStorage(docs[0], this.textDocumentBaseURI))
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
            this.deleteDocument(id,(err) => {
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

    deleteDocument(objectId: string, callback: MongoCallback<DeleteWriteOpResultObject>): void {
        const _id = new ObjectId(objectId);
        this.config.documentsCollection.deleteOne({_id}, callback);
    }

    private static setError(res: any, status: number, msg: string) {
        res.status(status).json({status, msg});
    }

    private async setStatisticsToDocuments(docs: TextDocument[]): Promise<TextDocument[]> {
        return Promise.all(docs.map(doc => this.setStatistics(doc)));
    }

    private async setStatistics(doc: TextDocument): Promise<TextDocument> {
        doc.statistics.annotationCount = new AnnotationCount(
            await this.countFromAnnotationStore({'value.target.id':{'$eq': `${this.textDocumentBaseURI}${doc.id}`}}),
            await this.countFromAnnotationStore({'value.target.source':{'$eq': `${this.textDocumentBaseURI}${doc.id}`}})
        )
        return doc;
    }

    private async countFromAnnotationStore(query:any):Promise<number> {
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
