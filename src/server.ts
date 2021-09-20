import schema from './graphql/schema';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {Mongo} from './mongo';
import {AnnotationStore} from './annotations/store';
import {DocumentStore} from './documents/store';
import {KafkaClient} from "./kafka/KafkaClient";
import {KafkaTest} from "./kafka/KafkaTest";

const username = process.env.MONGO_USERNAME || 'apollo';
const password = process.env.MONGO_PASSWORD || 'apollo';
const dbHost = process.env.MONGO_HOST || 'localhost';
const dbPort = +(process.env.MONGO_PORT || 27017);
const database = process.env.MONGO_DATABASE || 'annotations';
const annotations = process.env.ANNOTATIONS_COLLECTION || 'annotations';
const documents = process.env.DOCUMENTS_COLLECTION || 'documents';
const port: number = +(process.env.SERVER_PORT || 4000);
const baseURI = process.env.BASE_URI || `http://localhost:${port}`;
const documentBasePath = `/resources/docs/`;
const annotationBasePath = `/resources/annotations/`;

const kafkaBroker = process.env.KAFKA_BROKER?.split(',') || ['localhost:9092'];
const kafkaConsumerGroupId = process.env.KAFKA_CONSUMER_GROUP_ID?.split(',') || ['test-group'];
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'tm-annotation_store';

/*const connectString = `mongodb://${username}:${password}@${dbHost}:${dbPort}`;*/
const connectString = `mongodb://${dbHost}:${dbPort}`;
const mongoConnect: string = (process.env.MONGO_CONNECT || connectString)
const mongo = new Mongo(mongoConnect, database);
const kafka = KafkaClient.createClient(kafkaBroker, kafkaConsumerGroupId, kafkaClientId);
let consumerID: number;

const run = async (): Promise<any> => {
  const app = express();
  app.use(express.json());

  app.get('/', (req, res) => res.send('Server is up and running!'));

  const annotationsCollection = await mongo.getCollection(annotations);
  const documentsCollection = await mongo.getCollection(documents);

  const annotationStore = new AnnotationStore({annotationsCollection, annotationBasePath, baseURI});

  const apollo = new ApolloServer({
    schema,
    dataSources: () => ({
      annotations: annotationStore,
    }),
  });
  await apollo.start();
  apollo.applyMiddleware({app});

  const documentStore = new DocumentStore({documentsCollection, annotationsCollection, documentBasePath, baseURI});
  documentStore.applyMiddleware(app);

  annotationStore.applyMiddleware(app);

  const test = new KafkaTest();
  const server = await new Promise(resolve => {
    const s = app.listen({port}, () => {
      resolve(s);
    });
  });

  return {server, apollo};
};

run().then(({server, apollo}) => {
  console.log(`Server ready at http://localhost:${server.address().port}${apollo.graphqlPath}`);
});
