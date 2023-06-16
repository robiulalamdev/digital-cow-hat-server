/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
/* eslint-disable consistent-type-definitions */
import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { IGenericErrorMessages } from '../interfaces/IGenericErrorMessages';
import handleValidationError from '../errors/handleValidationError';
import ApiError from '../errors/apiError';
import { Error } from 'mongoose';
import { errorlogger } from '../shared/logger';
import { ZodError } from 'zod';
import handleZodError from './handleZodError';

const globalErrorHanndler = (
  error: Error.ValidationError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  config.env === 'development' ? console.log(error) : errorlogger.error(error);

  let statusCode = 500;
  let message = 'Sometiong Went Wrong !';
  let errorMessages: IGenericErrorMessages[] = [];

  if (error.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ZodError) {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorMessages = simplifiedError.errorMessages;
  } else if (error instanceof ApiError) {
    statusCode = error?.statusCode;
    message = error.message;
    errorMessages = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  } else if (error instanceof Error) {
    message = error?.message;
    errorMessages = error?.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.env !== 'production' ? error.stack : undefined,
  });

  next();
};

export default globalErrorHanndler;