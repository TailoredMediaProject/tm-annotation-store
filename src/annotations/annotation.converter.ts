import {Annotation} from './annotation.model';
import {ObjectId} from 'mongodb';
import {Annotation as AnnotationDto} from '../openapi';
import {UtilService} from "../services/Util.service";

export class AnnotationConverter {
  private static readonly objectDbo2Dto = (dbo: Annotation): AnnotationDto => ({
    id: dbo._id.toHexString(),
    origin: dbo.origin,
    replaces: dbo.replaces,
    replacedBy: dbo.replacedBy,
    created: dbo.created,
    body: dbo.body,
    target: dbo.target
  });

  private static readonly objectDto2Dbo = (dto: AnnotationDto): Annotation => ({
    _id: new ObjectId(),
    origin: dto.origin,
    replaces: dto.replaces,
    replacedBy: dto.replacedBy,
    created: '',
    body: dto.body,
    target: dto.target
  });

  private static readonly urlToId = (id: any): string => {
    try {
      const url = new URL(id);
      const pathEnd: string = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
      let objectId: ObjectId | undefined = undefined;
      if (pathEnd.length > 0) {
        try {
          objectId = new ObjectId(pathEnd[pathEnd.length - 1]);
        } catch {}
      }
      return objectId ? objectId : id;
    } catch (err) {
      return id;
    }
  };

  public static dto2Dbo = (dto: AnnotationDto): Annotation => {
    let dbo: Annotation;

    if (!!dto?.id) {
      dbo = this.objectDto2Dbo(dto);
    } else {
      // @ts-ignore
      dbo = dto as Annotation;
    }

    dbo.replacedBy = AnnotationConverter.urlToId(dbo.replacedBy);
    dbo.replaces = AnnotationConverter.urlToId(dbo.replaces);
    dbo.body?.forEach(body => body.id = AnnotationConverter.urlToId(body.id))
    dbo.target?.forEach(target => target.source = AnnotationConverter.urlToId(target.source))

    return dbo;
  };

  // @ts-ignore
  public static readonly addBaseUri = (id: unknown, annotationBaseURI: string): string => !!id ? `${annotationBaseURI}/${id}`: undefined;

  public static dbo2Dto = (annotation: Annotation, annotationBaseURI: string): AnnotationDto => {
    const dto: AnnotationDto = this.objectDbo2Dto(annotation);

    dto.id = AnnotationConverter.addBaseUri(dto.id, annotationBaseURI);
    dto.replacedBy = AnnotationConverter.addBaseUri(dto.replacedBy, annotationBaseURI);
    dto.replaces = AnnotationConverter.addBaseUri(dto.replaces, annotationBaseURI);
    dto.body?.forEach(body => body.id = AnnotationConverter.addBaseUri(body.id, annotationBaseURI))
    dto.target?.forEach(target => {
      if (UtilService.objectIdIsValid(target.source)) {
        target.source = AnnotationConverter.addBaseUri(target.source, annotationBaseURI);
      }
    })
    return dto;
  };

}
