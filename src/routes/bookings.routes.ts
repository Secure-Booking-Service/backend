import { Roles } from '@secure-booking-service/common-types/Roles';
import { Router } from 'express';
import { bookingsDeleteRequest, bookingsGetRequest, bookingsPostRequest } from '../api/bookings';
import { hasRoles } from '../api/authentication';

export const bookingsRoutes = Router();

bookingsRoutes.post('/bookings', hasRoles(Roles.TRAVELAGENT, Roles.TRAVELLEAD), bookingsPostRequest);
bookingsRoutes.delete('/bookings/:id', hasRoles(Roles.TRAVELLEAD), bookingsDeleteRequest);
bookingsRoutes.get('/bookings', hasRoles(Roles.TRAVELAGENT, Roles.TRAVELLEAD), bookingsGetRequest);
