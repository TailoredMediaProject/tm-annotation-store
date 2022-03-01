import {AbstractAnnotationStore} from './abstract-annotation.store';
import {Annotation} from './annotation.model';
import express from 'express';
import {exportAnnotation, importAnnotation} from './annotation-dto.model';
import {Annotation as AnnotationDto, Body} from '../openapi';
import {Filter, ObjectId} from 'mongodb';
import _ from 'lodash';
import {ApiValidation} from '../services/ApiValidation';

export class AnnotationStore extends AbstractAnnotationStore {
  private readonly requiredAnnotationProperties: string[] = ['origin', 'created', 'target', 'body'];

  protected addRoutes(router: express.Router): express.Router {
    router.route('/')
      .post((req, res, next) => {
        if (ApiValidation.validateContentTypeHeader(req, res)) {
          if (!!req?.body) {
            const isArray = Array.isArray(req.body);
            const errorMessage = isArray ? '' : ApiValidation.checkProperties(this.requiredAnnotationProperties, req.body);

            if (!isArray && !!errorMessage) {
              res.status(400)
                .json(errorMessage);
            } else {
              this.push(req, res)
                .then(annotation => res
                  .status(201)
                  .json(annotation))
                .catch(next);
            }
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
                .then((annotation: any) => {
                  res.json(annotation);
                })
                .catch(next);
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
    const annotationsDtos: AnnotationDto | AnnotationDto[] = req.body;

    if (Array.isArray(annotationsDtos)) {
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
        // @ts-ignore
        return this.pushAnnotations(annotationsDtos.map(importAnnotation))
          // @ts-ignore
          .then((insertedAnnotations: AnnotationDto[]) =>
            // @ts-ignore
            this.mapOldIdToNewId(annotationsDtos, insertedAnnotations, this.annotationBaseURI)
          );
      }
    }
    return this.insertOneIfNotExisting(importAnnotation(annotationsDtos));
    //return this.pushAnnotation(importAnnotation(annotationsDtos))
    //   .then(objectId => ({id: objectId.toHexString()}));
  }

  override async pushAnnotation(annotation: Annotation): Promise<ObjectId> {
    return super.pushAnnotation(annotation);
  }

  protected override async getAnnotation(_id: ObjectId, prefixed: boolean = false): Promise<any> {
    return this.exportDboToDto(await super.getAnnotation(_id, prefixed));
  }

  // @ts-ignore
  listAnnotations(filter?: Filter<Annotation[]>): Promise<AnnotationDto[]> {
    const uri = this.annotationBaseURI;
    // @ts-ignore
    return super.listAnnotations(filter)
      // @ts-ignore
      .then((annotations: any): AnnotationDto[] =>
        annotations.map((annotation: any) => {
          annotation.body = Array.isArray(annotation.body) ?
            annotation.body.map((body: any) => ({ ...body, id: body.id.toHexString() }))
            : { ...annotation.body, id: annotation.body.id.toHexString() };
          return exportAnnotation(annotation, uri);
        })
      );
  }

  protected exportDboToDto(annotation: Annotation): AnnotationDto {
    return exportAnnotation(annotation, this.annotationBaseURI);
  }

  private mapOldIdToNewId(annotations: AnnotationDto[], storedAnnotations: AnnotationDto[], asURL: string = ''): { [key: string]: AnnotationDto } {
    const idDict: { [key: string]: AnnotationDto } = {};

    annotations.forEach(annotation => {
      const found = storedAnnotations.find((item: AnnotationDto) => {
        if (Array.isArray(annotation.body) && Array.isArray(item.body)) {
          // @ts-ignore
          annotation.body = annotation.body.map((body: Body, index: number) => ({ ...body, id: item.body[index].id }));
        } else {
          (annotation.body as Body).id = (item.body as Body).id;
        }
        return _.isEqual(item.origin, annotation.origin)
          && _.isEqual(item.body, annotation.body)
          && _.isEqual(item.target, annotation.target);
      });
      if (found) {
        idDict[annotation.id] = found;
      }
    });
    return idDict;
  }
}
