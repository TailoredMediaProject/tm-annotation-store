import {ObjectId} from 'mongodb';
import {
  Body,
  BodyType,
  DomainType,
  FragmentResource,
  MetaDataBody,
  Origin,
  OriginType,
  ResourceBody,
  Selector,
  Target,
  TargetType
} from '../openapi';
import {Annotation} from './annotation.model';

export const createAnnotation = (
  body: [Body],
  target: Target[],
  origin: Origin = {creator: 'AnnotationStore', type: OriginType.Manual},
  replaces?: string,
  replacedBy?: string): Annotation => {
  return {
    _id: new ObjectId(),
    created: new Date().toISOString(),
    origin,
    body,
    target,
    replaces,
    replacedBy
  }
}

export const createAnnotationBody = (id: string, confidence: number = 1, quantification = -1, type: BodyType, relation?: string, value?: any): Body => {
  let body: Body = {
    id,
    confidence,
    quantification,
    type,
    domains: []
  }

  if (relation) {
    switch (type) {
      case BodyType.MetaDataBody:
        const metaBody = body as MetaDataBody;
        metaBody.value = value;
        metaBody.relation = relation;
        metaBody.domains = [DomainType.Metadata];
        body = metaBody;
        break;
      case BodyType.ResourceBody:
        const resourceBody = body as ResourceBody;
        resourceBody.value = value;
        resourceBody.relation = relation;
        resourceBody.domains = [DomainType.Video];
        body = resourceBody;
        break;
      default:
        body.domains = [DomainType.Video];
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
    (target as FragmentResource).selector = selector;
  }
  return target;
}
