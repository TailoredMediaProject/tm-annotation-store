export interface IMessageManagerProtocol {
    create(content: any): Promise<any>;

    update(content: any): Promise<any>;

    delete(content: any): Promise<any>;
}