import { Roles } from '@secure-booking-service/common-types/Roles';
import { Router } from 'express';
import { hasRole, isAuth } from '../api/authentication';
import { flightsGetRequest } from '../api/flights/flights';
import { authenticationRoutes } from './authentication.routes';
import { bookingsRoutes } from './bookings.routes';
import { userRoutes } from './user.routes';
export const router = Router();

router.use('/authentication', authenticationRoutes);
router.use(isAuth);

// EVERYTHING BELOW REQUIRES AUTHENTICATION!
router.use(bookingsRoutes);
router.use('/user', userRoutes);
router.get('/flights', hasRole(Roles.TRAVELAGENT), flightsGetRequest);
