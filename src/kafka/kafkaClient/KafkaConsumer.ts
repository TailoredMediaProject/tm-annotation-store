import {Consumer, ConsumerConfig, Kafka} from "kafkajs";
import {IConsumerObserver} from "./IConsumerObserver";

export class KafkaConsumer {
    private readonly consumer: Consumer;
    private observations: IConsumerObserver[] = [];

    constructor(kafka: Kafka, config?: ConsumerConfig) {
        this.consumer = kafka.consumer(config)
    }

    addObserver(observer: IConsumerObserver): void {
        if (this.observations.some(value => value === observer)) {
            return;
        }
        this.observations.push(observer);
        if (this.observations.length === 1) {
            this.connect().then(() => this.listen().then());
        }
    }

    removeObserver(observer: IConsumerObserver): void {
        const observerKey = this.getObserverKey(observer);
        if (observerKey > -1) {
            delete this.observations[observerKey];
            if (this.observations.length === 0) {
                this.stopListen()
                    .then(() => this.disconnect().then());
            }
        }
    }

    private getObserverKey(object: IConsumerObserver): number {
        for (const [key, observer] of this.observations.entries()) {
            if (observer === object) {
                return key;
            }
        }
        return -1;
    }

    private async connect(): Promise<void> {
        return this.consumer.connect();
    }

    async subscribe(topic: string | RegExp, fromBeginning: boolean): Promise<void> {
        return this.consumer.subscribe({topic, fromBeginning});
    }

    async listen(): Promise<void> {
        return this.consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                try {
                    this.observations.forEach(observer => observer.didReceiveNewMessage({topic, partition, message}));
                } catch (e) {
                    console.log(e);
                }
            },
        });
    }

    async shutdown(): Promise<void> {
        return this.stopListen().then(() => this.disconnect().then(() => {
            for (let i = 0; i < this.observations.length; i++) {
                delete this.observations[i];
            }
        }));
    }

    async stopListen(): Promise<void>{
        return this.consumer.stop();
    }

    async disconnect(): Promise<void> {
        return this.consumer.disconnect();
    }
}