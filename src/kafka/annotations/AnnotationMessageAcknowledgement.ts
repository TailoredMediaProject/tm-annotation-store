import {MessageProducer} from "../messageManager/MessageProducer";
import {MessageHeader, MessageMethod} from "../messageManager/MessageHeader";

export class AnnotationMessageAcknowledgement extends MessageProducer{
    async sendCreationAck(topic: string, id: string): Promise<any> {
        return super.sendUpdate(AnnotationMessageAcknowledgement.topicNameMutation(topic), id, {[MessageHeader.METHOD]: MessageMethod.CREATE});
    }

    async sendDeletionAck(topic: string, id: string): Promise<any> {
        return super.sendUpdate(AnnotationMessageAcknowledgement.topicNameMutation(topic), id, {[MessageHeader.METHOD]: MessageMethod.DELETE});
    }

    async sendUpdateAck(topic: string, id: string): Promise<any> {
        return super.sendUpdate(AnnotationMessageAcknowledgement.topicNameMutation(topic), id, {[MessageHeader.METHOD]: MessageMethod.UPDATE});
    }

    private static topicNameMutation(topic: string): string {
        if (!topic || topic === '') {
            throw new Error('No topic given!');
        }
        return topic + 'Ack';
    }
}