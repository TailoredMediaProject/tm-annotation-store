import {Annotation, Body, Origin, Target} from "./annotation.model";
import {ObjectId} from "mongodb";

export interface AnnotationDto {
    id: string,
    origin: Origin,
    replaces?: string,
    replacedBy?: string,
    readonly created: Date,
    body: Body | Body[]
    target: Target | Target[]
}

const annotationDbo2Dto = (dbo: Annotation): AnnotationDto => ({
    id: dbo._id.toHexString(),
    origin: dbo.origin,
    replaces: dbo.replaces,
    replacedBy: dbo.replacedBy,
    created: dbo.created,
    body: dbo.body,
    target: dbo.target,
})

const annotationDto2Dbo = (dto: AnnotationDto): Annotation => ({
    _id: new ObjectId(),
    origin: dto.origin,
    replaces: dto.replaces,
    replacedBy: dto.replacedBy,
    created: dto.created,
    body: dto.body,
    target: dto.target,
});

export const exportAnnotation = (annotation: Annotation, annotationBaseURI: string = ''): AnnotationDto => {
    const dto = annotationDbo2Dto(annotation);
    dto.id = annotationBaseURI + dto.id;
    return dto;
}

export const importAnnotation = (annotation: any): Annotation => {
    if (annotation && annotation._id !== undefined) {
        return annotation as Annotation;
    }
    return annotationDto2Dbo(annotation as AnnotationDto);
}