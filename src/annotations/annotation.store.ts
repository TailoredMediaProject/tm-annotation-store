import {AbstractAnnotationStore} from "./abstract-annotation.store";
import {Annotation} from "./annotation.model";
import express from "express";
import {exportAnnotation, importAnnotation} from "./annotation-dto.model";
import {Annotation as AnnotationDto, Body} from "../openapi";
import {Filter, ObjectId} from 'mongodb';
import _ from "lodash";

export class AnnotationStore extends AbstractAnnotationStore {

    protected addRoutes(router: express.Router): express.Router {
        router.route('/')
            .post((req, res, next) => {
                if (req.body !== undefined) {
                    this.push(req.body)
                        .then(annotation => res.json(annotation))
                        .catch(next);
                } else {
                    next('Request body undefined!')
                }
            }).get((req, res, next) => {
                this.listAnnotations()
                    .then(annotations => res.json(annotations))
                    .catch(next)
            });
        router.route('/:id')
            .get((req, res, next) => {
                try {
                    const id = new ObjectId(req.params.id);
                    this.getAnnotation(id)
                        .then((annotation: any) => {
                            res.json(annotation);
                        })
                        .catch(next)
                } catch (error) {
                    console.error(error);
                    next('ID string invalid!');
                }
            })
        return router;
    }

    private push(annotationsDtos: AnnotationDto | AnnotationDto[]): Promise<any> {
        if (Array.isArray(annotationsDtos)) {
            // @ts-ignore
            return this.pushAnnotations(annotationsDtos.map(importAnnotation))
              // @ts-ignore
                .then((insertedAnnotations: AnnotationDto[]) =>
                  // @ts-ignore
                  this.mapOldIdToNewId(annotationsDtos, insertedAnnotations, this.annotationBaseURI)
                );
        }
        return this.insertOneIfNotExisting(importAnnotation(annotationsDtos));
        //return this.pushAnnotation(importAnnotation(annotationsDtos))
         //   .then(objectId => ({id: objectId.toHexString()}));
    }

    override async pushAnnotation(annotation: Annotation): Promise<ObjectId> {
        return super.pushAnnotation(annotation)
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
                      annotation.body.map((body: any) => ({...body, id: body.id.toHexString()}))
                      : {...annotation.body, id: annotation.body.id.toHexString()}
                  return exportAnnotation(annotation, uri)
              })
            );
    }

    protected exportDboToDto(annotation: Annotation): AnnotationDto {
        return exportAnnotation(annotation, this.annotationBaseURI);
    }

    private mapOldIdToNewId(annotations: AnnotationDto[], storedAnnotations: AnnotationDto[], asURL: string = ''): {[key: string]: AnnotationDto} {
        const idDict: {[key: string]: AnnotationDto} = {};

        annotations.forEach(annotation => {
            const found = storedAnnotations.find((item: AnnotationDto) => {
                if (Array.isArray(annotation.body) && Array.isArray(item.body)) {
                    // @ts-ignore
                    annotation.body = annotation.body.map((body: Body, index: number) => ({...body, id: item.body[index].id}))
                } else {
                    (annotation.body as Body).id = (item.body as Body).id;
                }
                return _.isEqual(item.origin, annotation.origin)
                    && _.isEqual(item.body, annotation.body)
                    && _.isEqual(item.target, annotation.target);
            })
            if (found) {
                idDict[annotation.id] = found;
            }
        });
        return idDict;
    }
}
