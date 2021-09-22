export interface IMessageManagerConfig {
    groupId: string;
    topic: string | RegExp;
    fromBeginning: boolean;
}