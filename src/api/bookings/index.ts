import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../error.class';
import { ApiSuccess } from '../success.class';
import { loggerFile } from '../../configuration/logger';
import { Booking } from '../../schemas/booking.schema';
import { getHash, JWT } from '../authentication';
import { bookingsDeleteRequestParamsSchema, bookingsGetRequestQuerySchema, bookingsPostRequestBodySchema } from './validations';
import isCreditCard from 'validator/lib/isCreditCard';
import { BookingDraft, FlightOffer, Booking as IBooking } from '@secure-booking-service/common-types';
import { searchFlights } from '../flights/flights';
import { Roles } from '@secure-booking-service/common-types/Roles';



/****************************************
 *          Helpers Functions           *
 * **************************************/

/**
 * Compares two flight offers, if their are equal to each other.
 * An exception is made for the attribute numberOfBookableSeats. 
 * The function only checks, that enough seats are available 
 * for the request amount of passengers. 
 *
 * @param {FlightOffer} offer Flight offer from amadeus
 * @param {FlightOffer} requestedFlightOffer Flight offer from request
 * @param {number} adults Number of passengers
 * @return {boolean} Offers are equal to each other
 */
function flightOffersAreEqual(offer: FlightOffer, requestedFlightOffer: FlightOffer, adults: number): boolean {
  if (offer.stops !== requestedFlightOffer.stops) return false;
  if (offer.currency !== requestedFlightOffer.currency) return false;
  if (offer.numberOfBookableSeats < adults) return false;
  if (offer.price !== requestedFlightOffer.price.toString()) return false;
  if (offer.flights.length !== requestedFlightOffer.flights.length) return false;

  return offer.flights.every((flight, index) => {
    const requestedFlight = requestedFlightOffer.flights.at(index);

    if (flight.duration !== requestedFlight.duration) return false;
    if (flight.arrival.iataCode !== requestedFlight.arrival.iataCode) return false;
    if (flight.arrival.at !== requestedFlight.arrival.at) return false;
    if (flight.departure.iataCode !== requestedFlight.departure.iataCode) return false;
    if (flight.departure.at !== requestedFlight.departure.at) return false;

    return true;
  });
}


/****************************************
 *          Endpoint Handlers           *
 * **************************************/

/**
 * POST /api/bookings
 * 
 * Handles requests to create a new booking
 * 
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function bookingsPostRequest(req: Request & JWT, res: Response, next: NextFunction) {
  try {
    // 1. Validate body
    const postRequestBody = bookingsPostRequestBodySchema.validate(req.body);
    if (postRequestBody.error) throw new ApiError(400, postRequestBody.error.message);
    const bookingDraft = postRequestBody.value as BookingDraft;

    // 2. Validate credit card number 
    if (!isCreditCard(bookingDraft.creditCard.number))
      throw new ApiError(402, "Invalid credit card number!");

    // 3. Validate credit card expire date
    const today = new Date()
    const [expireMonth, expireYear]: string[] = bookingDraft.creditCard.expire.split('/')
    if (parseInt(expireMonth) < today.getMonth() + 1 && parseInt('20' + expireYear) <= today.getFullYear())
      throw new ApiError(402, "Credit card expired!");

    // 4. Validate flight offer
    const { at: departureDate, iataCode: originLocationCode } = bookingDraft.flightOffer.flights.at(0).departure
    const destinationLocationCode = bookingDraft.flightOffer.flights.at(-1).arrival.iataCode
    const adults = bookingDraft.passengers.length;

    const result = await searchFlights(
      originLocationCode,
      destinationLocationCode,
      departureDate.split("T").at(0),
      adults
    );

    const requestedFlightOffer: FlightOffer = bookingDraft.flightOffer;

    const offerIsValid = result.some((offer) => flightOffersAreEqual(offer, requestedFlightOffer, adults));

    if (!offerIsValid) throw new ApiError(400, "Flight offer invalid or expired!");

    // 5. Create booking
    const booking = new Booking({
      record: {
        ...bookingDraft,
        createdBy: req.token.data.email,
        from: originLocationCode,
        to: destinationLocationCode
      },
      createdBy: getHash().update(req.token.data.email).digest('hex'),
    });

    await booking.save();

    // 6. Done - return booking
    const response = new ApiSuccess(200, booking._id);
    next(response);

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}


/**
 * DELETE /api/bookings/:id
 * 
 * Handles requests to delete a booking
 * 
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function bookingsDeleteRequest(req: Request & JWT, res: Response, next: NextFunction) {
  try {
    // 1. Validate request params
    const deleteRequestParams = bookingsDeleteRequestParamsSchema.validate(req.params);
    if (deleteRequestParams.error) throw new ApiError(400, deleteRequestParams.error.message);

    // 2. Get booking document
    const booking = await Booking.findById(deleteRequestParams.value.id);
    if (booking === null || booking === undefined) {
      throw new ApiError(404, `Failed to find booking ${deleteRequestParams.value.id}`);
    }

    // 3. Delete booking
    try {
      await booking.deleteOne();
      const response = new ApiSuccess(204);
      next(response);
    } catch (error) {
      loggerFile.error(error.message);
      throw new ApiError(500, 'Failed to delete booking');
    }

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}


/**
 * GET /api/bookings
 * 
 * Handles requests to list bookings
 * 
 * @export
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
export async function bookingsGetRequest(req: Request & JWT, res: Response, next: NextFunction) {
  try {
    // 1. Validate request params
    const getRequestParams = bookingsGetRequestQuerySchema.validate(req.query);
    if (getRequestParams.error) throw new ApiError(400, getRequestParams.error.message);

    // 2. Validate role permissions
    if (!req.token.data.roles.includes(Roles.TRAVELLEAD) && getRequestParams.value.filter !== req.token.data.email)
      throw new ApiError(403, "User has not the required privileges to get other users bookings!")

    // 3. Get bookings
    let dbQuery = {};
    // Filter by email if requested
    if (getRequestParams.value.filter !== undefined)
      dbQuery = { createdBy: getHash().update(getRequestParams.value.filter).digest('hex') }
    const entries = await Booking.find(dbQuery)

    // 4. Create bookings array
    let bookings: IBooking[] = [];
    if (entries !== null && entries !== undefined) {
      bookings = entries.map(model => ({
        id: model.id,
        createdAt: model.createdAt.toUTCString(),
        createdBy: model.record.createdBy,
        passengers: model.record.passengers,
        creditCard: {
          holder: model.record.creditCard.holder,
          expire: model.record.creditCard.expire,
          number: "XXXXXXXXXXXX" + model.record.creditCard.number.substring(12)
        },
        from: model.record.from,
        to: model.record.to,
        flightOffer: model.record.flightOffer,
      }));
    }

    // 5. Return bookings
    const response = new ApiSuccess(200, bookings);
    next(response)

  } catch (err) {
    loggerFile.error(err);
    next(err);
  }
}
