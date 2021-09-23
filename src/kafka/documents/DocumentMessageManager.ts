import {MessageManager} from "../messageManager/MessageManager";
import {DocumentStore} from "../../documents/store";
import {IMessageManagerConfig} from "../messageManager/IMessageManagerConfig";
import {ObjectId} from "mongodb";
import bufferToJson from "../JSONConverter";

export class DocumentMessageManager extends MessageManager {
    private documentStore: DocumentStore;

    constructor(messageManagerConfig: IMessageManagerConfig | IMessageManagerConfig[], documentStore: DocumentStore) {
        super(messageManagerConfig);
        this.documentStore = documentStore;
    }

    create(topic: string, content: any): Promise<any> {
        return new Promise(((resolve, reject) => {
            try {
                const docContent = bufferToJson(content);
                if (!docContent) {
                    return reject('Document (Create): Content not valid!');
                }
                this.documentStore.createDocument(docContent, {}, (error, doc) => {
                    if (error) {
                        console.error('Error: Creating a document had an error: ', error);
                        return reject(error);
                    }
                    console.log('Successfully added a text document!');
                    console.log(doc);
                    resolve(doc.insertedId);
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
                const id = JSON.parse(content.toString()).id;
                this.documentStore.deleteDocument(id, (error) => {
                    if (error) {
                        console.error('Error deleting document: ', error);
                        return reject(error);
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