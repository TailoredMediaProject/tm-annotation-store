import {Auth, Collection, MongoClient, MongoClientOptions} from 'mongodb';

export class Mongo {
  private readonly client: MongoClient;
  private readonly database: string;

  constructor(connectString: string, database: string, username: string, password: string) {
    this.database = database;

    const mongoClientOptions: MongoClientOptions = {} as MongoClientOptions;

    mongoClientOptions.auth = {
      username,
      password
    } as Auth;

    this.client = new MongoClient(connectString, mongoClientOptions);
  }

  getCollection(collectionName: string): Promise<Collection> {
    return this.client.connect().then(
      (client) => {
        return client.db(this.database).collection(collectionName);
      },
    );
  }
}
