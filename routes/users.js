var express = require("express");
var router = express.Router();
const { martingale } = require("../utils/martingale");

martingale.simulation();

// check epoch and wait for next one

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

module.exports = router;
