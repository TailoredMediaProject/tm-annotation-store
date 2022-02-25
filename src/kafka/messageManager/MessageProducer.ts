import {KafkaClient} from "../kafkaClient/KafkaClient";
import {IHeaders} from "kafkajs";
import {MessageHeader, MessageMethod} from "./MessageHeader";

export abstract class MessageProducer {
    private readonly kafkaClient: KafkaClient;
    private topics: string[] = [];

    constructor() {
        this.kafkaClient = KafkaClient.getClient();
    }

    private topicExists(topic: string): boolean {
        if (topic === '') {
            return false;
        }
        if (!this.topics.includes(topic)) {
            try {
                this.topics.push(this.kafkaClient.createProducer(topic));
            } catch (error){
                console.error(error);
                return false;
            }
        }
        return true;
    }

    private static checkHeaders(headers: IHeaders): boolean {
        return !(Object.keys(headers).length === 0
            || MessageHeader.NON in headers
            || !Object.values(headers)
            || Object.values(headers).includes(MessageMethod.NON));
    }

    protected async sendUpdate(topic: string, id: string, headers: { [key: string]: Buffer | string | undefined }): Promise<any> {
        return new Promise(((resolve, reject) => {
            try {
                if (this.topicExists(topic)) {
                    const value = JSON.stringify({id});
                    if (!MessageProducer.checkHeaders(headers)) {
                        return reject('Headers are not valid!');
                    }
                    return this.kafkaClient
                        .sendMessage(topic, [{value, headers}])
                        .then(resolve)
                        .catch(reject);
                }
                return reject('No producer with topic: ' + topic);
            } catch (error){
                reject(error);
            }
        }));
    }

    async shutdown(): Promise<void> {
        return this.kafkaClient.shutdownProducerWithTopics(this.topics);
    }

}
