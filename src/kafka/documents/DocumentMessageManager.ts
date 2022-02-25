import {MessageManager} from '../messageManager/MessageManager';
import {DocumentStore} from '../../documents/store';
import {IMessageManagerConfig} from '../messageManager/IMessageManagerConfig';
import bufferToJson from '../JSONConverter';
import {TextDocument} from '../../documents/model';

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
                    reject('Document (Create): Content not valid!');
                }

                this.documentStore.createDocument(docContent)
                  .then((doc: TextDocument) => resolve(doc))
                  .catch(err => {
                      console.error('Error: Creating a document had an error: ', err);
                      reject(err);
                  });
            } catch (error) {
                console.log(error);
                reject(error);
            }
        }));
    }

    delete(topic: string, content: any): Promise<any> {
        return new Promise<any>(((resolve, reject) => {
            try {
                const id = JSON.parse(content.toString()).id;
                this.documentStore.deleteDocument(id, (error) => {
                    if (error) {
                        console.error('Error deleting document: ', error);
                        return reject(error);
                    } else {
                        return resolve(id);
                    }
                })
            } catch (e) {
                console.log(e);
                reject(e);
            }
        }));
    }

    update(topic: string, content: any): Promise<any> {
        return Promise.resolve();
    }
}
