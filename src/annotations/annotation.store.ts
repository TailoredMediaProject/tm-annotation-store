import {AbstractAnnotationStore} from './abstract-annotation.store';
import {Annotation} from './annotation.model';
import express, {NextFunction} from 'express';
import {AnnotationConverter} from './annotation.converter';
import {Annotation as AnnotationDto} from '../openapi';
import {Filter, ObjectId} from 'mongodb';
import {ApiValidation} from '../services/ApiValidation';
import {AnnotationError} from '../models/annotation-error.model';

export class AnnotationStore extends AbstractAnnotationStore {
  private readonly requiredAnnotationProperties: string[] = ['origin', 'created', 'target', 'body'];

  protected addRoutes(router: express.Router): express.Router {
    router.route('/')
      .post((req, res, next: NextFunction) => {
        if (ApiValidation.validateContentTypeHeader(req, res)) {
          if (!!req?.body) {
            this.push(req, res, next)
              .then(annotation => res
                .status(200)
                .json(annotation))
              .catch(next);
          } else {
            next(new AnnotationError(400, 'Body mising'));
            return;
          }
        }
      }).get((req, res, next) => {
      if (ApiValidation.validateContentTypeHeader(req, res)) {
        this.listAnnotations(this.createListAnnotationsFilter(req.query))
          .then(annotations => res.json(annotations))
          .catch(next);
      }
    });

    router.route('/:id')
      .get((req, res, next) => {
        if (ApiValidation.validateContentTypeHeader(req, res)) {
          if (!!req?.params?.id) {
            const pathId: string = req.params.id;

            if (ObjectId.isValid(pathId)) {
              const id = new ObjectId(req.params.id);

              this.getAnnotation(id)
                .then((annotation: any) => res.json(annotation))
                .catch(err => {
                  if (err instanceof Error && err?.message?.startsWith(AbstractAnnotationStore.ERROR_ANNOTATION_NOT_FOUND)) {
                    next(new AnnotationError(404, err.message));
                    return;
                  } else {
                    next(err);
                    return;
                  }
                });
            } else {
              next(new AnnotationError(400, 'Invalid ID'));
              return;
            }
          } else {
            next(new AnnotationError(400, 'ID missing'));
            return;
          }
        }
      });
    return router;
  }

  // @ts-ignore
  private push(req, res, next: NextFunction): Promise<any> {
    const annotationsDtos: AnnotationDto[] = Array.isArray(req.body) ? req.body : [req.body];

    if (annotationsDtos.length === 0) {
      next(new AnnotationError(400, 'At least one annotation is required for its creation'));
      return Promise.reject();
    } else {
      const itemsErrorMessage: string = annotationsDtos.reduce((accumulator: string, dto: AnnotationDto, i: number) => {
        const errorMessage = ApiValidation.checkProperties(this.requiredAnnotationProperties, dto);

        if (!!errorMessage) {
          return `${accumulator}Item # ${i}: ${errorMessage}. `;
        }

        return '';
      }, '');

      if (!!itemsErrorMessage) {
        next(new AnnotationError(400, itemsErrorMessage));
        return Promise.reject();
      } else {
        return Promise.all(annotationsDtos.map(dto => this.pushAnnotation(AnnotationConverter.dto2Dbo(dto))))
          .then((annotations: Annotation[]) => this.mapOldIdToNewId(annotationsDtos, annotations.map(annotation => annotation._id)))
          .catch(next);
      }
    }
  }

  protected override async getAnnotation(_id: ObjectId, prefixed: boolean = false): Promise<any> {
    return AnnotationConverter.dbo2Dto(await super.getAnnotation(_id, prefixed), this.annotationBaseURI);
  }

  // @ts-ignore
  listAnnotations(filter?: Filter<Annotation[]>): Promise<AnnotationDto[]> {
    const uri = this.annotationBaseURI;
    // @ts-ignore
    return super.listAnnotations(filter)
      // @ts-ignore
      .then((annotations: any): AnnotationDto[] =>
        annotations.map((annotation: any) => {
          annotation.body = annotation.body.map((body: any) => ({
            ...body,
            id: body?.id
          }));
          return AnnotationConverter.dbo2Dto(annotation, uri);
        })
      );
  }

  private mapOldIdToNewId(olds: AnnotationDto[], objectIds: ObjectId[]): { [key: string]: string } | string {
    const idDict: { [key: string]: string } = {};

    olds.forEach((old: AnnotationDto, i: number) => {
      const newId = AnnotationConverter.addBaseUri(objectIds[i].toHexString(), this.annotationBaseURI);
      const dictId = !!old?.id ? old.id : newId;
      idDict[dictId] = newId;
    });

    const keys: string[] = Object.keys(idDict);

    return keys.length === 1 ? idDict[keys[0]] : idDict;
  }

  private readonly createListAnnotationsFilter = (query: any) => {
    const filter: Filter<Annotation[]> = {};
    const arrayDelimitersRegex = /[;,\|]+/;

    if (!!query?.ids) {
      const ids: string[] = Array.isArray(query.ids) ? query.ids : query.ids.split(arrayDelimitersRegex);

      if (!!ids?.length) {
        filter._id = {
          $in: ids.map((id: string) => this.objectIdFromUrl(id, this.annotationBaseURI))
        };
      }
    }

    if (!!query?.assetUris) {
      const uris: string[] = Array.isArray(query.assetUris) ? query.assetUris : query.assetUris.split(arrayDelimitersRegex);

      if (!!uris?.length) {
        filter['target.source'] = {
          $in: uris
        };
      }
    }

    return filter;
  };
}
