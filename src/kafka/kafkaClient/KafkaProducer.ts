import {CompressionTypes, Kafka, Message, Producer, ProducerConfig, RecordMetadata} from "kafkajs";

export class KafkaProducer {
    private readonly producer: Producer;
    private isConnected = false;
    private readonly topic: string;

    constructor(kafka: Kafka, topic: string, config?: ProducerConfig) {
        this.producer = kafka.producer(config);
        this.topic = topic;
        this.connect().then(() => 'Producer Connected!').catch(console.log);
    }

    private async connect(): Promise<void> {
        return this.producer.connect();
    }

    async sendMessages(messages: Message[], compression?: CompressionTypes): Promise<RecordMetadata[]> {
        return new Promise<RecordMetadata[]>((async (resolve, reject) => {
            try {
                if (!this.isConnected) {
                    await this.producer.connect().then(() => this.isConnected = true);
                }
                return this.producer.send({
                    topic: this.topic,
                    messages,
                    compression
                })
                    .then(resolve)
                    .catch(reject);
            } catch (error) {
                reject(error);
            }
        }));
    }

    async disconnect(): Promise<void> {
        return this.producer.disconnect().then(() => {
            this.isConnected = false;
        });
    }

}