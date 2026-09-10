// Body/query validation middleware backed by zod.
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const data = source === 'query' ? req.query : req.body;
  const result = schema.safeParse(data);
  if (!result.success) {
    return next(result.error);
  }
  // Replace with parsed (and stripped) data.
  if (source === 'query') req.validatedQuery = result.data;
  else req.body = result.data;
  next();
};
