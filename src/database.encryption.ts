import { config } from "./configuration/environment";

const defaultValues = {
     encryptionKey: config.mongo.encryptionKey,
     signingKey: config.mongo.signingKey,
};

export const defaultEncryption = Object.freeze(defaultValues);
