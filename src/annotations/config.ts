import {Collection} from 'mongodb';

export interface AnnotationStoreConfig {
    annotationsCollection: Collection;
    annotationBaseURI: string;
}
