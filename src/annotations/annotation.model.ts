import {ObjectId} from "mongodb";
import {Origin, Target, Body} from "../openapi";

export interface Annotation {
    _id: ObjectId,
    origin: Origin,
    replaces?: string,
    replacedBy?: string,
    created: string,
    body: Body | Body[],
    target: Target | Target[]
}