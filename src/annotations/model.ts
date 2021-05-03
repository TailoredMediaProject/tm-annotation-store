export class Annotation {
    private readonly value:any;

    constructor() {
        this.value = {
            type: 'http://www.w3.org/ns/oa#Annotation'
        }
    }

    setBody(body: any, type: string) {
        this.value.body = Annotation.toBody(body, type);
    }

    setTarget(target: any, type: string) {
        this.value.target = Annotation.toTarget(target, type);
    }

    private static toBody(body: any, type: string) {
        switch (type) {
            case 'bodyResource': return body;
            case 'bodyText': return {type: 'http://www.w3.org/ns/oa#TextualBody', value: body.value}
            default: return undefined;
        }
    }

    private static toTarget(target: any, type: string) {
        switch (type) {
            case 'targetResource': return target;
            case 'targetTextSelector': return Annotation.toTextSelector(target);
            case 'targetFragmentSelector': return {
                type: 'http://www.w3.org/ns/oa#SpecificResource',
                source: target.source,
                selector: [{
                    type: "http://www.w3.org/ns/oa#FragmentSelector",
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
            type: 'http://www.w3.org/ns/oa#SpecificResource',
            source: target.source,
            selector: [] as any[]
        };

        if(target.textPositionSelector) {
            result.selector.push({
                type: "http://www.w3.org/ns/oa#TextPositionSelector",
                start: target.textPositionSelector.start,
                end: target.textPositionSelector.end
            })
        }

        if(target.textQuoteSelector) {
            result.selector.push({
                type: "http://www.w3.org/ns/oa#TextQuoteSelector",
                exact: target.textQuoteSelector.exact,
                prefix: target.textQuoteSelector.prefix,
                suffix: target.textQuoteSelector.suffix
            })
        }
        return result;
    }

    getValue(): any {
        return this.value;
    }
}

export class Filter {
    public targetId: string;

    constructor(json: any) {
        this.targetId = json.targetId;
    }

    toMongoFilter() {
        return {$or:[{'target.id':{$eq:this.targetId}},{'target.source':{$eq:this.targetId}}]};
    }
}
