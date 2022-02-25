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
                this.documentStore.deleteDocument(id)
                .then((deleteCount: number) => {
                    if(deleteCount === 1) {
                        resolve(id);
                    } else {
                        return reject(new Error('Could not find ID'));
                    }
                })
              .catch(err => {
                  console.error('Error deleting document: ', err);
                  return reject(err);
              });
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
