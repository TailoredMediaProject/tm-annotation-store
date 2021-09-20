export interface KafkaObserver {
    observerConfig: KafkaObserverConfig;
}

export interface KafkaObserverConfig {
    producer: number[];
    consumer: number[];
}