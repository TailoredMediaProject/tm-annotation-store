import {ObjectId} from "mongodb";

export interface Annotation {
    _id: ObjectId,
    origin: Origin,
    replaces?: string,
    replacedBy?: string,
    created: Date,
    body: Body | Body[],
    target: Target | Target[]
}

export type OriginType = 'ingest' | 'linking' | 'manual'

export interface Origin {
    type: OriginType
    creator: string
}

export type BodyType = 'MetadataBody' | 'ResourceBody' | 'TextBody' | 'PartBody';

export interface Body {
    id: string,
    confidence?: number,
    type: BodyType
}

export interface TextBody extends Body {
    value: String
}

type MetadataValueType = string | number | boolean | Date;

export interface MetadataAnnotationBody extends Body{
    relation: string,
    value: MetadataValueType | MetadataValueType[];
}

export interface ResourceAnnotationBody extends Body {
    relation: string,
    value: string
}

export type TargetType = 'TargetResource' | 'FragmentResource'

export interface Target {
    source: string,
    type: TargetType
}

export interface ResourceAnnotationTarget extends Target {
    selector: Selector
}

export type SelectorType = 'TextPositionSelector'
    | 'TextQuoteSelector'
    | 'MediaFragmentSelector'
    | 'TemporalFragmentSelector'
    | 'PercentSpatialSelector'

export interface Selector {
    type: SelectorType
}

export interface TextTempPositionSelector extends Selector {
    start: number,
    end: number
}

export interface TextQuoteSelector extends Selector {
    exact: string,
    prefix: string,
    suffix: string
}

export interface MediaFragmentSelector extends Selector {
    temporal: TextTempPositionSelector,
    spatial: PercentSpatialSelector
}

export interface PercentSpatialSelector extends Selector {
    x: number,
    y: number,
    w: number,
    h: number
}

