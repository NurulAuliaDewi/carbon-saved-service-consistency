// queries.js
module.exports = {
    getAllAthletes: `SELECT * FROM club_activities LIMIT $1 OFFSET $2`,
    getAthleteById: `SELECT * FROM club_activities WHERE id_athlete = $1`,
    searchAthleteByFirstName: `SELECT * FROM club_activities WHERE athlete_firstname ILIKE $1`
}
