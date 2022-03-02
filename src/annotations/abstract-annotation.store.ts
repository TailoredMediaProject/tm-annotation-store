import {AnnotationStoreConfig} from './config';
import {DataSource} from 'apollo-datasource';
import express from 'express';
import {Filter, InsertManyResult, InsertOneResult, ModifyResult, ObjectId} from 'mongodb';
import {ValidationError} from 'apollo-server';
import {Body} from '../openapi';
import {Annotation} from './annotation.model';

export abstract class AbstractAnnotationStore extends DataSource {
  public static readonly ERROR_ANNOTATION_NOT_FOUND = 'No annotation found with ID';
  protected readonly annotationBaseURI: string;
  readonly contextLinks: any[];

  constructor(protected config: AnnotationStoreConfig) {
    super();
    this.annotationBaseURI = `${config.baseURI}${config.annotationBasePath}`;
    this.contextLinks = [
      'https://www.w3.org/ns/anno.jsonld'
    ];
    console.info(`Initialized AnnotationStore with baseURI ${this.annotationBaseURI}`);
  }

  public applyMiddleware(app: express.Application): void {
    const router = this.addRoutes(express.Router());

    app.use(this.config.annotationBasePath, router);
  }

  protected abstract addRoutes(router: express.Router): express.Router;

  public pushAnnotation(annotation: any): Promise<ObjectId> {
    // Each annotation gets inserted
    return this.config.annotationsCollection
      .insertOne({
        ...annotation,
        created: new Date()
      })
      .then(async (insertOneResult: InsertOneResult<Annotation>) => {
        // Check if there are equal, but other annotations
        // @ts-ignore
        const updatedResult: ModifyResult<Annotation> = await this.config.annotationsCollection.findOneAndUpdate(
          {
            _id: {$ne: insertOneResult.insertedId},
            origin: annotation.origin,
            body: annotation.body,
            target: annotation.target,
            replacedBy: undefined
          },
          {
            $set: {
              replacedBy: insertOneResult.insertedId
            }
          },
          {
            returnDocument: 'after'
          }
        );

        // The old annotation was updated
        if (!!updatedResult?.value?._id && !!updatedResult?.value?.replacedBy) {
          // So create its link to the new one. As we only return the updated ID, no need to wait here for update finish
          void this.config.annotationsCollection.findOneAndUpdate(
            {
              _id: insertOneResult.insertedId
            },
            {
              $set: {
                replaces: updatedResult?.value?._id
              }
            }
          );
        }

        return insertOneResult.insertedId;
      });
  }

  public pushAnnotations(annotations: any): Promise<any> {
    return this.config.annotationsCollection
      .insertMany(annotations.map((annotation: any) => ({
        ...annotation,
        created: new Date(),
        body: annotation.body.map((body: Body) => ({
          ...body,
          id: new ObjectId()
        }))
      })))
      .then((document: InsertManyResult<Annotation>) =>
        // @ts-ignore
        this.listAnnotations({ _id: { $in: Object.keys(document.insertedIds).map((key: string) => document.insertedIds[key]) } })
      );
  }

  public getAnnotationFromId(id: string | ObjectId): Promise<any> {
    try {
      return this.getAnnotation(new ObjectId(id), true);
    } catch (error) {
      return Promise.reject('Object ID not valid!');
    }
  }

  public getAnnotationFromUrl(url: string): Promise<any> {
    return this.getAnnotation(this.objectIdFromUrl(url));
  }

  protected getAnnotation(_id: ObjectId, prefixed = false): Promise<any> {
    return this.config.annotationsCollection
      .find({ _id })
      .toArray()
      .then(document => {
        if (!document || document.length < 1) {
          return Promise.reject(new Error(`${AbstractAnnotationStore.ERROR_ANNOTATION_NOT_FOUND} ${_id.toHexString()}`));
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
    return this.deleteAnnotations({ _id: this.objectIdFromUrl(url) });
  }

  public deleteAnnotations(filter: any): Promise<void> {
    return this.config.annotationsCollection.deleteMany(filter).then();
  }

  protected idExists(id: string | ObjectId): Promise<boolean> {
    try {
      const oId = new ObjectId(id);
      return this.config.annotationsCollection
        .countDocuments({ '_id': oId }, { limit: 1 })
        .then(count => count > 0);
    } catch (e) {
      return Promise.resolve(false);
    }
  }

  private objectIdFromUrl(url: string): ObjectId {
    if (url.startsWith(this.annotationBaseURI)) {
      try {
        return new ObjectId(url.substr(url.lastIndexOf('/') + 1));
      } catch (err) {
        console.error(err);
        throw new ValidationError('annotation url is not correct, trailing id not valid');
      }
    } else if (url.startsWith('anno')) {
      try {
        return new ObjectId(url.substr(url.lastIndexOf(':') + 1));
      } catch (err) {
        console.error(err);
        throw new ValidationError('annotation id is not correct, trailing id not valid');
      }
    } else {
      throw new ValidationError('annotation url is not correct');
    }
  }

}
