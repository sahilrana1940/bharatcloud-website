export const mobileOnlyUpload = (req, res, next) => {
  if (req.headers["x-client-type"] !== "MOBILE_APP") {
    return res
      .status(403)
      .json({ error: "Upload allowed only from BharatCloud Mobile App" });
  }
  next();
};
