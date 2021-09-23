import {MessageManager} from "../messageManager/MessageManager";
import {Annotation} from "../../annotations/model";
import {AnnotationStore} from "../../annotations/store";
import {IMessageManagerConfig} from "../messageManager/IMessageManagerConfig";
import bufferToJson from "../JSONConverter";
import {AnnotationUpdateTrigger} from "./AnnotationUpdateTrigger";

enum AnnotationBody {
    RESOURCE='bodyResource',
    TEXT='bodyText'
}

enum AnnotationTarget {
    RESOURCE='targetResource',
    TEXTSELECTOR='targetTextSelector',
    FRAGMENTSELECTOR='targetFragmentSelector'
}

export class AnnotationMessageManager extends MessageManager {
    private readonly annotationStore: AnnotationStore;
    constructor(messageManagerConfig: IMessageManagerConfig | IMessageManagerConfig[], annotationStore: AnnotationStore) {
        super(messageManagerConfig);
        this.annotationStore = annotationStore;
    }
    create(topic: string, content: any): Promise<any> {
        return new Promise(((resolve, reject) => {
            try {
                const annotationContent = bufferToJson(content);
                if (!annotationContent) {
                    return reject('Annotation (Create): Content is not valid!');
                }
                const annotation = AnnotationMessageManager.createAnnotationFromJson(annotationContent);
                this.annotationStore.pushAnnotation(annotation).then(createdAnnotation => {
                    console.log(createdAnnotation);
                    resolve(createdAnnotation.id);
                });
            } catch (error) {
                console.log(error);
                reject(error);
            }
        }));
    }

    delete(topic: string, content: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            try {
                const annotationContent = bufferToJson(content);
                if (!annotationContent) {
                    return reject('Annotation (Delete): Content is not valid!');
                }
                if ('id' in annotationContent) {
                    console.log('Deleting Annotation with ID: ', annotationContent.id);
                    return this.annotationStore.deleteAnnotation(annotationContent.id).then(() => console.log('Deleted!'));
                } else if ('filter' in annotationContent) {
                    console.log('Deleting Annotations with targetID: ', annotationContent.filter.targetId);
                    return this.annotationStore.deleteAnnotations(annotationContent.filter.targetId).then(() => console.log('Deleted'));
                } else {
                    reject('No ID given to delete one or more annotations!');
                }
            } catch (error){
                reject(error);
            }
        });
    }

    update(topic: string, content: any): Promise<void> {
        return Promise.resolve(undefined);
    }

    private static createAnnotationFromJson(content: any): Annotation {
        const annotation = Annotation.create();
        const {body, bodyType} = AnnotationMessageManager.setAnnotationBody(content);
        annotation.setBody(body, bodyType);
        const {target, targetType} = AnnotationMessageManager.setAnnotationTarget(content);
        annotation.setTarget(target, targetType);
        return annotation.setHashSum();
    }

    private static setAnnotationBody(content: any): {body: any, bodyType: string} {
        if (AnnotationBody.RESOURCE in content) {
            return {body: content[AnnotationBody.RESOURCE], bodyType: AnnotationBody.RESOURCE};
        } else if (AnnotationBody.RESOURCE in content) {
            return {body: content[AnnotationBody.TEXT], bodyType: AnnotationBody.TEXT};
        } else {
            throw new Error('Body has to be set!');
        }
    }

    private static setAnnotationTarget(content: any): { target: any, targetType: string } {
        if (AnnotationTarget.RESOURCE in content) {
            return {target: content[AnnotationTarget.RESOURCE], targetType: AnnotationTarget.RESOURCE};
        } else if (AnnotationTarget.TEXTSELECTOR in content) {
            return {target: content[AnnotationTarget.TEXTSELECTOR], targetType: AnnotationTarget.TEXTSELECTOR};
        } else if (AnnotationTarget.FRAGMENTSELECTOR in content) {
            return {target: content[AnnotationTarget.FRAGMENTSELECTOR], targetType: AnnotationTarget.FRAGMENTSELECTOR};
        } else {
            throw new Error('Target has to be set');
        }
    }

}