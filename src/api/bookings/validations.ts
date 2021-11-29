import Joi from "joi";
import { iataCodeSchema } from "../flights/flights";

const nameSchema = Joi.string().required().min(1).max(64);
const positiveNumberSchema = Joi.number().required().min(0);

const flightsAirportSchema = (description: string) => Joi.object({
  iataCode: iataCodeSchema(description),
  at: Joi.date().required().iso().greater('now').raw()
}).required()

const creditCardSchema = Joi.object({
  expire: Joi.string().required().pattern(/^(0[1-9]|1[0-2])\/?([2-9]{2})$/),
  holder: Joi.string().required().min(3).max(64),
  number: Joi.string().required().length(16)
}).required().description("Credit card information")

const passengersSchema = Joi
  .array()
  .required()
  .items(
    Joi.object({
      dateOfBirth: Joi.date().required().less('now').iso().raw(),
      firstName: nameSchema,
      lastName: nameSchema,
      gender: Joi.string().required().length(1).uppercase().pattern(/^W|M|D$/),
    })
  ).min(1);

const flightOfferSchema = Joi.object({
  stops: positiveNumberSchema,
  numberOfBookableSeats: positiveNumberSchema,
  price: positiveNumberSchema,
  currency: Joi.string().required().length(3),
  flights: Joi.array().required().min(1).items(Joi.object({
    duration: Joi.string().required().isoDuration(),
    departure: flightsAirportSchema("IATA code of the departing airport"),
    arrival: flightsAirportSchema("IATA code of the departing airport"),
  }))
}).required();

export const bookingsPostRequestBodySchema = Joi.object({
  creditCard: creditCardSchema,
  passengers: passengersSchema,
  flightOffer: flightOfferSchema,
}).required();
