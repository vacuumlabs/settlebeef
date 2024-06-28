import React from "react"
import { Paper, Stack, Typography } from "@mui/material"

export const AboutTabContent = () => {
  return (
    <Paper elevation={2}>
      <Stack p={4} gap={1}>
        <Typography variant="h5" sx={{ mt: 1 }}>
          What is Settlebeef?
        </Typography>
        <Typography variant="body1">
          Settlebeef is a platform where you can settle your disputes on chain by challenging those who disagree with
          you to lock up funds in an escrow that pays out to whoever is right about the outcome of the dispute in the
          end. Settlebeef uses a panel of arbiters to decide the outcome of a dispute. The panel of 3 arbiters is
          nominated by the initiator of the dispute (colloquially beef) and the challenger confirms their trust in the
          arbiters by locking up funds in the escrow. Ideally, the beefing parties should agree on the trustworthiness
          of the arbiters beforehand. The locked up amount can optionally be staked to earn ETH staking rewards. The
          protocol handles this automatically should the option be chosen.
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          How Do I Start Beef?
        </Typography>
        <Typography variant="body1">
          Before starting beef using Settlebeef, agree on a title and a set of arbiters with the person you&apos;re
          challenging. Then, create a new beef on the website using the &apos;New Beef&apos; button in the Beef List or
          My Beef List tab.
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          Inviting Challenger and Arbiters
        </Typography>
        <Typography variant="body1">
          When filling in the challenger and arbiter details in the new beef creation screen, you can use E-mail,
          Farcaster and X / Twitter as well as the traditional address / ENS name. If you choose to invite an arbiter or
          challenger using an E-mail address, Farcaster ID or X / Twitter handle we will automatically create a smart
          contract wallet for them and pay for their gas 🚀 <br />
          This is the most useful for arbiters, who can arbitrate over disputes without needing to have a funded crypto
          wallet already. If you&apos;re inviting a challenger via E-mail, Farcaster or X / Twitter, do note that they
          will have to deposit funds into the smart contract wallet we generate for them in order to accept your
          challenge.
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          Beef Staking
        </Typography>
        <Typography variant="body1">
          Beef can be staked on Settlebeef to earn standard ETH staking rewards while the dispute hasn&apos;t been
          settled. This is currently done by swapping the deposited ETH for wstETH in a Uniswap V2 Pool. We are in the
          process of upgrading to a more sophisticated order router for these swaps.
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          Beef Resolution and Rewards
        </Typography>
        <Typography variant="body1">
          When the deadline for your dispute passes, arbiters will have 30 days to submit their decision on the outcome.
          Afterwards, the winning party can withdraw the locked up amount and all the associated staking rewards (if
          any), save for fees.
        </Typography>
        <Typography variant="h5" sx={{ mt: 1 }}>
          Fees
        </Typography>
        <Typography variant="body1">
          Settlebeef takes a 1% fee from the total amount for protocol operation. Additionally, each correctly voting
          arbiter gets a 1% fee from the total amount to incentivise truthful reporting. In total, the fee charged from
          the total beef amount is 4% - 2% from each depositing party.
        </Typography>
      </Stack>
    </Paper>
  )
}
