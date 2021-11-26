import amadeus from "../../configuration/amadeus";
import { NextFunction, Request, Response } from "express";
import { ApiSuccess } from "../success.class";
import { ApiError } from "../error.class";
import { loggerFile } from "../../configuration/logger";
import { FlightOffer, Flight } from "@secure-booking-service/common-types"
import Joi from "joi";

/**
 * User input validation
 */
const flightsGetRequestQuerySchema = Joi.object({
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
    .greater('now')
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
export async function flightsGetRequest(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Validate user input
    const flightsGetRequestQuery = flightsGetRequestQuerySchema.validate(req.query);
    if (flightsGetRequestQuery.error)
      throw new ApiError(400, flightsGetRequestQuery.error.message);

    try {
      // 2. Call Amadeus API
      const result = await amadeus.shopping.flightOffersSearch.get({
        originLocationCode: flightsGetRequestQuery.value.originLocationCode,
        destinationLocationCode: flightsGetRequestQuery.value.destinationLocationCode,
        departureDate: flightsGetRequestQuery.value.departureDate,
        adults: flightsGetRequestQuery.value.adults,
      });

      // 3. Create return array
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flightOffers: FlightOffer[] = result.data.map((flightOffer: any) => (
        {
          numberOfBookableSeats: flightOffer.numberOfBookableSeats,
          stops: flightOffer.itineraries[0].segments.length - 1,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          flights: flightOffer.itineraries[0].segments.map((flight: any) => (
            {
              departure: {
                iataCode: flight.departure.iataCode,
                at: flight.departure.at
              },

              arrival: {
                iataCode: flight.arrival.iataCode,
                at: flight.arrival.at
              },

              duration: flight.duration
            } as Flight
          )),
          price: flightOffer.price.grandTotal,
          currency: flightOffer.price.currency,
        } as FlightOffer
      ));

      // 4. Done
      const response = new ApiSuccess(200, flightOffers);
      next(response);
    } catch (error) {
      loggerFile.error(error);
      // Forward amadeus api error response if available
      if (error.description?.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errors = error.description.map((err: any) => (
          { message: `Amadeus api response: status ${err.status}, code ${err.code}, ${err.title}: ${err.detail}` }
        ));
        throw new ApiError(424, errors);
      }
      throw new ApiError(400, error);
    }
  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
