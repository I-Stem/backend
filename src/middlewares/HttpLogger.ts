import { stream } from 'winston';
let fs = require('fs');
let path = require('path');

let morgan = require('morgan');

morgan.token('request', function(req: any, res: any) {
    return JSON.stringify(req.body, getCircularReplacer());
});

morgan.token('response', function(req: any, res: any) {
    return JSON.stringify(res, getCircularReplacer());
});

const accessHttpLogStream = fs.createWriteStream(path.join(__dirname, 'httpLog.log'), {flags: 'a'});
let httpLogger = morgan(function(tokens: any, req: any, res: any) {
    return [
        tokens.date(req, res, 'web'),
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        '\n Request', tokens.request(req, res),
        '\n Response', tokens.response(req, res),
        tokens['response-time'](req, res), 'ms'
    ].join(' ');
}, {stream: accessHttpLogStream});

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key: any, value: any) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

export {httpLogger, getCircularReplacer};
