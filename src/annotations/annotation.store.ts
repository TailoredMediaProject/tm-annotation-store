import {AnnotationMethods} from "./AnnotationMethods";
import {Annotation} from "./annotation.model";
import express from "express";
import {AnnotationDto, exportAnnotation, importAnnotation} from "./annotation-dto.model";
import {ObjectId} from "mongodb";

export class AnnotationStore extends AnnotationMethods {

    protected addRoutes(router: express.Router): express.Router {
        router.route('/')
            .post((req, res) => {
                if (req.body !== undefined) {
                    this.push(req.body).then(annotation => res.json(annotation));
                }
            });
        router.route('/')
            .get((req, res) => {
                this.listAnnotations().then(annotations => {
                    res.json(annotations);
                })
            });
        return router;
    }

    private push(annotations: Annotation | Annotation[]): Promise<any> {
        if (Array.isArray(annotations)) {
            return this.pushAnnotations(annotations.map(importAnnotation));
        }
        return this.pushAnnotation(importAnnotation(annotations));
    }

    override pushAnnotation(annotation: Annotation): Promise<any> {
        return super.pushAnnotation(annotation)
            .then(this.exportDboToDto);
    }

    override pushAnnotations(annotations: Annotation[]): Promise<any> {
        return super.pushAnnotations(annotations)
            .then((annotations: Annotation[]) => annotations
                .map(this.exportDboToDto));
    }

    protected override getAnnotation(_id: ObjectId, prefixed: boolean = false): Promise<any> {
        return super.getAnnotation(_id, prefixed).then(this.exportDboToDto);
    }

    override listAnnotations(filter?: Document[]): Promise<any> {
        return super.listAnnotations(filter)
            .then((annotations: Annotation[]) => annotations.map(this.exportDboToDto));
    }

    protected exportDboToDto(annotation: Annotation): AnnotationDto {
        return exportAnnotation(annotation, this.annotationBaseURI);
    }
}
