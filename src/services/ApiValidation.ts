export class ApiValidation {
  public static readonly checkProperties = (allowed: string[], objectToCheck: any): string =>
    // @ts-ignore
    allowed.reduce((accumulator: string, key: string) => {
      if(accumulator !== '') {
        return accumulator;
      }

      if(!objectToCheck.hasOwnProperty(key)) {
        return `Required property '${key}' missing`;
      }

      if(!objectToCheck[key]) {
        return `Required property '${key}' value is falsy`;
      }

      return '';
    }, '');

  // @ts-ignore
  public static readonly validateContentTypeHeader = (req, res): boolean => {
    const contentType = req.header('Content-Type');

    if(!!contentType && contentType !== 'application/json') {
      res.status(406).json('Only application/json is acceptable')
    }

    return true;
  };
}
