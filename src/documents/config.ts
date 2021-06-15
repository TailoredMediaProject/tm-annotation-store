import {Collection} from 'mongodb';

export interface DocumentStoreConfig {
    baseURI: string,
    documentsCollection: Collection;
    annotationsCollection: Collection;
    documentBasePath: string;
}
