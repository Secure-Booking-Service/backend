import { Router } from 'express';
import { Roles } from '@secure-booking-service/common-types/Roles';
import { hasRoles } from '../api/authentication';
import { emailPutRequest } from '../api/user/[email]';
import { userPostRequest } from '../api/user';

export const userRoutes = Router();

userRoutes.put('/:email', hasRoles(Roles.ADMIN), emailPutRequest);
userRoutes.post('/', hasRoles(Roles.ADMIN), userPostRequest);
