const Router = require('koa-router');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const moment = require('moment-timezone');
const { where } = require('sequelize');
const { isAdmin, verifyToken } = require('../../utils/authorization');

const router = new Router();

async function findFixture(request, ctx) {
  try {
    const Fixture = await ctx.orm.Fixture.findOne({
      where: {
        fixtureId: request.fixture_id,
      },
    });

    if (!Fixture) {
      ctx.body = { error: 'Fixture not found' };
      ctx.status = 404;
      return;
    }

    return Fixture;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
}

router.post('proposals.create', '/', isAdmin, async (ctx) => {
  try {
    const { groupId, auctionId } = ctx.request.body;

    const auction = await ctx.orm.Auction.findOne({
      where: { auctionId },
    });

    if (!auction) {
      ctx.body = { error: 'Auction not found' };
      ctx.status = 404;
      return;
    }

    if (groupId !== 14 && auction.groupId !== 14) {
      ctx.body = { error: 'Proposal is not from group 14 or auction is not from group 14' };
      ctx.status = 400;
      return;
    }

    const proposal = await ctx.orm.Proposal.create(ctx.request.body);

    if (groupId === 14) {
      const Fixture = await findFixture(proposal, ctx);
      const bonusQuantity = Fixture.bonusQuantity - proposal.quantity;
      await Fixture.update({ bonusQuantity });
    }
    ctx.body = proposal;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.post('proposals.submit', '/submit', isAdmin, async (ctx) => {
  try {
    const proposalData = ctx.request.body;
    const proposal = {
      proposalId: uuidv4(),
      type: 'proposal',
      ...proposalData,
    };
    await axios.post(process.env.AUCTION_PROPOSAL_URL, proposal);
    ctx.body = proposal;
    ctx.status = 201;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

router.get('proposals.list', '/', async (ctx) => {
  try {
    const proposals = await ctx.orm.Proposal.findAll();
    ctx.body = proposals;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

router.get('proposals.show', '/:proposalId', isAdmin, async (ctx) => {
  try {
    const proposal = await ctx.orm.Proposal.findOne({
      where: { proposalId: ctx.params.proposalId },
    });
    if (!proposal) {
      ctx.body = { error: 'Proposal not found' };
      ctx.status = 404;
      return;
    }
    ctx.body = proposal;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

router.get('proposals.listByAuction', '/auction/:auctionId', isAdmin, async (ctx) => {
  try {
    const proposals = await ctx.orm.Proposal.findAll({
      where: { auctionId: ctx.params.auctionId },
    });
    ctx.body = proposals;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
});

router.post('proposals.submitResponse', '/submitResponse', isAdmin, async (ctx) => {
  try {
    const response = ctx.request.body;
    await axios.post(process.env.AUCTION_PROPOSAL_URL, response);
    ctx.body = response;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

async function updateFixturesAvailability(auction, proposal, ctx) {
  try {
    const auctionFixture = await findFixture(auction, ctx);
    const proposalFixture = await findFixture(proposal, ctx);

    if (auction.groupId === 14) {
      const updatedProposalQuantity = proposalFixture.bonusQuantity + proposal.quantity;
      await proposalFixture.update({ bonusQuantity: updatedProposalQuantity });
    } else if (proposal.groupId === 14) {
      const updatedAuctionQuantity = auctionFixture.bonusQuantity + auction.quantity;
      await auctionFixture.update({ bonusQuantity: updatedAuctionQuantity });
    }
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 500;
  }
}

async function deleteProposals(auction, ctx) {
  const proposals = await ctx.orm.Proposal.findAll({
    where: { auctionId: auction.auctionId },
  });
  for (const proposal of proposals) {
    await proposal.destroy();
  }
}

async function updatebonusQuantityQuantityAfterRejection(auction, ctx) {
  const proposals = await ctx.orm.Proposal.findAll({
    where: { auctionId: auction.auctionId },
  });

  for (const proposal of proposals) {
    const Fixture = await findFixture(proposal, ctx);
    const updatedbonusQuantity = Fixture.bonusQuantity + proposal.quantity;
    await Fixture.update({ bonusQuantity: updatedbonusQuantity });
  }
}

async function handleProposalAcceptance(response, auction, ctx) {
  try {
    const auctionGroup = auction.groupId;

    const proposal = await ctx.orm.Proposal.findOne({
      where: { proposalId: response.proposalId },
    });

    // Aceptamos la propuesta de otro grupo
    if (auctionGroup === 14) {
      await updateFixturesAvailability(auction, proposal, ctx);
      await deleteProposals(auction, ctx);
      await auction.destroy();

      return;
    }

    // Otro grupo acepta nuestra propuesta
    if (proposal) {
      await updateFixturesAvailability(auction, proposal, ctx);
      await deleteProposals(auction, ctx);
      await auction.destroy();
      return;
    }

    // Otro grupo acepta otra propuesta (no nuestra)
    await updatebonusQuantityQuantityAfterRejection(auction, ctx);
    await deleteProposals(auction, ctx);
    await auction.destroy();
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
}

async function handleProposalRejection(response, ctx) {
  const proposal = await ctx.orm.Proposal.findOne({
    where: { proposalId: response.proposalId },
  });

  if (proposal) {
    const Fixture = await findFixture(proposal, ctx);
    const updatedbonusQuantity = Fixture.bonusQuantity + proposal.quantity;
    await Fixture.update({ bonusQuantity: updatedbonusQuantity });
    await proposal.destroy();
  }
}

router.post('proposals.handleResponse', '/handleResponse', async (ctx) => {
  try {
    const response = ctx.request.body;
    const auction = await ctx.orm.Auction.findOne({
      where: { auctionId: response.auctionId },
    });
    if (!auction) {
      ctx.body = { error: 'Auction not found' };
      ctx.status = 404;
      return;
    }

    if (response.type === 'acceptance') {
      await handleProposalAcceptance(response, auction, ctx);
    } else if (response.type === 'rejection') {
      await handleProposalRejection(response, ctx);
    }

    ctx.body = response;
    ctx.status = 200;
  } catch (error) {
    ctx.body = { error: error.message };
    ctx.status = 400;
  }
});

module.exports = router;