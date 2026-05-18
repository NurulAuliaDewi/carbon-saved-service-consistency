var express = require('express');
var router = express.Router();
const athleteController = require('../controller/athleteController');

// GET athlete
router.get('/athlete', athleteController.getAthletes);
// GET athlete by id
router.get('/athlete/:id_athlete', athleteController.getAthleteById);
// Search athlete by firstname
router.get('/auto-athlete', athleteController.searchAthleteByFirstName);
// Get data by period
router.get('/total', athleteController.getDataByPeriod);
// Get data athlete by period
router.get('/total-athlete', athleteController.getDataAthleteByPeriod);
// Get available periods
router.get('/available-periods', athleteController.getAvailablePeriods);
// Get summary statistics by period (monthly / semesterly)
router.get('/summary-stats', athleteController.getSummaryStats);
router.get('/monthly-activity-frequency', athleteController.getMonthlyActivityFrequency);

module.exports = router;
