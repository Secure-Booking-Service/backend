import { config } from "../../configuration/environment";
import Amadeus from "amadeus";
import { NextFunction, Request, Response } from "express";
import { ApiSuccess } from "../success.class";
import { ApiError } from "../error.class";
import { loggerFile } from "../../configuration/logger";
import Joi from "joi";

/**
 * The base Amadeus api object
 */
export const amadeus = new Amadeus({
  clientId: config.amadeusApi.key,
  clientSecret: config.amadeusApi.secret,
  logger: loggerFile,
  logLevel: config.env === "development" ? "debug" : "silent",
});

/**
 * User input validation
 */
const flightsGetRequestSchema = Joi.object({
  originLocationCode: Joi.string()
    .required()
    .length(3)
    .uppercase()
    .description("IATA code of the departing airport"),
  destinationLocationCode: Joi.string()
    .required()
    .length(3)
    .uppercase()
    .description("IATA code of the destination airport"),
  departureDate: Joi.date()
    .required()
    .iso()
    .raw()
    .description("The date on which the traveler will depart"),
  adults: Joi.number()
    .required()
    .min(1)
    .description("The number of adult travelers"),
});

/****************************************
 *          Endpoint Handlers           *
 * **************************************/

/**
 * GET /flights
 *
 * Get all flights for the given search criteria.
 *
 * Expect: 'originLocationCode', 'destinationLocationCode', 'departureDate' and 'adults' parameter
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
export async function flightsGetRequest(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // 1. Validate user input
    const assertionGetRequest = flightsGetRequestSchema.validate(req.query);
    if (assertionGetRequest.error)
      throw new ApiError(400, assertionGetRequest.error.message);

    try {
      // 2. Call Amadeus API
      const result = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: assertionGetRequest.value.originLocationCode,
        destinationLocationCode: assertionGetRequest.value.destinationLocationCode,
        departureDate: assertionGetRequest.value.departureDate,
        adults: assertionGetRequest.value.adults,
      });

      // 3. Create return array
      const flights = result.data.map((flight: any) => {
        return {
          id: flight.id,
          oneWay: flight.oneWay,
          numberOfBookableSeats: flight.numberOfBookableSeats,
          stops: flight.itineraries[0].segments.length - 1,
          price: flight.price.grandTotal,
          currency: flight.price.currency,
        };
      });

      // 4. Done
      const response = new ApiSuccess(200, flights);
      next(response);
    } catch (error) {
      loggerFile.error(error);
      throw new ApiError(400, error.code);
    }
  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
