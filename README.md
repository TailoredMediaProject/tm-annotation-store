# Annotation Store

## Development

### Start annotations store locally
* clean mongo data (optional): `rm -rf .docker/mongodb/data`
* check config (optional): `docker-compose --env-file .env.dev config`
* start docker (mandatory on mac)
* run mongo: `docker-compose --env-file .env.dev up`
* install deps: `npm i`
* start apollo: `npm run build:start`
* open graphql ui: http://localhost:4000/

Or simply run `bash ./scripts/start_clean_app.sh` (and don't forget to shutdown docker-compose afterwards)

### Enter database

Install mongo client. Then you can enter the database (if you use the default environment) via: 
`mongo -u apollo annotations`, password `apollo`

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

* List Text Document: `curl GET http://localhost:4000/api/docs/texts/`
* Get Text Document: `curl GET http://localhost:4000/api/docs/texts/123abc`
* Create Text Documents: ```curl POST \
  --url http://localhost:4000/api/docs/texts/ \
  --header 'Content-Type: application/json' \
  --data '{
  "title": "Some Title",
  "content": "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed.."
  }'```
* Delete Text Document: `curl DELETE http://localhost:4000/api/docs/texts/123abc`
