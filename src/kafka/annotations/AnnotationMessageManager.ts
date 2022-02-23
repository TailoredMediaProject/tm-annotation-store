import {MessageManager} from "../messageManager/MessageManager";
import {Annotation, Filter} from "../../annotations/model";
import {AnnotationStore} from "../../annotations/store";
import {IMessageManagerConfig} from "../messageManager/IMessageManagerConfig";
import bufferToJson from "../JSONConverter";
import {AnnotationMessageAcknowledgement} from "./AnnotationMessageAcknowledgement";

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
    private readonly annotationMessageAcknowledgement: AnnotationMessageAcknowledgement;
    constructor(messageManagerConfig: IMessageManagerConfig | IMessageManagerConfig[], annotationStore: AnnotationStore) {
        super(messageManagerConfig);
        this.annotationStore = annotationStore;
        this.annotationMessageAcknowledgement = new AnnotationMessageAcknowledgement();
    }
    create(topic: string, content: any): Promise<any> {
        return new Promise(((resolve, reject) => {
            try {
                const annotationContent = bufferToJson(content);
                if (!annotationContent) {
                    return reject('Annotation (Create): Content is not valid!');
                }
                const annotation = AnnotationMessageManager.createAnnotationFromJson(annotationContent);
                return this.annotationStore.pushAnnotation(annotation).then(createdAnnotation => {
                    return this.annotationMessageAcknowledgement.sendCreationAck(topic, createdAnnotation.id)
                        .then(resolve);
                }).catch(reject);
            } catch (error) {
                console.log(error);
                reject(error);
            }
        }));
    }

    delete(topic: string, content: any): Promise<any> {
        return new Promise<void>((resolve, reject) => {
            try {
                const annotationContent = bufferToJson(content);
                if (!annotationContent) {
                    return reject('Annotation (Delete): Content is not valid!');
                }
                if ('id' in annotationContent) {
                    console.log('Deleting Annotation with ID: ', annotationContent.id);
                    return this.annotationStore.deleteAnnotation(annotationContent.id).then(() => {
                        console.log('Deleted!');
                        return this.annotationMessageAcknowledgement.sendDeletionAck(topic, annotationContent.id).then(resolve);
                    }).catch(reject);
                } else if ('filter' in annotationContent) {
                    const filter = new Filter(annotationContent.filter);
                    console.log('Deleting Annotations with targetID: ', filter.targetId);
                    return this.annotationStore.deleteAnnotations(filter.toMongoFilter()).then(() => {
                        console.log('Deleted!');
                        return this.annotationMessageAcknowledgement.sendDeletionAck(topic, filter.targetId).then(resolve);
                    }).catch(reject);
                } else {
                    reject('No ID given to delete one or more annotations!');
                }
            } catch (error){
                reject(error);
            }
        });
    }

    update(topic: string, content: any): Promise<void> {
        return Promise.resolve().then(() => this.annotationMessageAcknowledgement.sendUpdateAck(topic, ''));
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

    async shutdown(): Promise<void> {
        return this.annotationMessageAcknowledgement.shutdown().then(() => super.shutdown());
    }

}