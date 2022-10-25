import React, { useEffect } from "react";

import Web3 from "web3";

var interval;

var timer;

var priceTimer;

var all_rounds = [];

var round_data = {
  epoch: 0,
  result: "won",
  lockPrice: 0,
  closePrice: 0,
  begPrice: 0,
  endPrice: 0,
  bet: 0,
  balance: 0,
  round: 0,
};

export default function PredictionBot() {
  const [account, setAccount] = React.useState();
  const [balance, setBalance] = React.useState();
  const [chain_id, setChain_id] = React.useState();
  const [web3, setWeb3] = React.useState();
  const [currentEpoch, setCurrentEpoch] = React.useState();
  const [predictionContract, setPredictionContract] = React.useState();
  const [oracleContract, setOracleContract] = React.useState();
  const [n, setN] = React.useState(0);
  const [priceNow, setPriceNow] = React.useState();
  const [prevPrice, setPrevPrice] = React.useState();
  const [lastRoundWon, setLastRoundWon] = React.useState(true);
  const [initialBet, setInitialBet] = React.useState("0.003");
  const [currentBet, setCurrentBet] = React.useState("0.003");
  const [round, setRound] = React.useState(0);
  const [prevRound, setPrevRound] = React.useState(0);
  const [begPrice, setBegPrice] = React.useState();
  const [endPrice, setEndPrice] = React.useState();
  const [latestPrice, setLatestPrice] = React.useState();
  const [allRounds, setAllRounds] = React.useState([]);

  let time = 270000; // 4mins 30secs

  const connectMetamask = async () => {
    if (typeof window.ethereum !== "undefined") {
      let web3 = new Web3(Web3.givenProvider);
      setWeb3(web3);
      let account = await web3.eth.getAccounts();
      let balance = await web3.eth.getBalance(account[0]);
      let chain_id = await web3.eth.net.getId();
      setAccount(account[0]);
      setBalance(balance);
      setChain_id(chain_id);
      loadPCSPredictionContract();
      loadOraclePriceContract();
    }
  };

  // function to check price after time
  const startPriceTimer = () => {
    priceTimer = setTimeout(async () => {
      console.log("New price BNB after timeout");
      let price = await oracleContract.methods.latestAnswer().call();
      setEndPrice(price);
      round_data.endPrice = price;
      console.log(`
      Price now: ${price}
      Prev price: ${begPrice}
      Price difference: ${price - begPrice > 0 ? "won" : "lost"}
      `);
      if (price - begPrice > 0) {
        setLastRoundWon(true);
        setCurrentBet(initialBet);
      } else {
        setLastRoundWon(false);
        setCurrentBet(currentBet * 2);
      }
      round_data.result = lastRoundWon ? "won" : "lost";
    }, time);
  };

  const checkEpoch = async () => {
    let epoch;
    timer = setInterval(async () => {
      epoch = await predictionContract.methods.currentEpoch().call();
      console.log(`
      Prev epoch: ${currentEpoch}
      Epoch: ${epoch}
      `);
      if (currentEpoch < epoch) {
        // store BNB price to be checked again after 4 mins ~35 secs
        // get price from oracle contract https://bscscan.com/address/0xd276fcf34d54a926773c399ebaa772c12ec394ac#readContract

        // setPrevPrice(450) // set price at the beginning of the round
        // startPriceTimer() // price in 4m 35s
        // let bet = web3.utils.toWei(initialBet) // set bet to initialBet in wei
        addRound();
        clearInterval(timer); // clear checkEpoch timer
        setCurrentEpoch(epoch); // set current epoch
        // predictionBot(bet) // start prediction bot
      }
    }, 500);
  };

  const loadPCSPredictionContract = async () => {
    // add contract ABI
    let ABI = [
      {
        inputs: [
          { internalType: "address", name: "_oracleAddress", type: "address" },
          { internalType: "address", name: "_adminAddress", type: "address" },
          {
            internalType: "address",
            name: "_operatorAddress",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "_intervalSeconds",
            type: "uint256",
          },
          { internalType: "uint256", name: "_bufferSeconds", type: "uint256" },
          { internalType: "uint256", name: "_minBetAmount", type: "uint256" },
          {
            internalType: "uint256",
            name: "_oracleUpdateAllowance",
            type: "uint256",
          },
          { internalType: "uint256", name: "_treasuryFee", type: "uint256" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "BetBear",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "BetBull",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "sender",
            type: "address",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "Claim",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "roundId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "int256",
            name: "price",
            type: "int256",
          },
        ],
        name: "EndRound",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "roundId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "int256",
            name: "price",
            type: "int256",
          },
        ],
        name: "LockRound",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "admin",
            type: "address",
          },
        ],
        name: "NewAdminAddress",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "bufferSeconds",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "intervalSeconds",
            type: "uint256",
          },
        ],
        name: "NewBufferAndIntervalSeconds",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "minBetAmount",
            type: "uint256",
          },
        ],
        name: "NewMinBetAmount",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "operator",
            type: "address",
          },
        ],
        name: "NewOperatorAddress",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "oracle",
            type: "address",
          },
        ],
        name: "NewOracle",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "oracleUpdateAllowance",
            type: "uint256",
          },
        ],
        name: "NewOracleUpdateAllowance",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "treasuryFee",
            type: "uint256",
          },
        ],
        name: "NewTreasuryFee",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "previousOwner",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "newOwner",
            type: "address",
          },
        ],
        name: "OwnershipTransferred",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
        ],
        name: "Pause",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "Paused",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "rewardBaseCalAmount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "rewardAmount",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "treasuryAmount",
            type: "uint256",
          },
        ],
        name: "RewardsCalculated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
        ],
        name: "StartRound",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "token",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "TokenRecovery",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "uint256",
            name: "amount",
            type: "uint256",
          },
        ],
        name: "TreasuryClaim",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "epoch",
            type: "uint256",
          },
        ],
        name: "Unpause",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "account",
            type: "address",
          },
        ],
        name: "Unpaused",
        type: "event",
      },
      {
        inputs: [],
        name: "MAX_TREASURY_FEE",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "adminAddress",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "epoch", type: "uint256" }],
        name: "betBear",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "epoch", type: "uint256" }],
        name: "betBull",
        outputs: [],
        stateMutability: "payable",
        type: "function",
      },
      {
        inputs: [],
        name: "bufferSeconds",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256[]", name: "epochs", type: "uint256[]" },
        ],
        name: "claim",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "claimTreasury",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "epoch", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
        ],
        name: "claimable",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "currentEpoch",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "executeRound",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "genesisLockOnce",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "genesisLockRound",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "genesisStartOnce",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "genesisStartRound",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "cursor", type: "uint256" },
          { internalType: "uint256", name: "size", type: "uint256" },
        ],
        name: "getUserRounds",
        outputs: [
          { internalType: "uint256[]", name: "", type: "uint256[]" },
          {
            components: [
              {
                internalType: "enum PancakePredictionV2.Position",
                name: "position",
                type: "uint8",
              },
              { internalType: "uint256", name: "amount", type: "uint256" },
              { internalType: "bool", name: "claimed", type: "bool" },
            ],
            internalType: "struct PancakePredictionV2.BetInfo[]",
            name: "",
            type: "tuple[]",
          },
          { internalType: "uint256", name: "", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "user", type: "address" }],
        name: "getUserRoundsLength",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "intervalSeconds",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "", type: "uint256" },
          { internalType: "address", name: "", type: "address" },
        ],
        name: "ledger",
        outputs: [
          {
            internalType: "enum PancakePredictionV2.Position",
            name: "position",
            type: "uint8",
          },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "bool", name: "claimed", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "minBetAmount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "operatorAddress",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "oracle",
        outputs: [
          {
            internalType: "contract AggregatorV3Interface",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "oracleLatestRoundId",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "oracleUpdateAllowance",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "pause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "paused",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "_token", type: "address" },
          { internalType: "uint256", name: "_amount", type: "uint256" },
        ],
        name: "recoverToken",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "epoch", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
        ],
        name: "refundable",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        name: "rounds",
        outputs: [
          { internalType: "uint256", name: "epoch", type: "uint256" },
          { internalType: "uint256", name: "startTimestamp", type: "uint256" },
          { internalType: "uint256", name: "lockTimestamp", type: "uint256" },
          { internalType: "uint256", name: "closeTimestamp", type: "uint256" },
          { internalType: "int256", name: "lockPrice", type: "int256" },
          { internalType: "int256", name: "closePrice", type: "int256" },
          { internalType: "uint256", name: "lockOracleId", type: "uint256" },
          { internalType: "uint256", name: "closeOracleId", type: "uint256" },
          { internalType: "uint256", name: "totalAmount", type: "uint256" },
          { internalType: "uint256", name: "bullAmount", type: "uint256" },
          { internalType: "uint256", name: "bearAmount", type: "uint256" },
          {
            internalType: "uint256",
            name: "rewardBaseCalAmount",
            type: "uint256",
          },
          { internalType: "uint256", name: "rewardAmount", type: "uint256" },
          { internalType: "bool", name: "oracleCalled", type: "bool" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "_adminAddress", type: "address" },
        ],
        name: "setAdmin",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "_bufferSeconds", type: "uint256" },
          {
            internalType: "uint256",
            name: "_intervalSeconds",
            type: "uint256",
          },
        ],
        name: "setBufferAndIntervalSeconds",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "_minBetAmount", type: "uint256" },
        ],
        name: "setMinBetAmount",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "_operatorAddress",
            type: "address",
          },
        ],
        name: "setOperator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "_oracle", type: "address" }],
        name: "setOracle",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "_oracleUpdateAllowance",
            type: "uint256",
          },
        ],
        name: "setOracleUpdateAllowance",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "_treasuryFee", type: "uint256" },
        ],
        name: "setTreasuryFee",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "newOwner", type: "address" },
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "treasuryAmount",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "treasuryFee",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "unpause",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "", type: "address" },
          { internalType: "uint256", name: "", type: "uint256" },
        ],
        name: "userRounds",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ];
    let prediction_address = "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA";
    let web3 = new Web3(Web3.givenProvider);
    let prediction_contract = new web3.eth.Contract(ABI, prediction_address);
    setPredictionContract(prediction_contract);
    let epoch = await prediction_contract.methods.currentEpoch().call();
    setCurrentEpoch(epoch);
  };

  const placeBet = async (bet) => {
    // add contract ABI
    // let ABI = [{"inputs":[{"internalType":"address","name":"_oracleAddress","type":"address"},{"internalType":"address","name":"_adminAddress","type":"address"},{"internalType":"address","name":"_operatorAddress","type":"address"},{"internalType":"uint256","name":"_intervalSeconds","type":"uint256"},{"internalType":"uint256","name":"_bufferSeconds","type":"uint256"},{"internalType":"uint256","name":"_minBetAmount","type":"uint256"},{"internalType":"uint256","name":"_oracleUpdateAllowance","type":"uint256"},{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetBear","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"BetBull","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"sender","type":"address"},{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"Claim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"int256","name":"price","type":"int256"}],"name":"EndRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":true,"internalType":"uint256","name":"roundId","type":"uint256"},{"indexed":false,"internalType":"int256","name":"price","type":"int256"}],"name":"LockRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"admin","type":"address"}],"name":"NewAdminAddress","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"bufferSeconds","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"intervalSeconds","type":"uint256"}],"name":"NewBufferAndIntervalSeconds","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"minBetAmount","type":"uint256"}],"name":"NewMinBetAmount","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"operator","type":"address"}],"name":"NewOperatorAddress","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"oracle","type":"address"}],"name":"NewOracle","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"oracleUpdateAllowance","type":"uint256"}],"name":"NewOracleUpdateAllowance","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"treasuryFee","type":"uint256"}],"name":"NewTreasuryFee","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"Pause","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rewardBaseCalAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"treasuryAmount","type":"uint256"}],"name":"RewardsCalculated","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"StartRound","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"token","type":"address"},{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TokenRecovery","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"amount","type":"uint256"}],"name":"TreasuryClaim","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"Unpause","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"MAX_TREASURY_FEE","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"adminAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"betBear","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"}],"name":"betBull","outputs":[],"stateMutability":"payable","type":"function"},{"inputs":[],"name":"bufferSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256[]","name":"epochs","type":"uint256[]"}],"name":"claim","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"claimTreasury","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"address","name":"user","type":"address"}],"name":"claimable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"currentEpoch","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"executeRound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"genesisLockOnce","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"genesisLockRound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"genesisStartOnce","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"genesisStartRound","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"},{"internalType":"uint256","name":"cursor","type":"uint256"},{"internalType":"uint256","name":"size","type":"uint256"}],"name":"getUserRounds","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"},{"components":[{"internalType":"enum PancakePredictionV2.Position","name":"position","type":"uint8"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"}],"internalType":"struct PancakePredictionV2.BetInfo[]","name":"","type":"tuple[]"},{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getUserRoundsLength","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"intervalSeconds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"address","name":"","type":"address"}],"name":"ledger","outputs":[{"internalType":"enum PancakePredictionV2.Position","name":"position","type":"uint8"},{"internalType":"uint256","name":"amount","type":"uint256"},{"internalType":"bool","name":"claimed","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"minBetAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"operatorAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracle","outputs":[{"internalType":"contract AggregatorV3Interface","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracleLatestRoundId","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"oracleUpdateAllowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"pause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_token","type":"address"},{"internalType":"uint256","name":"_amount","type":"uint256"}],"name":"recoverToken","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"address","name":"user","type":"address"}],"name":"refundable","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"rounds","outputs":[{"internalType":"uint256","name":"epoch","type":"uint256"},{"internalType":"uint256","name":"startTimestamp","type":"uint256"},{"internalType":"uint256","name":"lockTimestamp","type":"uint256"},{"internalType":"uint256","name":"closeTimestamp","type":"uint256"},{"internalType":"int256","name":"lockPrice","type":"int256"},{"internalType":"int256","name":"closePrice","type":"int256"},{"internalType":"uint256","name":"lockOracleId","type":"uint256"},{"internalType":"uint256","name":"closeOracleId","type":"uint256"},{"internalType":"uint256","name":"totalAmount","type":"uint256"},{"internalType":"uint256","name":"bullAmount","type":"uint256"},{"internalType":"uint256","name":"bearAmount","type":"uint256"},{"internalType":"uint256","name":"rewardBaseCalAmount","type":"uint256"},{"internalType":"uint256","name":"rewardAmount","type":"uint256"},{"internalType":"bool","name":"oracleCalled","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_adminAddress","type":"address"}],"name":"setAdmin","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_bufferSeconds","type":"uint256"},{"internalType":"uint256","name":"_intervalSeconds","type":"uint256"}],"name":"setBufferAndIntervalSeconds","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_minBetAmount","type":"uint256"}],"name":"setMinBetAmount","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_operatorAddress","type":"address"}],"name":"setOperator","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_oracle","type":"address"}],"name":"setOracle","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_oracleUpdateAllowance","type":"uint256"}],"name":"setOracleUpdateAllowance","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_treasuryFee","type":"uint256"}],"name":"setTreasuryFee","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"treasuryAmount","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"treasuryFee","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"unpause","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"userRounds","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
    // let prediction_address = '0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA'
    // let prediction_contract = new web3.eth.Contract(ABI, prediction_address)
    // setPredictionContract(prediction_contract)
    // let currentEpoch = await prediction_contract.methods.currentEpoch().call()
    console.log(currentEpoch);

    // call pcs bull/bear bet
    // needed metamask confirmation all the time
    // how to automatic confirm transaction? ---> sign transaction
    // let res = await predictionContract.methods.betBull(currentEpoch).send({
    //   from: account,
    //   value: bet
    // })
    // console.log(res)
  };

  const predictionBot = async (bet) => {
    n++;
    setN(n);
    // set up bot
    let initial_balance = await web3.eth.getBalance(account); // 0.180035038921048678
    let goal = web3.utils.toWei("1");
    let amount = web3.utils.toWei("0.18"); // this will be balance in production
    let initial_bet = web3.utils.toWei("0.003");
    // get the price from oracle contract https://bscscan.com/address/0xd276fcf34d54a926773c399ebaa772c12ec394ac#readContract
    // assumption to bet UP always
    // prev_price = price taken at beggining of round
    // price_now = get current price
    // if price - prev_price > 0.01 winning
    let epoch = await predictionContract.methods.currentEpoch().call();
    console.log(`
    Round: ${n}
    Epoch now: ${epoch}
    Current epoch: ${currentEpoch}
    Initial balance: ${web3.utils.fromWei(initial_balance)}
    Balance now: ${web3.utils.fromWei(amount)}
    Goal: ${web3.utils.fromWei(goal)}
    Initial bet: ${web3.utils.fromWei(bet)}
    Last round won: ${lastRoundWon}
    `);
    // place bet and store price
    // wait for almost 5 minutes, check price and set if winning or loosing
    // if winning next bet = initial_bet
    // if loosing bet = 2 * bet

    // if balance > goal stop bot
    if (web3.utils.fromWei(amount) > web3.utils.fromWei(goal)) {
      console.log("Goal riched");
      clearInterval(interval);
      clearInterval(timer);
      setN(0);
    } else {
      if (lastRoundWon) {
        bet = currentBet;
      } else {
        bet = 2 * currentBet;
      }
      console.log(`Bet: ${bet}`);
      // checkEpoch()
    }
  };

  const startBot = async () => {
    console.log("Bot started, waiting for next epoch");
    let epoch = await predictionContract.methods.currentEpoch().call();
    setCurrentEpoch(epoch);
    checkEpoch();
  };

  const stopBot = () => {
    clearInterval(interval);
    clearInterval(timer);
    clearInterval(priceTimer);
    setLastRoundWon(true);
    setCurrentBet(initialBet);
    resetRounds();
    all_rounds = [];
    setAllRounds([]);
    setN(0);
  };

  const loadOraclePriceContract = async () => {
    let ABI = [
      {
        inputs: [
          { internalType: "address", name: "_aggregator", type: "address" },
          {
            internalType: "address",
            name: "_accessController",
            type: "address",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "int256",
            name: "current",
            type: "int256",
          },
          {
            indexed: true,
            internalType: "uint256",
            name: "roundId",
            type: "uint256",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "updatedAt",
            type: "uint256",
          },
        ],
        name: "AnswerUpdated",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "uint256",
            name: "roundId",
            type: "uint256",
          },
          {
            indexed: true,
            internalType: "address",
            name: "startedBy",
            type: "address",
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "startedAt",
            type: "uint256",
          },
        ],
        name: "NewRound",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        name: "OwnershipTransferRequested",
        type: "event",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address",
          },
        ],
        name: "OwnershipTransferred",
        type: "event",
      },
      {
        inputs: [],
        name: "acceptOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "accessController",
        outputs: [
          {
            internalType: "contract AccessControllerInterface",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "aggregator",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "_aggregator", type: "address" },
        ],
        name: "confirmAggregator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "description",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "_roundId", type: "uint256" },
        ],
        name: "getAnswer",
        outputs: [{ internalType: "int256", name: "", type: "int256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
        name: "getRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "uint256", name: "_roundId", type: "uint256" },
        ],
        name: "getTimestamp",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "latestAnswer",
        outputs: [{ internalType: "int256", name: "", type: "int256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "latestRound",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "latestRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "latestTimestamp",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint16", name: "", type: "uint16" }],
        name: "phaseAggregators",
        outputs: [
          {
            internalType: "contract AggregatorV2V3Interface",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "phaseId",
        outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "_aggregator", type: "address" },
        ],
        name: "proposeAggregator",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "proposedAggregator",
        outputs: [
          {
            internalType: "contract AggregatorV2V3Interface",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "uint80", name: "_roundId", type: "uint80" }],
        name: "proposedGetRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "proposedLatestRoundData",
        outputs: [
          { internalType: "uint80", name: "roundId", type: "uint80" },
          { internalType: "int256", name: "answer", type: "int256" },
          { internalType: "uint256", name: "startedAt", type: "uint256" },
          { internalType: "uint256", name: "updatedAt", type: "uint256" },
          { internalType: "uint80", name: "answeredInRound", type: "uint80" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "_accessController",
            type: "address",
          },
        ],
        name: "setController",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [{ internalType: "address", name: "_to", type: "address" }],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "version",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
      },
    ];

    let oracle_address = "0xD276fCF34D54A926773c399eBAa772C12ec394aC";
    let web3 = new Web3(Web3.givenProvider);
    let oracle_contract = new web3.eth.Contract(ABI, oracle_address);
    setOracleContract(oracle_contract);
    let price = await oracle_contract.methods.latestAnswer().call();
    setLatestPrice(price);
  };

  // simulate rounds
  const addRound = () => {
    setPrevRound(round);
    setRound(round + 1);
  };

  const resetRounds = () => {
    setRound(0);
    setPrevRound(0);
  };

  const getLatestPrice = async () => {
    let price = await oracleContract.methods.latestAnswer().call();
    setLatestPrice(price);
  };

  const resetCurrentEpoch = async () => {
    let epoch = await predictionContract.methods.currentEpoch().call();
    setCurrentEpoch(epoch);
  };

  const getPrevRoundData = async () => {
    // setTimeout(async () => {
    let epoch = currentEpoch - 2;
    let { lockPrice, closePrice } = await predictionContract.methods
      .rounds(epoch)
      .call();
    for (let i = 0; i < all_rounds.length; i++) {
      if (all_rounds[i].epoch === epoch) {
        all_rounds[i].lockPrice = lockPrice;
        all_rounds[i].closePrice = closePrice;
      }
    }
    console.log(all_rounds);
    setAllRounds(all_rounds);
    // }, 18000)
  };

  const getRoundData = async () => {
    let epoch = 13554;
    let data = await predictionContract.methods.rounds(epoch).call();
    console.log(data);
  };

  const startCheckingRounds = () => {
    let bet;
    console.log(`
      Epoch changed.
      Current epoch: ${currentEpoch}
      Round: ${round}
      `);
    // if (prevRound === 0) {
    //   setLastRoundWon(true)
    //   setCurrentBet(initialBet)
    // } else {
    //   setBegPrice(460)
    //   startPriceTimer()
    // }
    let price = oracleContract.methods.latestAnswer().call();
    round_data.begPrice = price;
    round_data.epoch = currentEpoch;
    round_data.bet = currentBet;
    round_data.round = round;
    round_data.result = lastRoundWon ? "won" : "lost";
    all_rounds.push(round_data);
    setBegPrice(price);
    startPriceTimer();
    // if (lastRoundWon) {
    //   bet = initialBet
    //   setCurrentBet(initialBet)
    // } else {
    //   bet = 2 * currentBet
    //   setCurrentBet(bet)
    // }
    console.log(`
      Bet: ${currentBet}
      Price at beginning of round: ${begPrice}
      Last round: ${lastRoundWon ? "won" : "lost"}
      `);
    // placeBet(bet)
    // store prev round results
    getPrevRoundData();
    checkEpoch();
  };

  // when currentEpoch changes start bot
  // if first round set initialBet etc
  // if second or more round see if last round is being won or lost and place right bet
  useEffect(() => {
    // startCheckingRounds();
  });
  return (
    <div>
      Account address: {account}
      <br />
      Chain id: {chain_id}
      <br />
      <br />
      Balance: {balance}
      <br />
      Current bet: {currentBet}
      <br />
      Current epoch: {currentEpoch}
      <br />
      Beginning price: {begPrice}
      <br />
      End price: {endPrice}
      <br />
      Latest price: {latestPrice}
      <br />
      Last round: {lastRoundWon ? "won" : "lost"}
      <button onClick={getLatestPrice}>get latest price</button>
      <br />
      <button onClick={resetCurrentEpoch}>reset to current epoch</button>
      <br />
      <button onClick={getRoundData}>get round data</button>
      <br />
      {
        account === undefined ? (
          <button onClick={connectMetamask}>Connect metamask</button>
        ) : null //show details
      }
      <button onClick={startBot}>start bot</button>
      <button onClick={stopBot}>stop bot</button>
      <br />
      <button onClick={resetRounds}>reset</button>
      {round}
      <button onClick={addRound}>+</button>
      {/* <button onClick={placeBet}>place bet</button> */}
      {allRounds.length > 0 ? (
        allRounds.map((round) => (
          <div>
            Epoch: {round.epoch}
            Result: {round.result}
            Locked price: {round.lockPrice}
            Beg price: {round.begPrice}
            End price: {round.endPrice}
            Close price: {round.closePrice}
            Bet: {round.bet}
            Balance: {round.balance}
            <br />
            <br />
          </div>
        ))
      ) : (
        <div>start bot to see prev rounds</div>
      )}
    </div>
  );
}
