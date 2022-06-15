import {NextFunction, Request, Response} from 'express';
import {AnnotationError} from './models/annotation-error.model';
import {FILE_SIZE_LIMIT} from './server';

// Don't remove the next method! Without 4 args this method will not work as error handler!
export const ErrorMiddleware = (err: AnnotationError | Error, req: Request, res: Response, next: NextFunction): void => {
  if (err instanceof AnnotationError) {
    console.error(err);
    const body = !!err?.data ? err.data : { title: err.statusCode, message: err.message };
    res.status(err.statusCode).json(body);
  }
  else {
    // @ts-ignore
    if(err?.statusCode === 413) {
      err.message += `, max file size limit is ${FILE_SIZE_LIMIT}`;
    }
    // @ts-ignore
    const title = err.statusCode ? err.statusCode : 500;
    res.status(title).json({title, message: err.message});
  }
};
