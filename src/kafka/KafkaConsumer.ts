import {Consumer, ConsumerConfig, Kafka} from "kafkajs";
import {ConsumerObserver} from "./ConsumerObserver";

export class KafkaConsumer {
    private readonly consumer: Consumer;
    private observations: ConsumerObserver[] = [];

    constructor(kafka: Kafka, config?: ConsumerConfig) {
        this.consumer = kafka.consumer(config)
    }

    addObserver(observer: ConsumerObserver): void {
        if (this.observations.some(value => value === observer)) {
            return;
        }
        this.observations.push(observer);
        if (this.observations.length === 1) {
            this.connect().then(() => this.listen().then());
        }
    }

    removeObserver(observer: ConsumerObserver): void {
        const observerKey = this.getObserverKey(observer);
        if (observerKey > -1) {
            delete this.observations[observerKey];
            if (this.observations.length === 0) {
                this.stopListen()
                    .then(() => this.disconnect().then());
            }
        }
    }

    private getObserverKey(object: ConsumerObserver): number {
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

    async subscribe(topic: string | RegExp): Promise<void> {
        return this.consumer.subscribe({topic, fromBeginning: true});
    }

   /* async pause(topic: string): Promise<void> {
        return this.consumer.pause([{topic}]);
    }

    resume(topic: string): void {
        if (this.paused(topic)) {
            this.consumer.resume([{topic}]);
        }
    }*/

   /* private paused(topic: string): boolean {
        return this.consumer.paused().some(value => value.topic === topic)
    }*/

    async listen(): Promise<void> {
        return this.consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                try {
                    this.observations.forEach(observer => observer.didReceiveNewMessage(topic, message));
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