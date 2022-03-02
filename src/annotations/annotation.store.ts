import {AbstractAnnotationStore} from './abstract-annotation.store';
import {Annotation} from './annotation.model';
import express from 'express';
import {AnnotationConverter} from './annotation.converter';
import {Annotation as AnnotationDto} from '../openapi';
import {Filter, ObjectId} from 'mongodb';
import {ApiValidation} from '../services/ApiValidation';

export class AnnotationStore extends AbstractAnnotationStore {
  private readonly requiredAnnotationProperties: string[] = ['origin', 'created', 'target', 'body'];

  protected addRoutes(router: express.Router): express.Router {
    router.route('/')
      .post((req, res, next) => {
        if (ApiValidation.validateContentTypeHeader(req, res)) {
          if (!!req?.body) {
            this.push(req, res)
              .then(annotation => res
                .status(200)
                .json(annotation))
              .catch(next);
          } else {
            res.status(400)
              .json('Body missing');
          }
        }
      }).get((req, res, next) => {
      if (ApiValidation.validateContentTypeHeader(req, res)) {
        this.listAnnotations()
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
                  if(err instanceof Error && err?.message?.startsWith(AbstractAnnotationStore.ERROR_ANNOTATION_NOT_FOUND)) {
                    res.status(404).json(err.message);
                  } else {
                    next(err);
                  }
                });
            } else {
              res.status(400)
                .json('Invalid ID');
            }
          } else {
            res.status(400)
              .json('ID missing');
          }
        }
      });
    return router;
  }

  // @ts-ignore
  private push(req, res): Promise<any> {
    const annotationsDtos: AnnotationDto[] = Array.isArray(req.body) ? req.body : [req.body];
    const itemsErrorMessage: string = annotationsDtos.reduce((accumulator: string, dto: AnnotationDto, i: number) => {
      const errorMessage = ApiValidation.checkProperties(this.requiredAnnotationProperties, dto);

      if (!!errorMessage) {
        return `${accumulator}Item # ${i}: ${errorMessage}. `;
      }

      return '';
    }, '');

    if (!!itemsErrorMessage) {
      res.status(400)
        .json(itemsErrorMessage);
      return Promise.reject();
    } else {
      return Promise.all(annotationsDtos.map(dto => this.pushAnnotation(AnnotationConverter.dto2Dbo(dto))))
        .then((annotations: Annotation[]) => this.mapOldIdToNewId(annotationsDtos, annotations.map(annotation => annotation._id)));
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
}
