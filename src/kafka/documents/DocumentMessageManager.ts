import {MessageManager} from "../messageManager/MessageManager";
import {DocumentStore} from "../../documents/store";
import {IMessageManagerConfig} from "../messageManager/IMessageManagerConfig";
import {ObjectId} from "mongodb";

export class DocumentMessageManager extends MessageManager {
    private readonly documentStore: DocumentStore;

    constructor(messageManagerConfig: IMessageManagerConfig, documentStore: DocumentStore) {
        super(messageManagerConfig);
        this.documentStore = documentStore;
    }

    create(topic: string, content: any): Promise<any> {
        return new Promise(((resolve, reject) => {
            try {
                this.documentStore.createDocument(content, {}, (error, doc) => {
                    if (error) {
                        console.error('Error: Creating a document had an error: ', error);
                        reject(error);
                    }
                    console.log('Successfully added a text document!');
                    resolve(doc);
                });
            } catch (error) {
                console.log(error);
                reject(error);
            }
        }));
    }

    delete(topic: string, content: any): Promise<void> {
        return new Promise(((resolve, reject) => {
            try {
                const id = new ObjectId(content.id);
                this.documentStore.deleteDocument(id, (error) => {
                    if (error) {
                        console.error('Error deleting document: ', error);
                        reject(error);
                    } else {
                        console.log('Deleted document!');
                        resolve();
                    }
                })
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    update(topic: string, content: any): Promise<void> {
        return Promise.resolve(undefined);
    }

}