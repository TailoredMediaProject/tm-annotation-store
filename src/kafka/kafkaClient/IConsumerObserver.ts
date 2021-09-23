import {KafkaMessage} from "kafkajs";

export interface IConsumerObserver {
    didReceiveNewMessage(message: IReceivedKafkaMessage): void;
}

export interface IReceivedKafkaMessage {
    topic: string,
    partition: number,
    message: KafkaMessage
}