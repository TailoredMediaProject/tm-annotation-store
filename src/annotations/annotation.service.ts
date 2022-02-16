import {
    Body,
    BodyType, Annotation,
    MetadataAnnotationBody, Origin,
    ResourceAnnotationBody,
    ResourceAnnotationTarget, Selector,
    Target,
    TargetType
} from "./annotation.model";
import {ObjectId} from "mongodb";

export const createAnnotation = (
    body: Body | Body[],
    target: Target | Target[],
    origin: Origin = {creator: 'AnnotationStore', type: "manual"},
    replaces?: string,
    replacedBy?: string): Annotation => {
    return {
        _id: new ObjectId(),
        created: new Date(),
        origin,
        body,
        target,
        replaces,
        replacedBy
    }
}

export const createAnnotationBody = (id: string, confidence: number = 100, type: BodyType, relation?: string, value?: any): Body => {
    let body: Body = {
        id,
        confidence,
        type
    }
    if (relation) {
        switch (type) {
            case "MetadataBody":
                const metaBody = body as MetadataAnnotationBody;
                metaBody.value = value;
                metaBody.relation = relation;
                body = metaBody;
                break;
            case "ResourceBody":
                const resourceBody = body as ResourceAnnotationBody;
                resourceBody.value = value;
                resourceBody.relation = relation;
                body = resourceBody;
                break;
        }
    }
    return body;
}

export const createAnnotationTarget = (type: TargetType, source: string, selector?: Selector): Target => {
    const target: Target = {
        source,
        type
    }

    if (type === "FragmentResource" && selector) {
        (target as ResourceAnnotationTarget).selector = selector;
    }
    return target;
}
