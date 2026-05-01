export default function errorMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  if (status >= 500) {
    console.error("[server]", err);
  } else {
    console.warn("[client]", message);
  }
  res.status(status).json({
    error: message,
    success: false,
    status: status,
    data: null,
  });
}
