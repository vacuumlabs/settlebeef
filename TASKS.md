# General

Review FE code
Review Smart Contracts
Improve the Staking mechanism to be more robust (currently it uses one uniswap v2 pool)

# Frontend

Make mutations update the app state properly (most likely by using queries)
Refactor & cleanup `BeefControls`, mainly to always display only 1 button
Refactor the step counter in `beef/[id]/page` to be more readable
Add more robust linting rules
Support Linking Twitter to Address
ENS Support in challenger name
"Challenger didn't join" shows even if join deadline hasn't expired

# Smart Contracts

Implement Fee Collection (% of wager for the protocol, % of wager for the arbiters)
Implement Arbitrary Arbiter Amount
Support for beef with incomplete votes to be decided if quorum is reached

# Backend

Implement a backend that indexes necessary data so we aren't reading everything from contract / logs
