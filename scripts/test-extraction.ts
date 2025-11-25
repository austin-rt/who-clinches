import 'dotenv/config';
import dbConnectTest from '../lib/mongodb-test';
import { getESPNScoreboardTestData } from '../lib/models/test/ESPNScoreboardTestData';
import { extractTeamsFromScoreboard } from '../lib/reshape-teams-from-scoreboard';
import { sports } from '../lib/constants';

async function testExtraction() {
  await dbConnectTest();
  const Model = await getESPNScoreboardTestData();
  const doc = await Model.findOne({ season: 2025 }).sort({ week: 1 });
  
  if (!doc || !doc.response) {
    console.error('No test data found');
    process.exit(1);
  }

  const conferenceMeta = sports.cfb.conferences.sec;
  console.log('Conference meta:', JSON.stringify(conferenceMeta, null, 2));
  console.log('Expected espnId:', conferenceMeta.espnId, 'Type:', typeof conferenceMeta.espnId);
  
  const teams = extractTeamsFromScoreboard(doc.response, conferenceMeta);
  console.log(`\nExtracted ${teams.length} teams`);
  
  if (teams.length === 0) {
    console.log('\nChecking why no teams extracted...');
    const events = doc.response.events || [];
    console.log(`Total events: ${events.length}`);
    
    let totalCompetitors = 0;
    let teamsWithConferenceId = 0;
    let teamsMatching = 0;
    
    for (const event of events) {
      for (const competition of event.competitions || []) {
        for (const competitor of competition.competitors || []) {
          totalCompetitors++;
          const team = competitor.team;
          if (team && team.conferenceId) {
            teamsWithConferenceId++;
            const teamConfId = String(team.conferenceId);
            const expectedId = String(conferenceMeta.espnId);
            if (teamConfId === expectedId) {
              teamsMatching++;
              console.log(`  Match: ${team.abbreviation} (${team.id}) - confId: "${teamConfId}" (type: ${typeof team.conferenceId}), expected: "${expectedId}"`);
            } else {
              console.log(`  No match: ${team.abbreviation} (${team.id}) - confId: "${teamConfId}", expected: "${expectedId}"`);
            }
          }
        }
      }
    }
    
    console.log(`\nTotal competitors: ${totalCompetitors}`);
    console.log(`Teams with conferenceId: ${teamsWithConferenceId}`);
    console.log(`Teams matching SEC (8): ${teamsMatching}`);
  } else {
    teams.forEach(team => {
      console.log(`  - ${team.abbreviation} (${team._id})`);
    });
  }
  
  process.exit(0);
}

testExtraction().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

