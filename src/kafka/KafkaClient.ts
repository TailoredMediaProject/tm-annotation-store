import {Kafka, logLevel, Message, RecordMetadata} from "kafkajs";
import {KafkaConsumer} from "./KafkaConsumer";
import {KafkaProducer} from "./KafkaProducer";
import {ConsumerObserver} from "./ConsumerObserver";

export class KafkaClient {
    private static client: KafkaClient;
    private readonly kafka: Kafka;
    private readonly producer: KafkaProducer[] = [];
    private readonly consumer: { [key: number]: KafkaConsumer } = {};
    private subscribedTopics: (string | RegExp)[] = [];
    private consumerCount = 0;

    private constructor(brokers: string[], consumerGroupId: string[], clientId?: string) {
        this.kafka = new Kafka({clientId, brokers, logLevel: logLevel.NOTHING});
    }

    public static createClient(brokers: string[], consumerGroupId: string[], clientId?: string): KafkaClient {
        if (!this.client) {
            this.client = new KafkaClient(brokers, consumerGroupId, clientId);
        }
        return this.client;
    }

    public static getClient(): KafkaClient {
        if (!this.client) {
            throw new Error('No client initiated!');
        }
        return this.client;
    }

    private createProducer(): void {
        this.producer.push(new KafkaProducer(this.kafka));
    }

    createConsumer(observer: ConsumerObserver, groupId: string): number {
        const newConsumer = new KafkaConsumer(this.kafka, {groupId});
        newConsumer.addObserver(observer);
        const key = this.consumerCount++;
        this.consumer[key] = newConsumer;
        return key;
    }

    /*private async connect(): Promise<void> {
        console.log('Connecting...');
        return await Promise.all([this.producer.connect(), this.consumer.connect()]).then(() => console.log('Connected!'));
    }*/

    async subscribe(consumerId: number, topic: string | RegExp): Promise<void> {
        const consumer = this.getConsumer(consumerId);
        if (consumer) {
            consumer.subscribe(topic).then(() => {
                if (this.subscribedTopics.some(value => value === topic)) {
                    this.subscribedTopics.push(topic);
                }
            });
        }
    }

 /*   async sendMessage(topic: string, messages: Message[]): Promise<RecordMetadata[]> {
        return this.producer.sendMessages(topic, messages);
    }*/

    async shutdownConsumer(): Promise<void> {
        for (const key in this.consumer) {
            await this.consumer[key];
        }
    }

    private getConsumer(id: number): KafkaConsumer {
        if (id >= 0 && id < this.consumerCount && id in this.consumer) {
            return this.consumer[id];
        }
        throw new Error('Kafka consumer not found!');
    }


    /*async disconnect(): Promise<void> {
        console.log('Disconnecting...');
        await this.consumer.forEach(consumer).stopListen();
        return await Promise.all([this.producer.disconnect(), this.consumer.disconnect()]).then(() => console.log('Disconnected!'));
    }*/
}
