import {IConsumerObserver, IReceivedKafkaMessage} from "./kafkaClient/IConsumerObserver";
import {KafkaClient} from "./kafkaClient/KafkaClient";
import {KafkaMessage} from "kafkajs";

export class KafkaTest implements IConsumerObserver {

    private consumerId: string;
    private producerId: string;
    private readonly kafkaClient: KafkaClient = KafkaClient.getClient();

    constructor() {
        this.consumerId = this.kafkaClient.createConsumer(this, 'test-group');
        this.kafkaClient.subscribe(this.consumerId, 'testTopic').then(() => console.log('Subscribed!')).catch(console.log);
        this.producerId = this.kafkaClient.createProducer('testProducer');
    }

    didReceiveNewMessage(message:IReceivedKafkaMessage): void {
        console.log('Kafka test: ');
        console.log(message.topic, message.message);
        console.log(message.message.value?.toString());
        if (message.message.value) {
            this.sendMessage(message.message.value.toString());
        }
    }

    sendMessage(message: string): void {
        console.log('Sending Messages...');
        this.kafkaClient.sendMessage(this.producerId, [{key: this.producerId, value: message + ' (Producer-Ack)', headers: {'nvoen': 'Hello'}}]).then(console.log);
    }
}