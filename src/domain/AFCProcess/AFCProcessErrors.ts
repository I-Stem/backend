export enum AFCProcessErrors {
    AFCProcessNotFoundError = "AFCProcessNotFoundError",
    AFCProcessFormattingResultMissingError = "AFCProcessFormattingResultMissingError"
}


export class AFCProcessNotFoundError extends Error {
    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }

}

export class AFCProcessFormattingResultMissingError extends Error {
    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }

}