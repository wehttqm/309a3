function locationStrict(req, res, next) {
  const { location } = req.body;

  if (
    !location ||
    typeof location.lat !== "number" ||
    typeof location.lon !== "number"
  ) {
    return res
      .status(400)
      .json({ error: "Location must include numeric lat and lon." });
  }

  const isLatValid = location.lat >= -90 && location.lat <= 90;
  const isLonValid = location.lon >= -180 && location.lon <= 180;

  if (!isLatValid || !isLonValid) {
    return res.status(400).json({
      error: "Latitude must be between -90/90 and Longitude between -180/180.",
    });
  }

  next();
}

function locationOptional(req, res, next) {
  const { location } = req.body;

  if (location) {
    if (typeof location.lat !== "number" || typeof location.lon !== "number") {
      return res
        .status(400)
        .json({ error: "Location must include numeric lat and lon." });
    }

    const isLatValid = location.lat >= -90 && location.lat <= 90;
    const isLonValid = location.lon >= -180 && location.lon <= 180;

    if (!isLatValid || !isLonValid) {
      return res.status(400).json({
        error:
          "Latitude must be between -90/90 and Longitude between -180/180.",
      });
    }
  }

  next();
}

module.exports = { locationStrict, locationOptional };
