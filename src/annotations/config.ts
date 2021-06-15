import {Collection} from 'mongodb';

export interface AnnotationStoreConfig {
    baseURI: string,
    annotationsCollection: Collection;
    annotationBasePath: string;
}
