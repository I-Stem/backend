import {Response} from 'express';
import message from 'src/queues/message';
import {IResponse} from '../interfaces/vendors/IResponse';

export interface IResponseEntries {
    [key: number]: (r: IResponse) => IResponse;
build: (r: IResponse) => IResponse;
error: (r: IResponse) => IResponse;
}
export const response: IResponseEntries = {
    // #region 2**
    200: ({ flag = 'Ok', message = 'Process success', data = {} }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 200,
            error: false
                    }),
    201: ({
        flag = 'Created',
        message = 'Data has been created',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 201
        }),
    202: ({
        flag = 'Accepted',
        message = 'The request has been accepted for processing, ' +
            'but the processing has not been completed. The request might or might not be eventually acted upon, and may be disallowed when processing occurs',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 202
        }),
    204: ({
        flag = 'No Content',
        message = 'The server successfully processed the request and is not returning any content.',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 204
        }),
    // #endregion
    // #region 4**
    400: ({
        flag = 'Bad Request',
        message = 'The server cannot or will not process the request due to an apparent client erro',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 400
        }),
    403: ({
        flag = 'Forbidden',
        message = 'The request contained valid data and was understood by the server, ' +
            'but the server is refusing action. This may be due to the user not having the necessary permissions for a resource or needing an account of some sort, or attempting a prohibited action ',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 403
        }),
    406: ({
        flag = 'Not Acceptable',
        message = 'The requested resource is capable of generating only content not acceptable according to the Accept headers sent in the request.',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 406
        }),
    409: ({
        flag = 'Conflict',
        message = 'Indicates that the request could not be processed because of conflict in the current state of the resource, such as an edit conflict between multiple simultaneous updates.',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 409
        }),
    401: ({ flag = '', message = 'Unaothorized', data = {} }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 401
        }),
    404: ({ flag = '', message = 'Data not found', data = {} }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 404
        }),
    422: ({
        flag = '',
        message = 'Unprocessable entity',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 422
        }),
    // #endregion
    // #region 5**
    500: ({
        flag = '',
        message = 'Internal server error',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 500
        }),
    503: ({
        flag = '',
        message = 'Service unavailable',
        data = {}
    }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 503
        }),
    501: ({ flag = '', message = 'Not implemented', data = {} }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 501
        }),
    502: ({ flag = '', message = 'Bad gateway', data = {} }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 502
        }),
    505: ({ flag = '', message = 'Unkown error', data = {} }): IResponse =>
        response.build({
            flag,
            message,
            data,
            code: 505
        }),
    402: ({ flag = '', message = 'Payment Required', data = {} }): IResponse =>
    response.build({
        flag,
        message,
        data,
        code: 402
    }),
    // #endregion
    // #region general
    build: (r: IResponse): IResponse => r,
    error: (r: IResponse): IResponse => ({
        code: r.code,
        flag: r.flag,
        message: r.message,
        error: r.data
    })
    // #endregion
};

export function createResponse(res: Response, httpStatusCode: any, message: string, data: any = {}) {
    return res.status(httpStatusCode).json(
        response[httpStatusCode]({
            message: message,
            data: data
        })
    );
}

export default response;
