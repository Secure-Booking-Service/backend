import { Router } from 'express';
import { Roles } from '@secure-booking-service/common-types/Roles';
import { hasRole } from '../api/authentication';
import { emailPutRequest } from '../api/user/[email]';

export const userRoutes = Router();

userRoutes.put('/:email', hasRole(Roles.ADMIN), emailPutRequest);
