import {Collection, MongoClient} from 'mongodb';

export class Mongo {
    private client: MongoClient;

    constructor(connectString: string) {
        this.client = new MongoClient(connectString);
    }

    getCollection(collectionName: string): Promise<Collection> {
        return this.client.connect().then(
            (client) => {
                return client.db().collection(collectionName);
            }
        );
    }
}
