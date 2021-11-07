import { Router } from 'express';
import { authenticationRoutes } from './authentication.routes';
export const router = Router();

router.use('/authentication', authenticationRoutes)