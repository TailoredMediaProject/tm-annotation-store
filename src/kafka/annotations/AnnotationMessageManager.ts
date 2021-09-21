import {MessageManager} from "../messageManager/MessageManager";
import {Annotation} from "../../annotations/model";
import {AnnotationStore} from "../../annotations/store";
import {IMessageManagerConfig} from "../messageManager/IMessageManagerConfig";

export class AnnotationMessageManager extends MessageManager {
    private readonly annotationStore: AnnotationStore;
    constructor(messageManagerConfig: IMessageManagerConfig, annotationStore: AnnotationStore) {
        super(messageManagerConfig);
        this.annotationStore = annotationStore;
    }
    create(topic: string, content: any): Promise<void> {
        return this.annotationStore.pushAnnotation(Annotation.fromJson(content));
    }

    delete(topic: string, content: any): Promise<void> {
        if ('id' in content) {
            return this.annotationStore.deleteAnnotation(content.id);
        }
        else if ('filter' in content) {
            return this.annotationStore.deleteAnnotations(content.filter);
        }
        console.error('No valid property defined, to delete annotation(s)!')
        return Promise.resolve();
    }

    update(topic: string, content: any): Promise<void> {
        return Promise.resolve(undefined);
    }

}