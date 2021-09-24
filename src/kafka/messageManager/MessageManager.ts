import {IConsumerObserver, IReceivedKafkaMessage} from "../kafkaClient/IConsumerObserver";
import {KafkaClient} from "../kafkaClient/KafkaClient";
import {IMessageManagerConfig} from "./IMessageManagerConfig";
import {Queue} from "../queue/Queue";
import {IQueueProtocol} from "../queue/IQueueProtocol";
import {MessageHeader, MessageMethod} from "./MessageHeader";

export abstract class MessageManager implements IConsumerObserver, IQueueProtocol<IReceivedKafkaMessage> {
    private readonly kafkaClient: KafkaClient;
    private readonly messageQueue: Queue<IReceivedKafkaMessage>;
    private groupIds: string[] = [];

    protected constructor(config: IMessageManagerConfig | IMessageManagerConfig[]) {
        this.messageQueue = new Queue<IReceivedKafkaMessage>(this);
        this.kafkaClient = KafkaClient.getClient();
        if (!Array.isArray(config)) {
            config = [config];
        }
        this.groupIds = config.map(consumer => consumer.groupId);
        this.setup(config);
    }

    private setup(config: IMessageManagerConfig[]): void {
        for (const consumer of config) {
            this.kafkaClient
                .subscribe(
                    this.kafkaClient.createConsumer(this, consumer.groupId),
                    consumer.topic)
                .then();
        }
    }

    didReceiveNewMessage(message: IReceivedKafkaMessage): void {
        this.messageQueue.push(message);
    }

    queuePushesNext(element: IReceivedKafkaMessage): Promise<any> {
        const method = MessageManager.getMethod(element);
        switch (method) {
            case MessageMethod.CREATE:
                return this.create(element.topic, element.message.value);
            case MessageMethod.UPDATE:
                return this.update(element.topic, element.message.value);
            case MessageMethod.DELETE:
                return this.delete(element.topic, element.message.value);
            default:
                console.error('ERROR: No method added!');
                return Promise.reject('No Method added!');
        }
    }

    private static getMethod(receivedMessage: IReceivedKafkaMessage): MessageMethod {
        const headers = receivedMessage.message.headers;
        if (headers && MessageHeader.METHOD in headers && headers[MessageHeader.METHOD]) {
            const method = headers[MessageHeader.METHOD];
            if (method && method.toString() in MessageMethod) {
                return MessageMethod[method.toString() as keyof typeof MessageMethod];
            }
        }
        return MessageMethod.NON;
    }

    abstract create(topic: string, content: any): Promise<any>;
    abstract update(topic: string, content: any): Promise<any>;
    abstract delete(topic: string, content: any): Promise<any>;

    async shutdown(): Promise<void> {
        this.messageQueue.shutdown();
        this.kafkaClient.shutdownConsumersWithGroupId(this.groupIds).then();
    }
}