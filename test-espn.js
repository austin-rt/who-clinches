/**
 * Simple test script to validate ESPN API integration
 * Run with: node test-espn.js
 */

const fetch = require("node-fetch");

async function testESPNAPI() {
  console.log("🏈 Testing ESPN API Integration...\n");

  try {
    // Test SEC scoreboard endpoint
    const url =
      "http://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?groups=8";
    console.log(`📡 Fetching: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ Response received successfully`);
    console.log(`📊 Events found: ${data.events?.length || 0}`);
    console.log(`📅 Season: ${data.season?.year}`);
    console.log(`🗓️  Week: ${data.week?.number}`);

    if (data.events && data.events.length > 0) {
      const firstGame = data.events[0];
      const competition = firstGame.competitions[0];

      console.log("\n🎮 Sample Game:");
      console.log(`   ID: ${firstGame.id}`);
      console.log(`   Date: ${competition.date}`);
      console.log(`   Conference Game: ${competition.conferenceCompetition}`);
      console.log(`   Status: ${competition.status.type.state}`);
      console.log(`   Completed: ${competition.status.type.completed}`);

      if (competition.competitors && competition.competitors.length >= 2) {
        const away = competition.competitors[0];
        const home = competition.competitors[1];

        console.log(`   Away: ${away.team.abbreviation} (${away.score || 0})`);
        console.log(`   Home: ${home.team.abbreviation} (${home.score || 0})`);
      }
    }

    console.log("\n🎉 ESPN API test completed successfully!");
  } catch (error) {
    console.error("❌ ESPN API test failed:", error.message);
    process.exit(1);
  }
}

// Run the test
testESPNAPI();
