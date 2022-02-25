# Annotation Store

Stores annotations

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
npm run dev:start # To start the annotation store
```

Visit open graphql ui on: http://localhost:4000/

Or simply run `bash ./scripts/start_clean_app.sh` (and don't forget to shutdown docker-compose afterwards)

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
docker run -p 8080:8080 -d $(whoami)/tm-annotation-store # Run image
docker ps # View running containers
docker logs <container_id> # Print container logs
docker stop <container_id> # Stop container
docker stop $(docker ps --format '{{.ID}}') # For only one running container
docker system prune # Removes all unused images
docker exec -it $(docker ps --format '{{.ID}}') /bin/bash # Go into running image via bash, works also for mongoshell
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
