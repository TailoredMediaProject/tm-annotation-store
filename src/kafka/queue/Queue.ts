import {IQueueProtocol} from "./IQueueProtocol";

export class Queue<T> {
    private queue: T[] = [];
    private observer?: IQueueProtocol<T>;
    private isRunning = false;

    constructor(observer?: IQueueProtocol<T>) {
        this.observer = observer;
    }

    hasNext(): boolean {
        return this.queue.length > 0;
    }

    push(element: T | T[]): void {
        if (Array.isArray(element)) {
            this.queue = this.queue.concat(element);
        }
        else {
            this.queue.push(element);
        }
        this.pushToObserver();
    }

    next(): T | undefined {
        return this.queue.shift();
    }

    private pushToObserver(): void {
        if (this.observer && this.hasNext() && !this.isRunning) {
            this.isRunning = true;
            this.observer.queuePushesNext(this.queue[0])
                .then(() => {
                    console.log('Queue: Element processed!')
                })
                .catch(error => {
                    console.error('Queue: Element Not processed! Element: ', this.queue[0]);
                    console.error('Queue error', error);
                })
                .finally(() => {
                    console.log('Queue: Release...');
                    this.queue.shift();
                    this.isRunning = false;
                    this.pushToObserver();
                });
        }
    }

    shutdown(): void {
        this.queue = [];
        this.observer = undefined;
    }

}