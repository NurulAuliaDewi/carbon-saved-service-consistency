const db = require('../config/dbConnection');
const queries = require('./queries');

function handleError(res, err, customMessage = 'Server error') {
    console.error('Error executing query:', err);
    return res.status(500).json({
        status: 500,
        message: customMessage,
    });
}

module.exports.getAthletes = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    try {
        const result = await db.query(queries.getAllAthletes, [limit, offset]);
        res.status(200).json({
            status: 200,
            message: 'Success get all athlete activities',
            data: result.rows
        });
    } catch (error) {
        handleError(res, error);
    }
};

module.exports.getDataByPeriod = async (req, res) => {
    const { period, month, year, date } = req.query;
    
    const validPeriods = ['day', 'month', 'year'];
    if (!validPeriods.includes(period)) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid period. Please use "day", "month", or "year".'
        });
    }

    let sqlQuery;
    let queryParams = [];

    try {
        if (period === 'day') {
            if (date) {
                sqlQuery = `
                    SELECT 
                        SUM(distance) as total_distance,
                        SUM(moving_time) as total_time,
                        SUM(carbon_saving) as total_carbon_saving,
                        COUNT(*) as total_activity
                    FROM club_activities 
                    WHERE datetime::date = $1::date
                `;
                queryParams = [date];
            } else {
                sqlQuery = `
                    SELECT 
                        SUM(distance) as total_distance,
                        SUM(moving_time) as total_time,
                        SUM(carbon_saving) as total_carbon_saving,
                        COUNT(*) as total_activity
                    FROM club_activities 
                    WHERE DATE(datetime AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
                `;
            }
        } else if (period === 'month') {
            if (month && year) {
                sqlQuery = `
                    SELECT 
                        SUM(distance) as total_distance,
                        SUM(moving_time) as total_time,
                        SUM(carbon_saving) as total_carbon_saving,
                        COUNT(*) as total_activity
                    FROM club_activities 
                    WHERE EXTRACT(MONTH FROM datetime) = $1 
                    AND EXTRACT(YEAR FROM datetime) = $2
                `;
                queryParams = [month, year];
            } else {
                sqlQuery = `
                    SELECT 
                        SUM(distance) as total_distance,
                        SUM(moving_time) as total_time,
                        SUM(carbon_saving) as total_carbon_saving,
                        COUNT(*) as total_activity
                    FROM club_activities 
                    WHERE EXTRACT(MONTH FROM datetime) = 
                        EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    AND EXTRACT(YEAR FROM datetime) = 
                        EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                `;
            }
        } else if (period === 'year') {
            if (year) {
                sqlQuery = `
                    SELECT 
                        SUM(distance) as total_distance,
                        SUM(moving_time) as total_time,
                        SUM(carbon_saving) as total_carbon_saving,
                        COUNT(*) as total_activity
                    FROM club_activities 
                    WHERE EXTRACT(YEAR FROM datetime) = $1
                `;
                queryParams = [year];
            } else {
                sqlQuery = `
                    SELECT 
                        SUM(distance) as total_distance,
                        SUM(moving_time) as total_time,
                        SUM(carbon_saving) as total_carbon_saving,
                        COUNT(*) as total_activity
                    FROM club_activities 
                    WHERE EXTRACT(YEAR FROM datetime) = 
                        EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                `;
            }
        }

        console.log('Executing query:', sqlQuery);
        console.log('With parameters:', queryParams);

        const result = await db.query(sqlQuery, queryParams);
        
        res.status(200).json({
            status: 200,
            message: `Success get ${period} data`,
            data: result.rows,
            filters: { period, month, year, date }
        });

    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({
            status: 500,
            message: 'Server error',
            error: err.message
        });
    }
};
module.exports.getDataAthleteByPeriod = async (req, res) => {
    const { period, month, year, date } = req.query;
    
    const validPeriods = ['day', 'month', 'year'];
    if (!validPeriods.includes(period)) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid period. Please use "day", "month", or "year".'
        });
    }

    let sqlQuery;
    let queryParams = [];

    try {
        const baseQuery = `
            SELECT 
                id_athlete,
                athlete_firstname,
                athlete_lastname,
                SUM(distance) as total_distance,
                SUM(moving_time) as total_time,
                SUM(carbon_saving) as total_carbon_saving,
                COUNT(*) as total_activity
            FROM club_activities 
        `;

        if (period === 'day') {
            if (date) {
                sqlQuery = baseQuery + `
                    WHERE datetime::date = $1::date
                    GROUP BY id_athlete, athlete_firstname, athlete_lastname
                    ORDER BY total_carbon_saving DESC
                `;
                queryParams = [date];
            } else {
                // Gunakan solusi timezone yang sama seperti sebelumnya
                sqlQuery = baseQuery + `
                    WHERE DATE(datetime AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
                    GROUP BY id_athlete, athlete_firstname, athlete_lastname
                    ORDER BY total_carbon_saving DESC
                `;
            }
        } else if (period === 'month') {
            if (month && year) {
                sqlQuery = baseQuery + `
                    WHERE EXTRACT(MONTH FROM datetime) = $1 
                    AND EXTRACT(YEAR FROM datetime) = $2
                    GROUP BY id_athlete, athlete_firstname, athlete_lastname
                    ORDER BY total_carbon_saving DESC
                `;
                queryParams = [month, year];
            } else {
                sqlQuery = baseQuery + `
                    WHERE EXTRACT(MONTH FROM datetime) = 
                        EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    AND EXTRACT(YEAR FROM datetime) = 
                        EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    GROUP BY id_athlete, athlete_firstname, athlete_lastname
                    ORDER BY total_carbon_saving DESC
                `;
            }
        } else if (period === 'year') {
            if (year) {
                sqlQuery = baseQuery + `
                    WHERE EXTRACT(YEAR FROM datetime) = $1
                    GROUP BY id_athlete, athlete_firstname, athlete_lastname
                    ORDER BY total_carbon_saving DESC
                `;
                queryParams = [year];
            } else {
                sqlQuery = baseQuery + `
                    WHERE EXTRACT(YEAR FROM datetime) = 
                        EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    GROUP BY id_athlete, athlete_firstname, athlete_lastname
                    ORDER BY total_carbon_saving DESC
                `;
            }
        }

        console.log('Executing athlete query:', sqlQuery);
        console.log('With parameters:', queryParams);

        const result = await db.query(sqlQuery, queryParams);

        res.status(200).json({
            status: 200,
            message: `Success get ${period} athlete data`,
            data: result.rows,
            filters: { period, month, year, date }
        });

    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({
            status: 500,
            message: 'Server error',
            error: err.message
        });
    }
};
module.exports.getAvailablePeriods = async (req, res) => {
    try {
        const monthsQuery = `
            SELECT DISTINCT 
                EXTRACT(MONTH FROM datetime) as month,
                EXTRACT(YEAR FROM datetime) as year
            FROM club_activities 
            WHERE datetime IS NOT NULL
            ORDER BY year DESC, month DESC
        `;

        const yearsQuery = `
            SELECT DISTINCT EXTRACT(YEAR FROM datetime) as year
            FROM club_activities 
            WHERE datetime IS NOT NULL
            ORDER BY year DESC
        `;

        const [monthsResult, yearsResult] = await Promise.all([
            db.query(monthsQuery),
            db.query(yearsQuery)
        ]);

        const months = monthsResult.rows.map(row => ({
            month: parseInt(row.month),
            year: parseInt(row.year)
        }));

        const years = yearsResult.rows.map(row => parseInt(row.year));

        res.status(200).json({
            status: 200,
            message: 'Success get available periods',
            data: {
                months: months,
                years: years
            }
        });

        console.log('Available periods response:', { months, years });

    } catch (err) {
        handleError(res, err, 'Error getting available periods');
    }
};

module.exports.getAthleteById = async (req, res) => {
    const { id_athlete } = req.params;
    const { period, month, year, date } = req.query;

    let sqlQuery;
    let queryParams = [id_athlete];

    try {
        const baseQuery = `
            SELECT 
                id,
                id_athlete,
                athlete_firstname,
                athlete_lastname,
                activity_name,
                distance,
                moving_time,
                total_elevation_gain,
                carbon_saving,
                datetime,
                created_at
            FROM club_activities 
            WHERE id_athlete = $1
        `;

        if (!period) {
            sqlQuery = baseQuery + ` ORDER BY datetime DESC`;
        } else {
            const validPeriods = ['day', 'month', 'year'];
            if (!validPeriods.includes(period)) {
                return res.status(400).json({
                    status: 400,
                    message: 'Invalid period. Please use "day", "month", or "year".'
                });
            }

            if (period === 'day') {
                if (date) {
                    // Jika ada parameter date, gunakan date tersebut
                    sqlQuery = baseQuery + ` 
                        AND datetime::date = $2::date 
                        ORDER BY datetime DESC
                    `;
                    queryParams.push(date);
                } else {
                    // Karena datetime tersimpan dengan timezone +07, 
                    // kita perlu mengkonversi ke Jakarta timezone untuk perbandingan
                    sqlQuery = baseQuery + ` 
                        AND DATE(datetime AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
                        ORDER BY datetime DESC
                    `;
                }
            } else if (period === 'month') {
                if (month && year) {
                    sqlQuery = baseQuery + ` 
                        AND EXTRACT(MONTH FROM datetime) = $2 
                        AND EXTRACT(YEAR FROM datetime) = $3 
                        ORDER BY datetime DESC
                    `;
                    queryParams.push(month, year);
                } else {
                    sqlQuery = baseQuery + ` 
                        AND EXTRACT(MONTH FROM datetime) = 
                            EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                        AND EXTRACT(YEAR FROM datetime) = 
                            EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                        ORDER BY datetime DESC
                    `;
                }
            } else if (period === 'year') {
                if (year) {
                    sqlQuery = baseQuery + ` 
                        AND EXTRACT(YEAR FROM datetime) = $2 
                        ORDER BY datetime DESC
                    `;
                    queryParams.push(year);
                } else {
                    sqlQuery = baseQuery + ` 
                        AND EXTRACT(YEAR FROM datetime) = 
                            EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                        ORDER BY datetime DESC
                    `;
                }
            }
        }

        console.log('Executing athlete query:', sqlQuery);
        console.log('With parameters:', queryParams);

        const result = await db.query(sqlQuery, queryParams);
        
        if (result.rows.length === 0) {
            const message = period 
                ? `No activities found for athlete ${id_athlete} in the selected ${period}`
                : `Athlete ${id_athlete} not found`;
            
            return res.status(period ? 200 : 404).json({
                status: period ? 200 : 404,
                message: message,
                data: [],
                ...(period && { filters: { period, month, year, date } })
            });
        }

        const message = period 
            ? `Success get athlete ${id_athlete} activities for ${period}`
            : `Success get athlete with id ${id_athlete}`;

        res.status(200).json({
            status: 200,
            message: message,
            data: result.rows,
            ...(period && { filters: { period, month, year, date } })
        });

    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({
            status: 500,
            message: 'Server error',
            error: err.message
        });
    }
};

module.exports.getAthleteByIdWithPeriod = async (req, res) => {
    const { id_athlete } = req.params;
    const { period, month, year, date } = req.query;

    if (!period) {
        return module.exports.getAthleteById(req, res);
    }

    const validPeriods = ['day', 'month', 'year'];
    if (!validPeriods.includes(period)) {
        return res.status(400).json({
            status: 400,
            message: 'Invalid period. Please use "day", "month", or "year".'
        });
    }

    let sqlQuery;
    let queryParams = [id_athlete];

    try {
        const baseQuery = `
            SELECT 
                id,
                id_athlete,
                athlete_firstname,
                athlete_lastname,
                activity_name,
                distance,
                moving_time,
                total_elevation_gain,
                carbon_saving,
                datetime,
                created_at
            FROM club_activities 
            WHERE id_athlete = $1
        `;

        if (period === 'day') {
            if (date) {
                sqlQuery = baseQuery + ` 
                    AND datetime::date = $2::date 
                    ORDER BY datetime DESC
                `;
                queryParams.push(date);
            } else {
                sqlQuery = baseQuery + ` 
                    AND DATE(datetime AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
                    ORDER BY datetime DESC
                `;
            }
        } else if (period === 'month') {
            if (month && year) {
                sqlQuery = baseQuery + ` 
                    AND EXTRACT(MONTH FROM datetime) = $2 
                    AND EXTRACT(YEAR FROM datetime) = $3 
                    ORDER BY datetime DESC
                `;
                queryParams.push(month, year);
            } else {
                sqlQuery = baseQuery + ` 
                    AND EXTRACT(MONTH FROM datetime) = 
                        EXTRACT(MONTH FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    AND EXTRACT(YEAR FROM datetime) = 
                        EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    ORDER BY datetime DESC
                `;
            }
        } else if (period === 'year') {
            if (year) {
                sqlQuery = baseQuery + ` 
                    AND EXTRACT(YEAR FROM datetime) = $2 
                    ORDER BY datetime DESC
                `;
                queryParams.push(year);
            } else {
                sqlQuery = baseQuery + ` 
                    AND EXTRACT(YEAR FROM datetime) = 
                        EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')
                    ORDER BY datetime DESC
                `;
            }
        }

        console.log('Executing athlete activities query:', sqlQuery);
        console.log('With parameters:', queryParams);

        const result = await db.query(sqlQuery, queryParams);
        
        if (result.rows.length === 0) {
            return res.status(200).json({
                status: 200,
                message: `No activities found for athlete ${id_athlete} in the selected ${period}`,
                data: [],
                filters: { period, month, year, date }
            });
        }

        res.status(200).json({
            status: 200,
            message: `Success get athlete ${id_athlete} activities for ${period}`,
            data: result.rows,
            filters: { period, month, year, date }
        });

    } catch (err) {
        console.error('Error executing query:', err);
        res.status(500).json({
            status: 500,
            message: 'Server error',
            error: err.message
        });
    }
};
module.exports.searchAthleteByFirstName = async (req, res) => {
    const { term } = req.query;

    try {
        const result = await db.query(queries.searchAthleteByFirstName, [`%${term}%`]);
        res.json({
            status: 200,
            message: `Success search athlete by firstname`,
            data: result.rows
        });
    } catch (err) {
        handleError(res, err);
    }
};

module.exports.getSummaryStats = async (req, res) => {
    const { period, month, year, semester } = req.query;

    try {
        let query = `
            SELECT 
                COUNT(DISTINCT id_athlete) AS total_participants,
                COUNT(*) AS total_activities,
                SUM(distance) AS total_distance,
                SUM(moving_time) AS total_time,
                SUM(carbon_saving) AS total_carbon_saved
            FROM club_activities
        `;
        let whereClause = '';
        let params = [];

        if (period === 'month' && month && year) {
            whereClause = `WHERE EXTRACT(MONTH FROM datetime) = $1 AND EXTRACT(YEAR FROM datetime) = $2`;
            params = [month, year];
        } else if (period === 'semester' && year && semester) {
            const semesterMonths = semester === '1' ? [1, 2, 3, 4, 5, 6] : [7, 8, 9, 10, 11, 12];
            whereClause = `WHERE EXTRACT(MONTH FROM datetime) = ANY($1) AND EXTRACT(YEAR FROM datetime) = $2`;
            params = [semesterMonths, year];
        } else if (period === 'year' && year) {
            whereClause = `WHERE EXTRACT(YEAR FROM datetime) = $1`;
            params = [year];
        }

        const fullQuery = `${query} ${whereClause}`;
        const result = await db.query(fullQuery, params);
        
        const freqQuery = `
            SELECT 
                id_athlete,
                COUNT(DISTINCT DATE_TRUNC('week', datetime)) AS total_weeks,
                COUNT(*) AS total_rides
            FROM club_activities
            ${whereClause}
            GROUP BY id_athlete
        `;
        const freqResult = await db.query(freqQuery, params);

        let frequencyStats = {
            "1_day": 0,
            "2_to_3_days": 0,
            "4_to_6_days": 0,
            "every_day": 0
        };

        freqResult.rows.forEach(row => {
            const ridesPerWeek = row.total_rides / row.total_weeks;
            if (ridesPerWeek >= 0.9 && ridesPerWeek <= 1.1) frequencyStats["1_day"]++;
            else if (ridesPerWeek > 1.1 && ridesPerWeek <= 3.5) frequencyStats["2_to_3_days"]++;
            else if (ridesPerWeek >= 4 && ridesPerWeek < 7) frequencyStats["4_to_6_days"]++;
            else frequencyStats["every_day"]++;
        });
                
        res.status(200).json({
            status: 200,
            message: 'Success get summary statistics',
            data: {
                ...result.rows[0],
                frequency_stats: frequencyStats
            },
            filters: { period, month, year, semester }
        });
    } catch (err) {
        console.error('Error executing summary query:', err);
        res.status(500).json({
            status: 500,
            message: 'Server error',
            error: err.message
        });
    }
};

module.exports.getMonthlyActivityFrequency = async (req, res) => {
    const { month, year, start_date, end_date } = req.query;
 
    // ── Build WHERE clause depending on filter mode ──
    let whereClause;
    let queryParams;
    let filterMeta;
 
    const useRange = start_date && end_date;
 
    if (useRange) {
        // Custom date range: datetime >= start_date AND datetime < end_date + 1 day
        whereClause = `
            datetime >= $1::date
            AND datetime < ($2::date + INTERVAL '1 day')
            AND EXTRACT(DOW FROM datetime) BETWEEN 1 AND 5
        `;
        queryParams = [start_date, end_date];
        filterMeta  = { start_date, end_date };
    } else {
        // Classic month + year filter (backward compatible)
        whereClause = `
            EXTRACT(MONTH FROM datetime) = $1
            AND EXTRACT(YEAR FROM datetime) = $2
            AND EXTRACT(DOW FROM datetime) BETWEEN 1 AND 5
        `;
        queryParams = [month, year];
        filterMeta  = { month, year };
    }
 
    try {
        const athleteQuery = `
            SELECT 
                id_athlete,
                athlete_firstname,
                athlete_lastname,
                COUNT(DISTINCT DATE_TRUNC('day', datetime)) AS active_days,
                SUM(distance) AS total_distance
            FROM club_activities
            WHERE ${whereClause}
            GROUP BY id_athlete, athlete_firstname, athlete_lastname
            ORDER BY active_days DESC, total_distance DESC
        `;
 
        const freqQuery = `
            WITH athlete_days AS (
                SELECT 
                    id_athlete,
                    COUNT(DISTINCT DATE_TRUNC('day', datetime)) AS active_days
                FROM club_activities
                WHERE ${whereClause}
                GROUP BY id_athlete
            )
            SELECT
                COUNT(CASE WHEN active_days BETWEEN 1 AND 4  THEN 1 END) AS "1_to_4_days",
                COUNT(CASE WHEN active_days BETWEEN 5 AND 9  THEN 1 END) AS "5_to_9_days",
                COUNT(CASE WHEN active_days BETWEEN 10 AND 14 THEN 1 END) AS "10_to_14_days",
                COUNT(CASE WHEN active_days BETWEEN 15 AND 19 THEN 1 END) AS "15_to_19_days",
                COUNT(CASE WHEN active_days >= 20            THEN 1 END) AS "20_plus_days"
            FROM athlete_days
        `;
 
        const [athleteResult, freqResult] = await Promise.all([
            db.query(athleteQuery, queryParams),
            db.query(freqQuery,    queryParams)
        ]);
 
        res.status(200).json({
            status:  200,
            message: 'Success get monthly activity frequency',
            data: {
                athletes:               athleteResult.rows,
                frequency_distribution: freqResult.rows[0]
            },
            filters: filterMeta
        });
 
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({
            status:  500,
            message: 'Server error',
            error:   err.message
        });
    }
};