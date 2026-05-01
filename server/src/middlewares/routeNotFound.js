export default function routeNotFount(req, res){
  res.status(404).json({
    success: false,
    error: "Not found",
    status: 404,
    data: null,
  });
}