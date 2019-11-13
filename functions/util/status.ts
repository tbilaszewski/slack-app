const SUCCESS_CODE: number = 200;
const ERROR_CODE: number = 406;
const NOT_AUTH_CODE: number = 401;

export const returnSuccess = (res, data) => {
  res.status(SUCCESS_CODE).json(data);
};
export const returnError = (res, data) => {
  res.status(ERROR_CODE).json(data);
};
export const returnAuthError = (res, data) => {
  res.status(NOT_AUTH_CODE).json(data);
};
