import { config } from "../configuration/environment";
import Amadeus from "amadeus";
import { loggerFile } from "../configuration/logger";


/**
 * The base Amadeus api object
 */
export const amadeus = new Amadeus({
  clientId: config.amadeusApi.key,
  clientSecret: config.amadeusApi.secret,
  logger: loggerFile,
  logLevel: config.env === "development" ? "debug" : "silent",
});

export default amadeus;
