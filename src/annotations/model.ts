import {ObjectId} from 'mongodb';
import hash_sum from 'hash-sum';

export class Annotation {

    private _id: ObjectId;
    private _metadata: any;
    private value:any;

    private constructor() {
    }

    public static create() {
        const o = new Annotation();
        o.value = {
            type: 'Annotation'
        }
        o._metadata = {
            created: Date.now()
        }
        return o;
    }

    public static fromJson(json: any) {
        return Object.assign(new Annotation(), json);
    }

    setBody(body: any, type: string) {
        this.value.body = Annotation.toBody(body, type);
    }

    setTarget(target: any, type: string) {
        this.value.target = Annotation.toTarget(target, type);
    }

    public setHashSum(): Annotation {
        this._metadata.hashSum = hash_sum(this.value);
        return this;
    }

    private static toBody(body: any, type: string) {
        switch (type) {
            case 'bodyResource': return body;
            case 'bodyText': return {type: 'TextualBody', value: body.value}
            default: return undefined;
        }
    }

    private static toTarget(target: any, type: string) {
        switch (type) {
            case 'targetResource': return target;
            case 'targetTextSelector': return Annotation.toTextSelector(target);
            case 'targetFragmentSelector': return {
                type: 'SpecificResource',
                source: target.source,
                selector: [{
                    type: "FragmentSelector",
                    conformsTo: target.conformsTo,
                    value: target.value
                }]
            }
            default: return undefined;
        }
    }

    private static toTextSelector(target: any) {
        if(!target.textPositionSelector && !target.textQuoteSelector) {
            throw new Error("At least one of 'textPositionSelector' or 'textQuoteSelector' has to be set")
        }

        const result = {
            type: 'SpecificResource',
            source: target.source,
            selector: [] as any[]
        };

        if(target.textPositionSelector) {
            result.selector.push({
                type: "TextPositionSelector",
                start: target.textPositionSelector.start,
                end: target.textPositionSelector.end
            })
        }

        if(target.textQuoteSelector) {
            result.selector.push({
                type: "TextQuoteSelector",
                exact: target.textQuoteSelector.exact,
                prefix: target.textQuoteSelector.prefix,
                suffix: target.textQuoteSelector.suffix
            })
        }
        return result;
    }

    getIdString(): string {
        return this._id?.toString();
    }

    getValue(annotationBaseURI: string = ''): any {
        this.value.id = `${annotationBaseURI}${this.getIdString()}`;
        this.value.target.source = `${annotationBaseURI}${this.value.target.source}`
        return this.value;
    }
}

export class Filter {
    public targetId: string;

    constructor(json: any) {
        this.targetId = json.targetId;
    }

    toMongoFilter() {
        return {$or:[{'value.target.id':{$eq:this.targetId}},{'value.target.source':{$eq:this.targetId}}]};
    }
}
