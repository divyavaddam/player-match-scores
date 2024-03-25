const express = require("express");
const app = express();
app.use(express.json());
module.exports = app;
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertPlayerDetailsTableDBObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};
const convertMatchDetailsTableDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
//GET PLAYERS API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      *
    FROM 
      player_details 
    ORDER BY 
      player_id;
    `;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((item) =>
      convertPlayerDetailsTableDBObjectToResponseObject(item)
    )
  );
});
//GET PLAYER API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
      *
    FROM 
      player_details
    WHERE 
      player_id=${playerId};

    `;
  const player = await db.get(getPlayerQuery);
  response.send(convertPlayerDetailsTableDBObjectToResponseObject(player));
});
//UPDATE PLAYER API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayerQuery = `
      UPDATE 
        player_details
      SET
        player_name='${playerName}'
      WHERE 
        player_id=${playerId};
    `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});
//GET MATCH API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT 
      *
    FROM 
      match_details
    WHERE 
      match_id=${matchId};

    `;
  const match = await db.get(getMatchQuery);
  response.send(convertMatchDetailsTableDbObjectToResponseObject(match));
});
//GET MATCHES API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchQuery = `
    SELECT 
      match_details.match_id,
      match_details.match,
      match_details.year
    FROM 
      match_details NATURAL JOIN player_match_score 
    WHERE player_match_score.player_id=${playerId};
    
    `;
  const matchArray = await db.all(getMatchQuery);
  response.send(
    matchArray.map((item) =>
      convertMatchDetailsTableDbObjectToResponseObject(item)
    )
  );
});
//GET PLAYERS OF A SPECIFIC MATCH API
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersQuery = `
    SELECT 
      player_details.player_id,
      player_details.player_name
    FROM 
      player_details NATURAL JOIN player_match_score 
    WHERE player_match_score.match_id=${matchId};
    
    `;
  const matchArray = await db.all(getPlayersQuery);
  response.send(
    matchArray.map((item) =>
      convertPlayerDetailsTableDBObjectToResponseObject(item)
    )
  );
});
// GET STATISTICS API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatisticsQuery = `
    SELECT 
      player_details.player_id AS playerId,
      player_details.player_name AS playerName,
      SUM(player_match_score.score) AS totalScore,
      SUM(player_match_score.fours) AS totalFours,
      SUM(player_match_score.sixes) AS totalSixes

    FROM 
      player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    
    `;
  const matchArray = await db.get(getStatisticsQuery);
  response.send(matchArray);
});
