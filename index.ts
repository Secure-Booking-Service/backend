import * as util from 'util';
import { config } from './src/configuration/environment';
import { connect as connectDB, set } from 'mongoose';
import { loggerFile } from './src/configuration/logger';
import { app } from './src/configuration/express';
import { User } from './src/schemas/user.schema';
import { RegistrationToken, IRegistrationTokenDocument } from './src/schemas/registrationToken.schema';

try {
  loggerFile.info('application started');

  // print mongoose logs in dev env
  if (config.mongo.mongooseDebug) {
    set('debug', (collectionName: unknown, method: unknown, query: unknown, doc: unknown) => {
      loggerFile.debug(`${collectionName}.${method}`, util.inspect(query, false, 20), doc);
    });
  }

  connectDB(config.mongo.host).then(() => {
    loggerFile.debug('Mongoose connected');

    User.findOne({ $and: [{ 'device': { $ne: undefined }}, { 'device': { $ne: null }}]}).then(user => {
      if (user !== null) return; // An admin already exists!

      // No admin has been found -> Create a registration token and print it into the logs
      new RegistrationToken({ userIsDeletable: false }).save().then((token: IRegistrationTokenDocument) => {
        loggerFile.info('No administrator found!');
        loggerFile.info(`Use ${token.key} as token to register your user`);
        loggerFile.info(`This token is valid for ${config.registrationTokenLifetime} minutes.`);
      });
    });

    app.listen(config.port, () => {
      loggerFile.debug(`server started on port ${config.port} (${config.env})`);
    });
  });

} catch (error) {
  loggerFile.error('Startup failed: ' + error)
  process.exit(1)
}

