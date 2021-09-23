import {Kafka, logLevel, Message, RecordMetadata} from "kafkajs";
import {KafkaConsumer} from "./KafkaConsumer";
import {KafkaProducer} from "./KafkaProducer";
import {IConsumerObserver} from "./IConsumerObserver";

export class KafkaClient {
    private static client: KafkaClient;
    private readonly kafka: Kafka;
    private producer: {[key: string]: KafkaProducer} = {};
    private consumer: { [key: string]: KafkaConsumer } = {};
    private subscribedTopics: (string | RegExp)[] = [];

    private constructor(brokers: string[], clientId?: string, consumerGroupId?: string[]) {
        this.kafka = new Kafka({clientId, brokers, logLevel: logLevel.INFO});
    }

    public static createClient(brokers: string[], clientId?: string, consumerGroupId?: string[]): KafkaClient {
        if (!this.client) {
            this.client = new KafkaClient(brokers, clientId, consumerGroupId);
        }
        return this.client;
    }

    public static getClient(): KafkaClient {
        if (!this.client) {
            throw new Error('No client initiated!');
        }
        return this.client;
    }

    createProducer(topic: string): string {
        if (this.subscribedTopics.some(value => value === topic)) {
            throw new Error('The topic "' + topic + '" is already a consumer topic!');
        }
        if (!(topic in this.producer)) {
            this.producer[topic] = new KafkaProducer(this.kafka, topic);
        }
        return topic;
    }

    createConsumer(observer: IConsumerObserver, groupId: string): string {
        if (!(groupId in this.consumer)) {
            this.consumer[groupId] = new KafkaConsumer(this.kafka, {groupId});
        }
        this.consumer[groupId].addObserver(observer);
        return groupId;
    }

    async subscribe(consumerId: string, topic: string | RegExp, fromBeginning: boolean = false): Promise<void> {
        if (topic.toString() in this.producer) {
            throw new Error('Topic "' + topic + '" is already a producer topic!');
        }
        const consumer = this.getConsumer(consumerId);
        if (consumer) {
            return consumer.subscribe(topic, fromBeginning).then(() => {
                if (this.subscribedTopics.some(value => value === topic)) {
                    this.subscribedTopics.push(topic);
                }
            }).catch(error => {
                console.log(error);
            });
        }
    }

    async sendMessage(topic: string, messages: Message[]): Promise<RecordMetadata[]> {
        if (!(topic in this.producer)) {
            throw new Error('No producer with topic "' + topic + '" found!');
        }
        return this.producer[topic].sendMessages(messages);
    }

    private getConsumer(id: string): KafkaConsumer {
        if (id in this.consumer) {
            return this.consumer[id];
        }
        throw new Error('Kafka consumer not found!');
    }

    async shutdownConsumers(): Promise<void> {
        const consumers: KafkaConsumer[] = Object.values(this.consumer);
        if (consumers.length > 0) {
            return Promise.all(consumers.map(consumer => consumer.shutdown())).then(() => {
                this.consumer = {};
            });
        }
    }

    async shutdownProducerWithTopics(topics: string[]): Promise<void> {
        for (const topic of topics) {
            if (topic in this.producer) {
                return this.producer[topic].disconnect().then(() => {
                    delete this.producer[topic];
                });
            }
        }
    }

    async shutdownConsumersWithGroupId(groupId: string[]): Promise<void> {
        for (const groupIdKey in groupId) {
            if (groupIdKey in this.consumer) {
                this.consumer[groupIdKey].shutdown().then(() => {
                    delete this.consumer[groupIdKey];
                });
            }
        }
    }

    async shutdownProducers(): Promise<void> {
        const producers: KafkaProducer[] = Object.values(this.producer);
        if (producers.length > 0) {
            return Promise.all(producers.map(producers => producers.disconnect())).then(() => {
                this.producer = {};
            });
        }
    }

    async shutdown(): Promise<void> {
        return Promise.all([this.shutdownConsumers(), this.shutdownProducers()]).then();
    }
}
