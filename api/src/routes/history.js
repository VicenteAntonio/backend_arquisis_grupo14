const Router = require('koa-router');
const axios = require('axios');
const moment = require('moment');

const router = new Router();

async function findFixture(id) {
    try {
      const response = await axios.get(`${process.env.API_URL}/fixtures/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error finding fixture:', error);
    }
  }

async function getRequests() {
    try {
      const response = await axios.get(`${process.env.API_URL}/requests/list_all`, {
      });
      return response.data;
    } catch (error) {
      console.error('Error:', error);
    }
  }


router.post('history.', "/", async (ctx) => {
    try {
      await Promise.all(ctx.request.body.fixtures.map(async (history) => {
  
        const goals_home = history.goals.home;
        const goals_away = history.goals.away;
        const requests = await getRequests();
        const fixture = await findFixture();
        const matchingRequests = requests.filter(request => request.fixture_id === history.fixture.id);
        for (const request of matchingRequests) {
            const token = request.deposit_token;
            if (goals_home > goals_away && request.result == "Home") {
              try {
                const monto = 1000*request.amount*fixture.oddsHome
                // Aquí puedes usar await sin problemas
                const response = await axios.patch(`${process.env.API_URL}/users/${token}`, { amount: monto });
                console.log(response.data);
              } catch (error) {
                console.error('Error fetching requests:', error);
              }
            }
            if (goals_home < goals_away && request.result == "Away") {
                try {
                  const monto = 1000*request.amount*fixture.oddsAway
                  // Aquí puedes usar await sin problemas
                  const response = await axios.patch(`${process.env.API_URL}/users/${token}`, { amount: monto });
                  console.log(response.data);
                } catch (error) {
                  console.error('Error fetching requests:', error);
                }
              }

              if (goals_home == goals_away && request.result == "Draw") {
                try {
                  const monto = 1000*request.amount*fixture.oddsDraw
                  // Aquí puedes usar await sin problemas
                  const response = await axios.patch(`${process.env.API_URL}/users/${token}`, { amount: monto });
                  console.log(response.data);
                } catch (error) {
                  console.error('Error fetching requests:', error);
                }
              }
          }

        //si es que gana 

  
        await ctx.orm.Fixture.create(fixtureToAdd);
      }));
    
      ctx.status = 201;
    } catch (error) {
      ctx.body = { error: error.message };
      ctx.status = 400;
    }
  });

  module.exports = router;