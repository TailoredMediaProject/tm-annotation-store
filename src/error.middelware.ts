import {NextFunction, Request, Response} from 'express';
import {AnnotationError} from './models/annotation-error.model';

export const ErrorMiddleware = (err: AnnotationError | Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof AnnotationError) {
    console.error(err);
    const body = !!err?.data ? err.data : { title: err.statusCode, message: err.message };
    res.status(err.statusCode).json(body);
  }
  else {
    res.status(500).json({title: 500, message: err.message});
  }
};
