import express, { ErrorRequestHandler } from 'express';
import 'express-async-errors';
import swaggerUi from 'swagger-ui-express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { errors } from 'celebrate';
import { routes } from './routes';
import { AppError } from '@shared/errors/AppError';
import swaggerFile from '../../swagger.json';
import '@shared/container';
import uploadConfig from '@config/upload';
import logger from '../log';

const app = express();

app.use(cors());
app.use(express.json());

app.use(
  pinoHttp({
    logger,
    customLogLevel: (res, err) => (err || res.statusCode >= 500) ? 'error' : 'info',
    customSuccessMessage: (res) => `Completed ${res.statusCode}`,
  })
);

app.use('/files', express.static(uploadConfig.directory));
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(routes);
app.use(errors());

const errorHandler: ErrorRequestHandler = (error, request, response, next): void => {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
    return;
  }

  logger.error(error);

  response.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

app.use(errorHandler);

export { app };
