import { Router } from 'express';
import { isAuth } from '../api/authentication';
import { authenticationRoutes } from './authentication.routes';
import { userRoutes } from './user.routes';
export const router = Router();

router.use('/authentication', authenticationRoutes);
router.use(isAuth);

// EVERYTHING BELOW REQUIRES AUTHENTICATION!
router.use('/user', userRoutes);
