import schema from './graphql/schema';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {Mongo} from './mongo';
import {DocumentStore} from './documents/store';
import {KafkaClient} from "./kafka/kafkaClient/KafkaClient";
import {AnnotationStore} from "./annotations/annotation.store";

const username = process.env.MONGO_USERNAME || 'apollo';
const password = process.env.MONGO_PASSWORD || 'apollo';
const dbHost = process.env.MONGO_HOST || 'localhost';
const dbPort = +(process.env.MONGO_PORT || 27017);
const database = process.env.MONGO_DATABASE || 'annotations';
const annotations = process.env.ANNOTATIONS_COLLECTION || 'annotations';
const documents = process.env.DOCUMENTS_COLLECTION || 'documents';
const port: number = +(process.env.SERVER_PORT || 4000);
const baseURI: string = (process.env.BASE_URI || `http://localhost:${port}`).replace(/\/*$/, "");
const documentBasePath = `/resources/docs/`;
const annotationBasePath = `/resources/annotations/`;

const mongoConnect: string = (process.env.MONGO_CONNECT || `mongodb://${dbHost}:${dbPort}`)
const mongo = new Mongo(mongoConnect, database);

const kafkaBroker = process.env.KAFKA_BROKER?.split(',') || ['localhost:9092'];
const kafkaConsumerGroupId = process.env.KAFKA_CONSUMER_GROUP_ID?.split(',') || ['testDocumentStoreGroup', 'testAnnotationStoreGroup'];
const kafkaConsumerTopics = process.env.KAFKA_CONSUMER_TOPICS?.split(',') || ['testDocumentTopic', 'testAnnotationTopic'];
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'tm-annotation_store';

const kafka = KafkaClient.createClient(kafkaBroker, kafkaClientId);

const run = async (): Promise<any> => {
  const app = express();
  app.use(express.json({limit: '10mb'}));

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

  // const documentMessageManager = new DocumentMessageManager({groupId: kafkaConsumerGroupId[0], topic: kafkaConsumerTopics[0], fromBeginning: false}, documentStore);
  // const annotationMessageManager = new AnnotationMessageManager({
  //   groupId: kafkaConsumerGroupId[1],
  //   topic: kafkaConsumerTopics[1],
  //   fromBeginning: false
  // }, annotationStore);
  const server = await new Promise(resolve => {
    const s = app.listen({port}, () => {
      resolve(s);
    });
  }).catch((error) => {
    console.error(error);
    // documentMessageManager.shutdown();
    // annotationMessageManager.shutdown();
  });

  return {server, apollo};
};

run().then(({server, apollo}) => {
  console.log(`Server ready at http://localhost:${server.address().port}${apollo.graphqlPath}`);
}).catch(error => {
  console.log(error);

  kafka.shutdown().then(() => console.log('Disconnected from Kafka!'));
});
