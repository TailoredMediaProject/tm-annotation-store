# Annotation Store

Stores annotations

## Behavior

- `Annotation.Body.Quantification` all values below zero, no value at all or strings are mapped to -1. Zero or positive numbers remain as they are

## Local Development

### Setup
```shell
cp .env.dev .env # Copy environment variables. Optional: Change them 
docker-compose config # Optional: Check config
# Mandatory on mac: start docker 
npm i # Install dependencies
npm run generate:build

```
### Start
```shell
docker-compose up # Start whole application, or
docker-compose up mongodb # Start only mongodb service
npm run build:start # To start normally
npm run dev:start # To start the annotation store for development, you may want to create an npm run config with "--inspect --require ts-node/register" as node arguments
```

Visit open graphql ui on: http://localhost:4000/

### Stop
```shell
docker-compose down # Optional with "-v", can be important on first run!
# In the CLI where you ran "npm run build:start " hit "ctrl + c" to stop nodemon
```

### Enter database

Install the mongo client. You may enter the database:
```shell
mongo -u <.env#MONGO_USERNAME> <.env#MONGO_DATABASE>
# When asked for the password, enter .env#MONGO_PASSWORD
```

### Docker Cheat Sheet
Build, view, run locally

```shell
docker build . -t $(whoami)/tm-annotation-store # Build
docker images # View build, available images
docker image rm <image_id> # Remove image
docker run -p 8080:8080 $(whoami)/tm-annotation-store # Run image
docker ps # View running containers
docker logs <container_id> # Print container logs
docker stop <container_id> # Stop container
docker stop $(docker ps --format '{{.ID}}') # For only one running container
docker system prune # Removes all unused images
docker exec -it $(docker ps --format '{{.ID}}') /bin/sh # Go into running image via bash, works also for mongoshell
```

## Audio Annotation Example

For Margit Fischer, her KS Entry is:

```json
{
  "id": "62a3422762302f17a0896ffe",
  "vocabulary": "627cdfe78b62be12608e490e",
  "type": "PERSON",
  "label": "Margit Fischer",
  "description": null,
  "created": "2022-06-10T13:07:51.818Z",
  "lastModified": "2022-06-10T13:07:51.818Z",
  "externalResources": [
    "AA-ID: 38ee5aa6-4690-4f4e-a961-a1c74f234975"
  ],
  "sameAs": null,
  "data": null,
  "canonicalLink": "https://data.tmedia.redlink.io/kb/62a3422762302f17a0896ffe"
}
```

her Automatic Analysis Annotation in AS is:

```json
{
  "id": "https://a-store.tmedia.redlink.io/resources/annotations/62c6de50a85507e8add0d48f",
  "origin": {
    "creator": "JRSExtractionTM0.1",
    "type": "automatic"
  },
  "created": "2022-07-07T13:23:28.328Z",
  "body": [
    {
      "confidence": 0.22595945000648499,
      "domains": [
        "video"
      ],
      "id": "https://a-store.tmedia.redlink.io/resources/annotations/62c6de50a85507e8add0d490",
      "relation": "face",
      "type": "ResourceBody",
      "value": "https://data.tmedia.redlink.io/kb/62a3422762302f17a0896ffe"
    }
  ],
  "target": [
    {
      "selector": {
        "spacial": {
          "h": 0.4965277910232544,
          "type": "PercentSpatialSelector",
          "w": 0.208984375,
          "x": 0.478515625,
          "y": 0.1267361044883728
        },
        "temporal": {
          "end": 6.08,
          "start": 3.92,
          "type": "TemporalFragmentSelector"
        },
        "type": "MediaFragmentSelector"
      },
      "source": "https://video.tmedia.redlink.io/v/orf/578877.mp4",
      "type": "FragmentResource"
    }
  ]
}
```
and the audio annotation for her is:

```json
{
  "id": "https://a-store.tmedia.redlink.io/resources/annotations/62d161b3a85507e8add0fff5",
  "origin": {
    "creator": "Redlink, Manual Entry",
    "type": "manual"
  },
  "created": "2022-07-15T12:55:28.328Z",
  "body": [
    {
      "confidence": 1.0,
      "domains": [
        "audio"
      ],
      "id": "https://a-store.tmedia.redlink.io/resources/annotations/62c6de50a85507e8add0d490",
      "relation": "face",
      "type": "ResourceBody",
      "value": "https://data.tmedia.redlink.io/kb/62a3422762302f17a0896ffe"
    }
  ],
  "target": [
    {
      "selector": {
        "end": 7,
        "start": 10,
        "type": "TemporalFragmentSelector"
      },
      "source": "https://video.tmedia.redlink.io/v/orf/170343.mp4",
      "type": "FragmentResource"
    }
  ]
}
```

to inject her manually into the AS by the *create annotation* endpoint:

```
https://a-store.tmedia.redlink.io/resources/annotations/
```

## Graphql Annotations
Schema is defined in [.api/schema.graphql]

### add annotation
```
mutation {
  addAnnotation(
    bodyResource: {
      id: "http://example.org/concept/f1", 
      type: "http://www.w3.org/2004/02/skos/core#Concept"
      label: "Formula 1"
    },
    targetResource: {
      id: "http://example.org/image/mick-in-spa.txt"
      type: "http://purl.org/dc/dcmitype/Text"
    }
  ){id}
}
```
### add freetext annotation to text-part target
```
mutation {
  addAnnotation(
    bodyText: {value: "Mick Schumacher"}
    targetTextSelector: {
      source: "http://example.org/image/mick-in-spa.txt"
      textPositionSelector: {
             start: 100
      end: 150 
      }
    }
  ){id}
}
```
### list annotations filter by targetId
```
query {
  annotations(filter: {targetId: "http://example.org/image/mick-in-spa.txt"}) {
    id
    body {
        ... on BodyResource {id, type,label}
        ... on BodyText {type,value}
    }
    target{
      ... on TargetResource {id}
      ... on SpecificResource {
        source
        selector {
          ... on FragmentSelector {
            type
            value
          }
          ... on TextPositionSelector {
            start end type
          }
        }
      }
    }
  }
}
```
### get single annotation
```
query {
  annotation(id: "http://redlink.at/examples/annotations/60802b7b7ab556187c1a5c23") {
    id
    body {
        ... on BodyResource {id, type,label}
        ... on BodyText {type,value}
    }
    target{
      ... on TargetResource {id}
      ... on SpecificResource {
        source
        selector {
          ... on FragmentSelector {
            type
            value
          }
          ... on TextPositionSelector {
            start end type
          }
        }
      }
    }
  }
}
```
### delete single annotation
```
mutation {
  deleteAnnotation(id: "http://redlink.at/examples/annotations/60806816cc034d09915ce870")
}
```
### delete applications filter by targetId
```
mutation {
  deleteAnnotations(filter:{targetId:"http://example.org/image/mick-in-spa.txt"})
}
```

## Document Store
API is defined in [.api/doc-store-spec.yaml]

* List Text Document: `curl GET http://localhost:4000/resources/docs/texts/`
* Get Text Document: `curl GET http://localhost:4000/resources/docs/texts/123abc`
* Create Text Documents: ```curl POST \
  --url http://localhost:4000/resources/docs/texts/ \
  --header 'Content-Type: application/json' \
  --data '{
  "title": "Some Title",
  "content": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed.."
  }'```
* Delete Text Document: `curl DELETE http://localhost:4000/resources/docs/texts/123abc`

### Example MongoDB Entry

```
documents
> db.documents.findOne()
{
        "_id" : ObjectId("616808eada117f00072413ba"),
        "title" : "Corona",
        "content" : "Die Auffrischungsimpfungen sind bereits voll im Gange, heute hat die Stadt Wien den weiteren Fahrplan vorgestellt und überdies eine umfassende Bilanz gezogen: 139.229 Wienerinnen und Wiener wurden seit Juli zum dritten Mal geimpft, davon über 70.000 bei mobilen Sonderimpfaktionen."
}
> db.annotations.findOne()
{
        "_id" : ObjectId("61680b7d3681090009873f57"),
        "value" : {
                "type" : "Annotation",
                "body" : {
                        "id" : "News",
                        "type" : "type",
                        "label" : "News"
                },
                "target" : {
                        "id" : "616808eada117f00072413ba",
                        "type" : "http://purl.org/dc/dcmitype/Text"
                }
        },
        "_metadata" : {
                "created" : 1634208637756,
                "hashSum" : "70fd3eba"
        }
}
```
