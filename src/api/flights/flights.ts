import { config } from "../../configuration/environment";
import Amadeus from 'amadeus';
import { NextFunction, Request, Response } from 'express';
import { ApiSuccess } from '../success.class';
import { ApiError } from "../error.class";

const amadeus = new Amadeus({
  clientId: config.amadeusApi.key,
  clientSecret: config.amadeusApi.secret
});

/****************************************
 *          Endpoint Handlers           *
 * **************************************/

/**
 * Simple endpoint to verify that the user is authenticated
 *
 * @export
 * @param {Request} req
 * @param {Response} res
 */
export async function flightsGetRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await amadeus.shopping.flightOffersSearch.get({
      originLocationCode: 'SYD',
      destinationLocationCode: 'BKK',
      departureDate: '2021-11-15',
      adults: '2'

    })
    const response = new ApiSuccess(200, result.data);
    next(response);
  } catch (error) {
    throw new ApiError(400, error.message);
  }
}
