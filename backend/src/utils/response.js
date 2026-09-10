// API response helpers. Thin, opinionated, no envelopes.
export const ok = (res, data, status = 200) => res.status(status).json({ ok: true, data });
export const created = (res, data) => ok(res, data, 201);
export const noContent = (res) => res.status(204).end();

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export const badRequest = (msg, details) => { throw new ApiError(400, msg, details); };
export const unauthorized = (msg = 'Unauthorized') => { throw new ApiError(401, msg); };
export const forbidden = (msg = 'Forbidden') => { throw new ApiError(403, msg); };
export const notFound = (msg = 'Not found') => { throw new ApiError(404, msg); };
export const conflict = (msg, details) => { throw new ApiError(409, msg, details); };
