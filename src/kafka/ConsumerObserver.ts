import {KafkaMessage} from "kafkajs";

export interface ConsumerObserver {
    didReceiveNewMessage(topic: string, message: KafkaMessage): void;
}