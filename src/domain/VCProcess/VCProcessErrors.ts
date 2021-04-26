export enum VCProcessErrors {
    VCProcessNotFoundError = "VCProcessNotFoundError",
    VCProcessFormattingResultMissingError = "VCProcessFormattingResultMissingError",
    VCProcessInsightExtractionError = "VCProcessInsightExtractionError"
}


export class VCProcessNotFoundError extends Error {
    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }

}

export class VCProcessFormattingResultMissingError extends Error {
    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }

}

export class VCProcessInsightExtractionError extends Error {
    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }

}