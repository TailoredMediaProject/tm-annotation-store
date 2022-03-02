import {ObjectId} from "mongodb";
import {Origin, Target, Body} from "../openapi";

export interface Annotation {
    _id: ObjectId,
    origin: Origin,
    /**ID of older version*/
    replaces?: string,
    /**ID of newer version*/
    replacedBy?: string,
    created: string,
    body: Body[],
    target: Target | Target[]
}
