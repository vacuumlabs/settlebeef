# SettleBeef

On-chain wager / bet settlement protocol with social consensus. Gas-sponsored, account abstracted, yield generating collateral enabled protocol to end all Twitter beef. 🔥🧑‍⚖️

## Motivation

Off-chain disagreements have often been settled by sending funds to a trusted escrow who settles the disagreement.
SettleBeef allows such "beef" to be settled on-chain with the use of a proxy pattern smart contract without either party having to send funds to a middleman.
Using a smart contract over a middleman has many benefits, chief among them the fact that the funds are algorithmically secured in a smart contract and can generate yield via liquid staking. Oh, also the smart contract can't run with the money.
The disagreement is mediated by a panel of trusted arbiters that the "beefing" parties agree on beforehand.

# Setup dApp

Create `.env.local` from `.env.template` and fill with values.

Then just:

```
yarn
yarn dev
```
