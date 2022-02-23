export interface IQueueProtocol<T> {
    queuePushesNext(element: T): Promise<void>;
}