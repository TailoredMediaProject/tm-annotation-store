import schema from './graphql/schema';
import express from 'express';
import {ApolloServer} from 'apollo-server-express';
import {Mongo} from './mongo';
import {DocumentStore} from './documents/store';
import {KafkaClient} from './kafka/kafkaClient/KafkaClient';
import {AnnotationStore} from './annotations/annotation.store';
import morgan from 'morgan';
import path = require('path');

const annotations = process.env.ANNOTATIONS_COLLECTION || 'annotations';
const documents = process.env.DOCUMENTS_COLLECTION || 'documents';
const port: number = +(process.env.SERVER_PORT || 4000);
const baseURI: string = (process.env.BASE_URI || `http://localhost:${port}`).replace(/\/*$/, '');
const staticDir = process.env.BE_STATIC || 'static';
const documentBasePath = `/resources/docs/`;
const annotationBasePath = `/resources/annotations/`;
const mongo = new Mongo();

const kafkaBroker = process.env.KAFKA_BROKER?.split(',') || ['localhost:9092'];
const kafkaConsumerGroupId = process.env.KAFKA_CONSUMER_GROUP_ID?.split(',') || ['testDocumentStoreGroup', 'testAnnotationStoreGroup'];
const kafkaConsumerTopics = process.env.KAFKA_CONSUMER_TOPICS?.split(',') || ['testDocumentTopic', 'testAnnotationTopic'];
const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'tm-annotation_store';

const kafka = KafkaClient.createClient(kafkaBroker, kafkaClientId);
const app = express();

const run = async (): Promise<any> => {
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan('dev'));

  app.get('/', (req, res) => res.send('Server is up and running!'));

  const annotationsCollection = await mongo.getCollection(annotations);
  const documentsCollection = await mongo.getCollection(documents);

  const annotationStore = new AnnotationStore({ annotationsCollection, annotationBasePath, baseURI });

  // @ts-ignore
  const apollo = new ApolloServer({
    schema,
    dataSources: () => ({
      annotations: annotationStore
    })
  });
  await apollo.start();
  apollo.applyMiddleware({ app });

  const documentStore = new DocumentStore({ documentsCollection, annotationsCollection, documentBasePath, baseURI });
  documentStore.applyMiddleware(app);

  annotationStore.applyMiddleware(app);

  // const documentMessageManager = new DocumentMessageManager({groupId: kafkaConsumerGroupId[0], topic: kafkaConsumerTopics[0], fromBeginning: false}, documentStore);
  // const annotationMessageManager = new AnnotationMessageManager({
  //   groupId: kafkaConsumerGroupId[1],
  //   topic: kafkaConsumerTopics[1],
  //   fromBeginning: false
  // }, annotationStore);
  const server = await new Promise(resolve => {
    const s = app.listen({ port }, () => {
      resolve(s);
    });
  }).catch((error) => {
    console.error(error);
    // documentMessageManager.shutdown();
    // annotationMessageManager.shutdown();
  });

  return { server, apollo };
};

run()
  .then(({ server, apollo }) => {
    console.log(`GraphQL UI ready at http://localhost:${server.address().port}${apollo.graphqlPath}`);

    app.use('/api/v1/spec.yaml', express.static(path.join(__dirname, `${staticDir}/spec.yaml`)));
    console.log(`Serving spec on http://localhost:${server.address().port}/api/v1/spec.yaml`);
  })
  .catch(error => {
    console.error(error);
    kafka.shutdown().then(() => console.error('Disconnected from Kafka!'));
});
