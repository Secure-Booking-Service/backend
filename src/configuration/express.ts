import { json } from 'body-parser';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Response, Request } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import methodOverride from 'method-override';
import { loggerMiddleware } from './logger';
import { router } from '../routes/index.routes';
import { ApiError } from '../api/error.class';
import { apiMiddleware } from '../api/middleware';
import { config } from './environment';

export const app = express();

app.use(loggerMiddleware);

app.use(json());
app.use(cookieParser());
app.use(compress());
app.use(methodOverride());
app.use(helmet());
app.use(cors({ origin: [config.rp.origin], credentials: true }));

// Delimit number of requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 100
});

// only apply to requests that begin with /api/
app.use('/api/', apiLimiter, router);

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction,) => {
  const apiError = new ApiError(404, 'Not found');
  return next(apiError);
});

// handle any kind of response from ApiResponse instances to Error objects
app.use(apiMiddleware);
