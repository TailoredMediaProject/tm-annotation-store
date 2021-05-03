import {Collection, MongoClient} from 'mongodb';

export class Mongo {
    private client: MongoClient;

    constructor(username: string, password: string, database: string) {
        this.client = new MongoClient(`mongodb://${username}:${password}@127.0.0.1:27017/${database}`);
    }

    getCollection(collectionName: string): Promise<Collection> {
        return this.client.connect().then(
            (client) => {
                return client.db().collection(collectionName);
            }
        );
    }
}
