import { Roles } from '@secure-booking-service/common-types/Roles';
import { Router } from 'express';
import { bookingsPostRequest } from '../api/bookings';
import { hasRoles } from '../api/authentication';

export const bookingsRoutes = Router();

bookingsRoutes.post('/bookings', hasRoles(Roles.TRAVELAGENT, Roles.TRAVELLEAD), bookingsPostRequest);
