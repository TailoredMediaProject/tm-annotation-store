import {Callback, DeleteResult, Filter, InsertOneOptions, InsertOneResult, ObjectId, WithId} from 'mongodb';
import {AnnotationCount, TextDocument} from './model';
import express from 'express';
import {DocumentStoreConfig} from './config';
import {Annotation} from '../openapi';

export class DocumentStore {
  private readonly textDocumentBaseURI: string;

  constructor(private config: DocumentStoreConfig) {
    this.textDocumentBaseURI = `${config.baseURI}${config.documentBasePath}texts/`;
    console.info(`Initialized DocumentStore with baseURI <${this.textDocumentBaseURI}>`);
  }

  public applyMiddleware(app: express.Application): void {
    const router = express.Router();
    router.route('/texts')
      .get((req, res) => this.listTextDocuments(res))
      .post((req, res) => this.createTextDocument(req, res));

    router.route('/texts/:id')
      .get((req, res) => this.getTextDocument(res, req.params.id))
        //TODO delete annotations, too
      .delete((req, res) => this.deleteTextDocument(res, req.params.id));
    app.use(this.config.documentBasePath, router);
  }

  private listTextDocuments(res: any): void {
    this.config.documentsCollection.find().toArray((err, docs) => {
      if (err) {
        DocumentStore.setError(res, 500, err.message);
      } else {
        this.setStatisticsToDocuments(docs.map(d => TextDocument.fromStorage(d, this.textDocumentBaseURI)))
          .then(updatedDoc => res.json(updatedDoc));
      }
    });
  }

  private createTextDocument(req: any, res: any): void {
    try {
      const document: TextDocument = TextDocument.fromRequest(req.body);

      this.config.documentsCollection.insertOne({ title: document.title, content: document.content })
        .then((result: InsertOneResult<TextDocument>) => this.afterTextDocumentInsertion(result.insertedId, res))
        .catch(err => DocumentStore.setError(res, 500, err.message));
    } catch (err) {
      // @ts-ignore
      DocumentStore.setError(res, 400, err.message);
    }
  }

  private afterTextDocumentInsertion(id: ObjectId, res): void {
    this.config.documentsCollection.findOne({_id: id})
      .then((textDocument: WithId<TextDocument>) => {
        this.setStatistics(TextDocument.fromStorage(textDocument, this.textDocumentBaseURI))
          .then(updatedDoc => res.status(201).json(updatedDoc));
      })
      .catch(err => DocumentStore.setError(res, 404, 'Could not find inserted text document: ' + err.toString()));
  }

  private getTextDocument(res: any, id: string): void {
    if (ObjectId.isValid(id)) {
      this.config.documentsCollection.find({ _id: new ObjectId(id) })
        .toArray()
        .then((value: WithId<Document>[]) => {
          if (value?.length === 0) {
            DocumentStore.setError(res, 404, 'Text document not found');
          } else {
            // @ts-ignore
            this.setStatistics(TextDocument.fromStorage(value[0], this.textDocumentBaseURI))
              .then(updatedDoc => res.json(updatedDoc));
          }
        })
        .catch(err => DocumentStore.setError(res, 500, err.message));
    } else {
      DocumentStore.setError(res, 400, 'Invalid id');
    }
  }

  private deleteTextDocument(res: any, id: string): void {
    if (ObjectId.isValid(id)) {
      this.deleteDocument(id, (err) => {
        if (err) {
          DocumentStore.setError(res, 500, err.message);
        } else {
          res.status(200).end();
        }
      });
    } else {
      DocumentStore.setError(res, 400, 'Invalid id');
    }
  }

  deleteDocument(objectId: string, callback: Callback<DeleteResult>): void {
    const _id = new ObjectId(objectId);
    this.config.documentsCollection.deleteOne({ _id }, callback);
  }

  private static setError(res: any, status: number, msg: string) {
    res.status(status).json({ status, msg });
  }

  private async setStatisticsToDocuments(docs: TextDocument[]): Promise<TextDocument[]> {
    return Promise.all(docs.map(doc => this.setStatistics(doc)));
  }

  private async setStatistics(doc: TextDocument): Promise<TextDocument> {
    doc.statistics.annotationCount = new AnnotationCount(
      await this.countFromAnnotationStore({ 'value.target.id': { '$eq': `${this.textDocumentBaseURI}${doc.id}` } }),
      await this.countFromAnnotationStore({ 'value.target.source': { '$eq': `${this.textDocumentBaseURI}${doc.id}` } })
    );
    return doc;
  }

  private countFromAnnotationStore(filter: Filter<Annotation>): Promise<number> {
    return this.config.annotationsCollection.countDocuments(filter)
      .catch(err => {
        console.error('Cannot get statistics for document', err);
        return -1;
      });
  }
}
