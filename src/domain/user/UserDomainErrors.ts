

export enum UserDomainErrors {
    UserAlreadyRegisteredError = "UserAlreadyRegisteredError",
    UserInfoSaveError = "UserInfoSaveError",
    InvalidInvitationTokenError = "InvalidInvitationTokenError",
    InvitationEmailMismatchError = "InvitationEmailMismatchError",
    NoSuchUserError = "NoSuchUserError"
}


export class UserAlreadyRegisteredError extends Error {

    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class UserInfoSaveError extends Error {

    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class InvalidInvitationTokenError extends Error {

    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class InvitationEmailMismatchError extends Error {

    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class NoSuchUserError extends Error {

    constructor(message:string) {
        super(message);
        this.name = this.constructor.name;
    }
}