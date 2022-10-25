const fs = require("fs");

let amount = 0.2;
let initial_balance = 0.2;
let initial_bet = 0.003;
let bet = initial_bet;
let percentage_bet = (bet / amount) * 100;
let odd = 1.01;
let goal = 1;
let payout = bet * odd;
let rounds_to_win = goal / payout;
let winning_percentage = 0.25;
let total_rounds = goal / payout / winning_percentage;
let fee = 0.000461;
let data = "";

// calculate max rounds
let max_rounds;
let balance = amount;
let other_bet = bet;
let max_riched = false;

const martingale = {
  simulation: () => {
    for (let i = 0; i < 10; i++) {
      balance = balance - other_bet;
      if (balance > 0) {
        // console.log(`
        //     bet: ${other_bet}
        //     balance: ${balance}
        //     `);
      }
      other_bet = other_bet * 2;
      if (balance < 0 && max_riched === false) {
        max_rounds = i;
        max_riched = true;
      }
    }

    let won = 1;
    let lost = 1;
    let rate;

    // let simulate total rounds
    for (let i = 0; i < total_rounds; i++) {
      // calculate if winning or loosing based on winning_percentage
      rate = won / lost;
      data += `
            ------------------------
            Rate: ${rate}
            Winning percentage: ${winning_percentage}
            Balance amount: ${amount}
            `;
      if (amount >= goal) {
        // console.log("Goal reached");
        break;
      }
      if (rate > winning_percentage) {
        // lost
        // take out bet from amount
        amount = amount - bet;
        data += `
              LOST
              Bet: ${bet}
              amount in wallet: ${amount}
              Next bet: ${bet * 2}
              `;
        // double down the bet
        bet = bet * 2;
        lost++;
      } else {
        // won
        // add payout to amount
        amount = amount + bet * odd;
        data += `
              WON
              Bet: ${bet}
              amount in wallet: ${amount}
              Next bet: ${bet}
              `;
        // put bet to initial bet
        bet = initial_bet;
        won++;
      }
    }
    total_rounds = won + lost;

    data += `
        Amount: ${amount}
        Max rounds before bankrupt: ${max_rounds}
        Bet percentage: ${percentage_bet}
        Bet odds: ${odd}
        Goal: ${goal}
        Rounds to win: ${rounds_to_win}
        Winning percentage: ${winning_percentage}
        Rate: ${rate}
        Won: ${won}
        Lost: ${lost}
        Total rounds: ${total_rounds}
        Time to reach goal: ${(total_rounds * 5) / 60 / 24} days
          `;
    console.log(`
        Initial bet: ${initial_bet}
        Initial balance: ${initial_balance}
        Amount: ${amount}
        Max rounds before bankrupt: ${max_rounds}
        Bet percentage: ${percentage_bet}
        Bet odds: ${odd}
        Goal: ${goal}
        Rounds to win: ${rounds_to_win}
        Winning percentage: ${winning_percentage}
        Rate: ${rate}
        Won: ${won}
        Lost: ${lost}
        Total rounds: ${total_rounds}
        Time to reach goal: ${(total_rounds * 5) / 60 / 24} days
    `);
    fs.writeFile("sim-rounds.txt", data, () =>
      console.log("sim rounds written in txt file")
    );
  },
};

module.exports = {
  martingale,
};
