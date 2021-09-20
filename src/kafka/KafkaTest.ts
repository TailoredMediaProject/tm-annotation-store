import {ConsumerObserver} from "./ConsumerObserver";
import {KafkaClient} from "./KafkaClient";
import {KafkaMessage} from "kafkajs";

export class KafkaTest implements ConsumerObserver {

    private consumerId: number = -1;
    private readonly kafkaClient: KafkaClient = KafkaClient.getClient();

    constructor() {
        this.consumerId = this.kafkaClient.createConsumer(this, 'test-group');
        this.kafkaClient.subscribe(this.consumerId, 'testTopic').then(() => console.log('Subscribed!')).catch(console.log);
    }

    didReceiveNewMessage(topic: string, message: KafkaMessage): void {
        console.log('Kafka test: ');
        console.log(topic, message);
        console.log(message.value?.toString());
    }
}