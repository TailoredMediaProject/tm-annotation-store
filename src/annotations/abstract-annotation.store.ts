import {AnnotationStoreConfig} from './config';
import {DataSource} from 'apollo-datasource';
import express from 'express';
import {Filter, InsertOneResult, ObjectId, WithId} from 'mongodb';
import {ValidationError} from 'apollo-server';
import {Annotation} from './annotation.model';
import {UtilService} from "../services/Util.service";
import {Body} from "../openapi";

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

  public pushAnnotation(annotation: any): Promise<any> {
    // Each annotation gets inserted
    return this.config.annotationsCollection
      .insertOne({
        ...annotation,
        created: new Date(),
        body: annotation.body.map((body: any) => {
          if (!UtilService.objectIdIsValid(body.id)) {
            body.id = new ObjectId()
          }
          return body;
        }),
      })
      .then((insertOneResult: InsertOneResult<Annotation>) => {
        // If annotation has replaces set, update the replaced annotation#replacedBy property if empty
        if (!!annotation.replaces) {
          // Tested $ifNull operator on findOneAndUpdate#$set#replacedBy and in aggregation pipeline, does not work!
          this.config.annotationsCollection.findOne({ _id: new ObjectId(annotation.replaces) })
            // @ts-ignore
            .then((replaced: WithId<Annotation>): void => {
              if (!replaced?.replacedBy) {
                void this.config.annotationsCollection.updateOne(
                  { _id: new ObjectId(annotation.replaces) },
                  { $set: { replacedBy: insertOneResult.insertedId.toHexString() } }
                );
              }
            });
        }

        return this.config.annotationsCollection.findOne({ _id: insertOneResult.insertedId });
      });
  }

  // @ts-ignore
  public pushAnnotations(annotations): Promise<any> {
    return Promise.all(annotations.map(this.pushAnnotation));
  }

  public getAnnotationFromId(id: string | ObjectId): Promise<any> {
    try {
      return this.getAnnotation(new ObjectId(id), true);
    } catch (error) {
      return Promise.reject('Object ID not valid!');
    }
  }

  public getAnnotationFromUrl(url: string): Promise<any> {
    return this.getAnnotation(this.objectIdFromUrl(url, this.annotationBaseURI));
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
    return this.deleteAnnotations({ _id: this.objectIdFromUrl(url, this.annotationBaseURI) });
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

  protected objectIdFromUrl(url: string, baseUri: string): ObjectId {
    if (url.startsWith(baseUri)) {
      try {
        return new ObjectId(url.substring(url.lastIndexOf('/') + 1));
      } catch (err) {
        console.error(err);
        throw new ValidationError('annotation url is not correct, trailing id not valid');
      }
    } else if (url.startsWith('anno')) {
      try {
        return new ObjectId(url.substring(url.lastIndexOf(':') + 1));
      } catch (err) {
        console.error(err);
        throw new ValidationError('annotation id is not correct, trailing id not valid');
      }
    } else {
      try {
        return new ObjectId(url);
      } catch (err) {
        console.error(err);
        throw new ValidationError('id is not correct');
      }
    }
  }
}
