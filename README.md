# Prediction game variables and conditions

Predict whether BNB or CAKE price will rise or fall

Time = every 5 mins

amount = the amount you start with = 0.2

initial bet = 0.003

payout = 1.01 min most likely it's above 1.5

odds = 50% if toss coin but it looks like green it's more likely to come out

# Procedure

## Martingale

### Simulation

###### you can go and check in /utils/martingale

```
Initial bet: 0.003
Initial balance: 0.2
Amount: 1.0001599999999882
Max rounds before bankrupt: 6
Bet percentage: 1.5
Bet odds: 1.01
Goal: 1
Rounds to win: 330.03300330033
Winning percentage: 0.25
Rate: 0.2510869565217391
Won: 231
Lost: 920
Total rounds: 1151
Time to reach goal: 3.996527777777778 days
```

#### example

next epoch = 114836 = n

bet up (green) @1.5x

locked price = closed price of epoch 114835 = n-1

- what if we just bet on green everytime? => we don't care about closed price etc

- how do we check if we got it right and set next bet? => check a few seconds before it ends and bet on next one

TODO:

- simulation
  - finish counts
- frontend
  - DOING: write tests (simulation => don't placeBet)
    - connect metamask button and show address, chain, balance
    - show current epoch, last 3 epochs
      - each epoch has locked price, current price, closed price, payout up, payou down, prize pool
    - show next epoch bet amount
    - start bot
      - when epoch changes place first bet
      - check bet result and set next bet (this is has to be a few seconds before 5 minutes)
      - write down logs each time: if won/lost, amount bet, balance, epoch(send them to backend?) - check them with sim-rounds.txt
- if tests are ok put in production to run production tests @.../prediction-bot
- if prod tests are ok go production-stable

NOTES:

- there is a delay of 15 seconds when epoch closes before we get new epoch
