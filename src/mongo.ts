import {Collection, MongoClient, MongoClientOptions} from 'mongodb';

export class Mongo {
  private readonly client: MongoClient;

  constructor() {
    const dbHost = process.env.MONGO_HOST || 'localhost';
    const dbPort = +(process.env.MONGO_PORT || 27017);
    const database = process.env.MONGO_DATABASE || 'annotations';
    const username = process.env.MONGO_USERNAME || 'apollo';
    const password = process.env.MONGO_PASSWORD || 'apollo';
    const url: string = (process.env.MONGO_CONNECT || `mongodb://${username}:${password}@${dbHost}:${dbPort}/${database}`);

    const mongoClientOptions: MongoClientOptions = {
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000
    } as MongoClientOptions;
    try {
      this.client = new MongoClient(url, mongoClientOptions);
      console.log("Connected to Mongo on URL " + dbHost + ':' + dbPort + '/' + database + ' with user ' + username);
    } catch (error) {
      console.error(error);
      console.error("Could not connect to Mongo on " + url);
    }
  }

  getCollection(collectionName: string): Promise<Collection> {
    return this.client.connect()
      .then((client: MongoClient) => client.db().collection(collectionName)
    );
  }
}
