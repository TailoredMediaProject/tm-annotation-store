import {CompressionTypes, Kafka, Message, Producer, ProducerConfig, RecordMetadata} from "kafkajs";

export class KafkaProducer {
    private readonly producer: Producer;

    constructor(kafka: Kafka, config?: ProducerConfig) {
        this.producer = kafka.producer(config);
    }

    async connect(): Promise<void> {
        return this.producer.connect();
    }

    async sendMessages(topic: string, messages: Message[], compression?: CompressionTypes): Promise<RecordMetadata[]> {
        return this.producer.send({
            topic,
            messages,
            compression
        });
    }

    async disconnect(): Promise<void> {
        return this.producer.disconnect();
    }

}