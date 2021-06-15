export class TextDocument {
    public statistics: Statistics;

    private constructor(public title:string, public content:string, public id?:string) {
        this.statistics = new Statistics();
    }

    static fromRequest(body:any):TextDocument {
        if(!body) {
            throw new Error('Body may not be empty')
        }
        if(!body.title) {
            throw new Error('Property \'title\' may not be empty')
        }
        if(!body.content) {
            throw new Error('Property \'content\' may not be empty')
        }
        return new TextDocument(body.title, body.content);
    }

    static fromStorage(body:any, baseURI: string):TextDocument {
        return new TextDocument(body.title, body.content, body._id);
    }
}

export class Statistics {
    public annotationCount: AnnotationCount;
}

export class AnnotationCount {
    constructor(
        public document: number,
        public documentPart: number
    ) {}
}
