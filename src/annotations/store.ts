import {ObjectId} from 'mongodb';
import {Annotation} from './model';
import express from 'express';
import {AnnotationMethods} from "./AnnotationMethods";

export class AnnotationStore extends AnnotationMethods {
    protected addRoutes(router: express.Router): express.Router {
        router.route('/:id')
            .get((req, res) => {
                this.getAnnotationFromId(req.params.id).then((annotation:any) => {
                    res.json(this.addContextLink(annotation))
                },() => {
                    res.status(404).end();
                })
            });
        return router;
    }

    private addContextLink(annotation: any): any {
        annotation['@context'] = this.contextLinks;
        return annotation;
    }

    override pushAnnotation(annotation: Annotation): Promise<any> {
        return super.pushAnnotation(annotation.setHashSum()).then(this.getAnnotationFromDoc);
    }

    override pushAnnotations(annotations: Annotation[]): Promise<any> {
        return super.pushAnnotations(annotations
            .map(annotation => annotation.setHashSum()))
            .then(annotations => annotations.map(this.getAnnotationFromDoc))
    }

    override getAnnotation(_id: ObjectId, prefixed: boolean = false): Promise<any> {
        return super.getAnnotation(_id, prefixed).then(this.getAnnotationFromDoc);
    }

    override listAnnotations(filter?: Document[]): Promise<any> {
        return super.listAnnotations(filter).then(docs => docs.map(this.getAnnotationFromDoc));
    }

    private getAnnotationFromDoc(documents: any): Annotation {
        return Annotation.fromJson(documents).getValue(this.annotationBaseURI);
    }
}
