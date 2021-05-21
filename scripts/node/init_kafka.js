#!/usr/bin/env node
const axios = require('axios');
const fs = require('fs');

const SCHEMA_PATH = '../../../tm-annotation-store-api/api/avro/annotation/'
const TOPIC_NAME = 'my-super-topic';

function getClusterId() {
    return axios.get(`http://localhost:8082/v3/clusters`).then((response) => {
        return response.data.data[0].cluster_id;
    });
}

function createTopic(cluster) {
    const config = {
        "topic_name": TOPIC_NAME,
        "partitions_count": 5,
        "replication_factor": 1,
        "configs": [
            {
                "name": "cleanup.policy",
                "value": "compact"
            },
            {
                "name": "compression.type",
                "value": "gzip"
            }
        ]
    }
    return axios.post(`http://localhost:8082/v3/clusters/${cluster}/topics`,config);
}

function readSchema() {
    return new Promise(((resolve, reject) => {
        fs.readFile(`${SCHEMA_PATH}schema.avsc`, function (err, data) {
            if (err) {
                reject(err);
            }
            resolve(data.toString());
        });
    }));
}

function postSchema(schema) {
    return axios.post(`http://localhost:8081/subjects/${TOPIC_NAME}-value/versions`,{schema});
}
getClusterId()
    .then(createTopic)
    .then(readSchema)
    .then(postSchema)
    .then(() =>
        console.log('success')
    );
