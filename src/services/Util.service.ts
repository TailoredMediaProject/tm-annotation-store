import {ObjectId} from "mongodb";

export class UtilService {
    public static objectIdIsValid(id: string): boolean {
        try {
            new ObjectId(id);
            return true;
        } catch (_) {
            return false;
        }
    }
}