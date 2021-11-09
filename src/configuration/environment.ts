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
  JWT_SECRET: Joi.string()
    .required()
    .min(32)
    .description('Used to validate a jwt. Use a strong secret!'),
  JWT_EXPIRESIN: Joi.string()
    .default('1h')
    .description('Defines how long a user will be logged in'),
  PORT: Joi.number()
    .default(4040),
  REGISTRATION_TOKEN_LIFETIME: Joi.string()
    .default('15m')
    .description('Defines how long a registration token can be used until it expires'),
  RP_NAME: Joi.string()
    .default('Secure Booking Service')
    .description('Human-readable title of the website for webauthn'),
  RP_ID: Joi.string()
    .when('NODE_ENV', {
      is: Joi.string().equal('development'),
      then: Joi.string().default('localhost'),
      otherwise: Joi.string().min(8).required()
    })
    .description('Unique identifier of the website for webauthn'),
  RP_ORIGIN: Joi.string()
    .uri()
    .required()
    .description('Unique identifier of the website for webauthn'),
}).unknown()

const { error, value: envVars } = environemtSchema.validate(process.env);
if (error) throw new Error(`Config validation error: ${error.message}`);

export const config = {
  env: envVars.NODE_ENV,
  mongo: {
    host: envVars.MONGO_HOST,
    mongooseDebug: envVars.MONGOOSE_DEBUG,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRESIN,
  },
  port: envVars.PORT,
  registrationTokenLifetime: envVars.REGISTRATION_TOKEN_LIFETIME,
  rp: {
    name: envVars.RP_NAME,
    id: envVars.RP_ID,
    origin: envVars.RP_ORIGIN,
  }
}
