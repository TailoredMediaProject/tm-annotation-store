import {AbstractAnnotationStore} from "./abstract-annotation.store";
import {Annotation} from "./annotation.model";
import express from "express";
import {exportAnnotation, importAnnotation} from "./annotation-dto.model";
import {Annotation as AnnotationDto} from "../openapi";
import {Filter, ObjectId} from 'mongodb';

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
                .then((insertedAnnotations: Annotation[]) =>
                  // @ts-ignore
                  this.mapOldIdToNewId(annotationsDtos, insertedAnnotations, this.annotationBaseURI)
                );
        }
        // return this.insertOneIfNotExisting(importAnnotation(annotations));
        return this.pushAnnotation(importAnnotation(annotationsDtos))
            .then(objectId => ({id: objectId.toHexString()}));
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
            .then((annotations: Annotation[]): AnnotationDto[] =>
              annotations.map(annotation => exportAnnotation(annotation, uri))
            );
    }

    protected exportDboToDto(annotation: Annotation): AnnotationDto {
        return exportAnnotation(annotation, this.annotationBaseURI);
    }

    private mapOldIdToNewId(annotations: AnnotationDto[], storedAnnotations: Annotation[], asURL: string = ''): {[key: string]: string} {
        const idDict: {[key: string]: string} = {};

        annotations.forEach(annotation => {
            const found = storedAnnotations.find(item =>
                item.origin === annotation.origin
                && item.body === annotation.body
                && item.target === annotation.target)
            if (found) {
                idDict[annotation.id] = asURL + found._id.toHexString();
            }
        });
        return idDict;
    }
}
