import { config as loadDotenv } from 'dotenv';
import Joi from 'joi';

loadDotenv();

const environemtSchema = Joi.object({
  MONGOOSE_DEBUG: Joi.boolean()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.boolean().default(true),
      otherwise: Joi.boolean().default(false)
    }),
  MONGO_HOST: Joi.string()
    .default('mongodb://db:27017/secure-booking-service')
    .description('Connection string for MongoDB'),
  NODE_ENV: Joi.string()
    .allow('development')
    .allow('production')
    .allow('test')
    .default('production'),
  PORT: Joi.number()
    .default(4040),
}).unknown()

const { error, value: envVars } = environemtSchema.validate(process.env);
if (error) throw new Error(`Config validation error: ${error.message}`);

export const config = {
  env: envVars.NODE_ENV,
  mongo: {
    host: envVars.MONGO_HOST,
    mongooseDebug: envVars.MONGOOSE_DEBUG,
  },
  port: envVars.PORT,
}