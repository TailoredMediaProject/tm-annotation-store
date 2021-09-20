import {ConsumerObserver} from "./ConsumerObserver";
import {KafkaClient} from "./KafkaClient";
import {KafkaMessage} from "kafkajs";

export class KafkaTest implements ConsumerObserver {

    private consumerId: string;
    private producerId: string;
    private readonly kafkaClient: KafkaClient = KafkaClient.getClient();

    constructor() {
        this.consumerId = this.kafkaClient.createConsumer(this, 'test-group');
        this.kafkaClient.subscribe(this.consumerId, 'testTopic').then(() => console.log('Subscribed!')).catch(console.log);
        this.producerId = this.kafkaClient.createProducer('testProducer');
    }

    didReceiveNewMessage(topic: string, message: KafkaMessage): void {
        console.log('Kafka test: ');
        console.log(topic, message);
        console.log(message.value?.toString());
        if (message.value) {
            this.sendMessage(message.value.toString());
        }
    }

    sendMessage(message: string): void {
        console.log('Sending Messages...');
        this.kafkaClient.sendMessage(this.producerId, [{key: this.producerId, value: message + ' (Producer-Ack)'}]).then(console.log);
    }
}