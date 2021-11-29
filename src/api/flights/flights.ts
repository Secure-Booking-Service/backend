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
export const iataCodeSchema = (description: string) => Joi.string()
  .required()
  .length(3)
  .uppercase()
  .description(description);

const flightsGetRequestQuerySchema = Joi.object({
  originLocationCode: iataCodeSchema("IATA code of the departing airport"),
  destinationLocationCode: iataCodeSchema("IATA code of the destination airport"),
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

/**
 * Requests possible flights from amadeus api and converts them into
 * a flightoffer array.
 *
 * @export
 * @param {string} originLocationCode IATA code of departure airport
 * @param {string} destinationLocationCode IATA code of destination airport
 * @param {string} departureDate Date of departure
 * @param {number} adults Number of passengers
 * @return {Promise<FlightOffer[]>} Available flight offers
 */
export async function searchFlights(originLocationCode: string, destinationLocationCode: string, departureDate: string, adults: number): Promise<FlightOffer[]> {
  try {
    const result = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults
    });

    if (result.data === undefined) throw new ApiError(500, "Error with Amadeus backend!")

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

    return flightOffers;

  } catch (error) {
    if (error instanceof ApiError) throw error; 

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


}


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

    const {
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults
    } = flightsGetRequestQuery.value;


    // 2. Call Amadeus API
    const flightOffers = await searchFlights(
      originLocationCode,
      destinationLocationCode,
      departureDate,
      adults
    );

    // 3. Done
    const response = new ApiSuccess(200, flightOffers);
    next(response);

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
