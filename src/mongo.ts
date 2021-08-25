import {Collection, MongoClient} from 'mongodb';

export class Mongo {
  private readonly client: MongoClient;
  private readonly database: string;

  constructor(connectString: string, database: string) {
    this.database = database;
    this.client = new MongoClient(connectString);
  }

  getCollection(collectionName: string): Promise<Collection> {
    return this.client.connect().then(
      (client) => {
        return client.db(this.database).collection(collectionName);
      },
    );
  }
}
