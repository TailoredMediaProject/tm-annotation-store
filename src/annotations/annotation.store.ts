import {AnnotationMethods} from "./AnnotationMethods";
import {Annotation} from "./annotation.model";
import express from "express";
import {AnnotationDto, exportAnnotation, importAnnotation} from "./annotation-dto.model";
import {ObjectId} from "mongodb";

export class AnnotationStore extends AnnotationMethods {

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
            });
        router.route('/')
            .get((req, res, next) => {
                this.listAnnotations()
                    .then(annotations => {
                        res.json(annotations);
                    })
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
            });
        return router;
    }

    private push(annotations: Annotation | Annotation[]): Promise<any> {
        if (Array.isArray(annotations)) {
            return this.pushAnnotations(annotations.map(importAnnotation));
        }
        return this.pushAnnotation(importAnnotation(annotations));
    }

    override async pushAnnotation(annotation: Annotation): Promise<any> {
        return super.pushAnnotation(annotation)
    }

    override pushAnnotations(annotations: Annotation[]): Promise<any> {
        return super.pushAnnotations(annotations);
    }

    protected override async getAnnotation(_id: ObjectId, prefixed: boolean = false): Promise<any> {
        return this.exportDboToDto(await super.getAnnotation(_id, prefixed));
    }

    override listAnnotations(filter?: Document[]): Promise<any> {
        const uri = this.annotationBaseURI;
        return super.listAnnotations(filter)
            .then((annotations: Annotation[]) => annotations
                .map(annotation => exportAnnotation(annotation, uri)));
    }

    protected exportDboToDto(annotation: Annotation): AnnotationDto {
        return exportAnnotation(annotation, this.annotationBaseURI);
    }
}
