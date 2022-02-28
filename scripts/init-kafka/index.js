#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');

const SCHEMA_PATH = './node_modules/@redlink/tm-annotation-store-api/api/avro/annotation/';
const TOPIC_NAME = 'annotations';
const SCHEMA_REGISTRY_HOST = process.env.SCHEMA_REGISTRY_HOST || 'localhost';
const REST_PROXY_HOST = process.env.REST_PROXY_HOST || 'localhost';

const postSchema = (schema) =>
  axios.post(`http://${SCHEMA_REGISTRY_HOST}:8081/subjects/${TOPIC_NAME}-value/versions`, { schema })
    .then(() => console.log('Initialized kafka successfully'))
    .catch(err => console.error('Error on posting schema in kafka. ', err));

const readSchema = () => new Promise(((resolve, reject) => {
  fs.readFile(`${SCHEMA_PATH}schema.avsc`, (err, data) => {
    if (err) {
      reject(err);
    }
    resolve(data.toString());
  });
}));

const createTopic = (cluster) => {
  const config = {
    'topic_name': TOPIC_NAME, 'partitions_count': 5, 'replication_factor': 1, 'configs': [{
      'name': 'cleanup.policy', 'value': 'compact'
    }, {
      'name': 'compression.type', 'value': 'gzip'
    }]
  };
  return axios.post(`http://${REST_PROXY_HOST}:8082/v3/clusters/${cluster}/topics`, config)
    .then(() => readSchema()
      .then(schema => postSchema(schema))
      .catch(err => console.error('Error on reading schema.avsc.', err))
    )
    .catch(err => {
      if(err.response.status === 400 && err.response.data.error_code === 40002) {
        console.log('Kafka was already initialized successfully, kafka init is now closed.')
      } else
        console.error('Error on kafka topic creation.', err)
    });
};

const getClusterId = () => axios.get(`http://${REST_PROXY_HOST}:8082/v3/clusters`)
  .then((response) => {
    const cluster = response.data.data[0].cluster_id;
    void createTopic(cluster);
  })
  .catch(err => console.error('Error on reading clusters. ', err));

void getClusterId();
