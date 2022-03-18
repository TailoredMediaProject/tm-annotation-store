import {Annotation} from './annotation.model';
import {ObjectId} from 'mongodb';
import {Annotation as AnnotationDto, Body, BodyType, ResourceBody} from '../openapi';
import {UtilService} from '../services/Util.service';

export class AnnotationConverter {
  private static readonly ENSURE_RESOURCE_BODY_URI = true;

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
        } catch {
        }
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
    dbo.body?.forEach(body => body.id = AnnotationConverter.urlToId(body.id));
    dbo.target?.forEach(target => target.source = AnnotationConverter.urlToId(target.source));

    return dbo;
  };

  // @ts-ignore
  public static readonly addBaseUri = (id: unknown, annotationBaseURI: string): string => !!id ? `${annotationBaseURI}/${id}` : undefined;

  public static dbo2Dto = (annotation: Annotation, annotationBaseURI: string): AnnotationDto => {
    const dto: AnnotationDto = this.objectDbo2Dto(annotation);

    dto.id = AnnotationConverter.addBaseUri(dto.id, annotationBaseURI);
    dto.replacedBy = AnnotationConverter.addBaseUri(dto.replacedBy, annotationBaseURI);
    dto.replaces = AnnotationConverter.addBaseUri(dto.replaces, annotationBaseURI);
    dto.body = !!dto?.body?.length ? dto.body.map((body: Body) => {
      body.id = AnnotationConverter.addBaseUri(body.id, annotationBaseURI);
      return AnnotationConverter.resolveBody(body);
    }) : [];
    dto.target = !!dto?.target?.length ? dto.target.map(target => {
      if (UtilService.objectIdIsValid(target.source)) {
        target.source = AnnotationConverter.addBaseUri(target.source, annotationBaseURI);
      }
      return target;
    }) : [];

    return dto;
  };

  private static readonly resolveBody = (body: Body): Body => {
    if (this.ENSURE_RESOURCE_BODY_URI && body.type === BodyType.ResourceBody) {
      const rBody: ResourceBody = body as ResourceBody;
      // @ts-ignore
      const ifUrlOrElse = (uri: string, yes, no) => {
        try {
          new URL(uri); // URL check
          yes();
        } catch (e) { // If knowledge store entry, extract the link
          no();
        }
      };

      ifUrlOrElse(rBody.value, (): void => {}, (): void => {
        // @ts-ignore
        const uri: string = rBody?.value?.canonicalLink;
        ifUrlOrElse(uri, (): void => {rBody.value = uri;}, (): void => {
            // @ts-ignore
            rBody.value = ObjectId.isValid(rBody?.value?.id) ? rBody?.value?.id : undefined;
            ifUrlOrElse(rBody.value, (): void => {}, (): void => {rBody.value = `https://data.tmedia.redlink.io/kb/${rBody.value}`;});
          }
        );
      });

      return rBody;
    }

    return body;
  };
}
