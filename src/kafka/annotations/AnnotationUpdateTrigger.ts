import {KafkaClient} from "../kafkaClient/KafkaClient";

export class AnnotationUpdateTrigger {
    private readonly kafkaClient: KafkaClient;
    private topics: string[] = [];

    constructor(topics: string[]) {
        this.kafkaClient = KafkaClient.getClient();
        this.setup(topics);
    }

    private setup(topics: string[]) {
        for (const topic of topics) {
            try {
                if (topic && topic !== '') {
                    this.topics.push(this.kafkaClient.createProducer(topic));
                }
            } catch (error){
                console.log(error);
            }
        }
    }

    async sendUpdate(topic: string, id: string, headers: { [key: string]: Buffer | string | undefined }): Promise<any> {
        return new Promise(((resolve, reject) => {
            try {
                if (this.topics.includes(topic)) {
                    const value = JSON.stringify({id})
                    if (Object.keys(headers).length === 0) {
                        return reject('No headers added!');
                    }
                    const resp = this.kafkaClient.sendMessage(topic, [{value, headers}]);
                    console.log(resp);
                    return resolve(resp);
                }
                return reject('No producer with topic: ' + topic);
            } catch (error){
                console.log(error);
                reject(error);
            }
        }));
    }

    async shutdown() {
        return this.kafkaClient.shutdownProducerWithTopics(this.topics);
    }

}