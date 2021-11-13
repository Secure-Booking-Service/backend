import { Router } from 'express';
import { authVerify, isAuth } from '../api/authentication';
import { loginPostRequest, loginGetRequest } from '../api/authentication/login';
import { registerGetRequest, registerPostRequest } from '../api/authentication/register';

export const authenticationRoutes = Router();

authenticationRoutes.get('/login', loginGetRequest)
authenticationRoutes.post('/login', loginPostRequest)
authenticationRoutes.get('/register', registerGetRequest)
authenticationRoutes.post('/register', registerPostRequest)
authenticationRoutes.use('/verify', isAuth, authVerify);
