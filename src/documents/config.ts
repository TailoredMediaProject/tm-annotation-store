import {Collection} from 'mongodb';

export interface DocumentStoreConfig {
    documentsCollection: Collection;
    annotationsCollection: Collection;
    documentBaseURI: string;
}
