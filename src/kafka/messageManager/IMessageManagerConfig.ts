export interface IMessageManagerConfig {
    consumer: {
        groupId: string;
        topic: string | RegExp;
        fromBeginning: boolean;
    }[];
}