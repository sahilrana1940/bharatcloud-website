export const mobileOnlyUpload = (req, res, next) => {
  const client = req.headers["x-client-type"];
  if (client !== "MOBILE_APP") {
    return res.status(403).json({
      error: "Upload allowed only from BharatCloud Mobile App",
    });
  }
  next();
};
