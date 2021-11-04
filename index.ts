import * as util from 'util';
import { config } from './src/configuration/environment';
import { connect as connectDB, set } from 'mongoose';
import { loggerFile } from './src/configuration/logger';
import { app } from './src/configuration/express';

try {
  // print mongoose logs in dev env
  if (config.mongo.mongooseDebug) {
    set('debug', (collectionName: unknown, method: unknown, query: unknown, doc: unknown) => {
      loggerFile.debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
    });
  }

  connectDB(config.mongo.host).then(() => {
    loggerFile.debug('Mongoose connected');
    app.listen(config.port, () => {
      loggerFile.debug(`server started on ${config.rp.origin}:${config.port} (${config.env})`);
    });
  });

} catch (error) {
  loggerFile.error('Startup failed: ' + error)
  process.exit(1)
}

