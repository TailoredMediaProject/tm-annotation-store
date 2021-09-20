import {CompressionTypes, Kafka, Message, Producer, ProducerConfig, RecordMetadata} from "kafkajs";

export class KafkaProducer {
    private readonly producer: Producer;
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
        return this.producer.send({
            topic: this.topic,
            messages,
            compression
        });
    }

    async disconnect(): Promise<void> {
        return this.producer.disconnect();
    }

}