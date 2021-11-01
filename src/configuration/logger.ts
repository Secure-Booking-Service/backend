import log4js from 'log4js';
import { config } from './environment';

const configLogger = {
    appenders: {
      default: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '[%d{ISO8601}] %m',
      }},
      stdout: {
        type: 'stdout',
        layout: {
          type: 'pattern',
          pattern: '[%d{ISO8601}] %m',
      }},
      file: {
        type: 'file',
        filename: 'log/server.log',
        maxLogSize: 10485760,
        layout: {
          type: 'pattern',
          pattern: '[%d{ISO8601}] %m',
      }
    }},
    categories: {
      default: { appenders: ['stdout'], level: 'all'},
      production: { appenders: ['stdout'], level: 'all'},
      development: { appenders: ['stdout', 'file'], level: 'all'},
      test: { appenders: ['stdout'], level: 'all'}
    }

};

// if development then print in console, else in log
export const loggerFile = log4js.configure(configLogger).getLogger(config.env);
export const loggerMiddleware = log4js.connectLogger(loggerFile, {level: 'auto'});
