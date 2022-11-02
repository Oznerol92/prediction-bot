import React, { useState } from "react";

import Web3 from "web3";

import PredictionBot from "./Components/PredictionBot";

import { PCS_ABI, ORACLE_ABI } from "./utils/ABIs";

import "./App.css";
import { useEffect } from "react";
import Vitto from "./Components/Vitto/Vitto";

let timer;

let priceTimer;

let time = 270000; // 4mins 30secs

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

let bot_active = false;

function App() {
  const [account, setAccount] = React.useState();
  const [balance, setBalance] = React.useState();
  const [chain_id, setChain_id] = React.useState();
  const [web3, setWeb3] = React.useState();

  const [currentEpoch, setCurrentEpoch] = React.useState();
  const [epoch, setEpoch] = React.useState();
  const [predictionContract, setPredictionContract] = React.useState();
  const [oracleContract, setOracleContract] = React.useState();
  const [latestPrice, setLatestPrice] = React.useState();

  const [round, setRound] = React.useState(0);
  const [prevRound, setPrevRound] = React.useState(0);

  const [begPrice, setBegPrice] = React.useState();
  const [endPrice, setEndPrice] = React.useState();
  const [lastRoundWon, setLastRoundWon] = React.useState(true);
  const [initialBet, setInitialBet] = React.useState("0.003");
  const [currentBet, setCurrentBet] = React.useState("0.003");
  const [latestBet, setLatestBet] = React.useState("0.003");

  const [amountWon, setAmountWon] = useState(0);
  const [amountLost, setAmountLost] = useState(0);

  const [selected, setSelected] = useState("home");

  const connectMetamask = async () => {
    if (typeof window.ethereum !== "undefined") {
      let web3 = new Web3(Web3.givenProvider);
      setWeb3(web3);
      let account = await web3.eth.getAccounts();
      let bal = await web3.eth.getBalance(account[0]);
      let balance = web3.utils.fromWei(bal);
      let chain_id = await web3.eth.net.getId();
      setAccount(account[0]);
      setBalance(balance);
      setChain_id(chain_id);
      loadPCSPredictionContract();
      loadOraclePriceContract();
    }
  };

  const loadPCSPredictionContract = async () => {
    let prediction_address = "0x18B2A687610328590Bc8F2e5fEdDe3b582A49cdA";
    let web3 = new Web3(Web3.givenProvider);
    let prediction_contract = new web3.eth.Contract(
      PCS_ABI,
      prediction_address
    );
    setPredictionContract(prediction_contract);
    let epoch = await prediction_contract.methods.currentEpoch().call();
    setCurrentEpoch(epoch);
  };

  const loadOraclePriceContract = async () => {
    let oracle_address = "0xD276fCF34D54A926773c399eBAa772C12ec394aC";
    let web3 = new Web3(Web3.givenProvider);
    let oracle_contract = new web3.eth.Contract(ORACLE_ABI, oracle_address);
    setOracleContract(oracle_contract);
    let price = await oracle_contract.methods.latestAnswer().call();
    setLatestPrice(price);
  };

  const setPrice = async () => {
    let oracle_address = "0xD276fCF34D54A926773c399eBAa772C12ec394aC";
    let web3 = new Web3(Web3.givenProvider);
    let oracle_contract = new web3.eth.Contract(ORACLE_ABI, oracle_address);
    setOracleContract(oracle_contract);
    let price = await oracle_contract.methods.latestAnswer().call();
    setLatestPrice(price);
    setBegPrice(price);
  };

  // function to check price after time
  const startPriceTimer = () => {
    priceTimer = setTimeout(async () => {
      console.log("New price BNB after timeout");
      let price = await oracleContract.methods.latestAnswer().call();
      setEndPrice(price);
      round_data.endPrice = price;
      if (price - begPrice > 0) {
        setLastRoundWon(true);
        let amount_won = amountWon + latestBet;
        setCurrentBet(initialBet);
        setLatestBet(initialBet);
        setAmountWon(amount_won);
      } else {
        setLastRoundWon(false);
        setCurrentBet(currentBet * 2);
        let amount_lost = amountLost + latestBet;
        setLatestBet(currentBet * 2);
        setAmountLost(amount_lost);
      }
      console.log(`
      Price now: ${price}
      Beg price: ${begPrice}
      Latest bet: ${latestBet}
      Current bet: ${currentBet}
      Price difference: ${price - begPrice > 0 ? "won" : "lost"}
      `);
      round_data.result = lastRoundWon ? "won" : "lost";
    }, time);
  };

  const checkEpoch = () => {
    let epoch;
    timer = setInterval(async () => {
      epoch = await predictionContract.methods.currentEpoch().call();
      console.log(`
      Prev epoch: ${currentEpoch}
      Epoch: ${epoch}
      `);
      if (currentEpoch != epoch) {
        console.log("New epoch");
        // store BNB price to be checked again after 4 mins ~35 secs
        // 32596296461
        setPrice(); // set price at the beginning of the round
        setCurrentEpoch(epoch); // set current epoch
        startPriceTimer(); // price in 4m 35s
        addRound();
        clearInterval(timer);
      }
    }, 500);
  };

  const startBot = () => {
    // place fake bet for next epoch
    console.log("Start bot");
    bot_active = true;
    // place initial bet
    checkEpoch();
    let initial_bet = 1;
    // let bet = web3.utils.toWei(initialBet); // set bet to initialBet in wei
    // console.log(`Bet: ${bet}`);
    // check for epoch change
    // setInterval(() => {
    //   checkEpoch();
    // }, 100);
    // wait for the result and place next bet (if winning leave same, if losing double down)
    // repeat
  };

  const stopBot = () => {
    console.log("Stop bot");
    clearInterval(timer);
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

  const getCurrentEpoch = async () => {
    let epoch = await predictionContract.methods.currentEpoch().call();
    setCurrentEpoch(epoch);
    if (bot_active) {
      checkEpoch();
    }
  };

  const handleSelected = (e) => {
    setSelected(e.target.value);
  };

  useEffect(() => {
    console.log(`New epoch: ${currentEpoch}`);
    if (account) {
      getCurrentEpoch();
    }
  });

  return (
    <>
      <div className="select-div">
        <button value={"home"} onClick={handleSelected}>
          home
        </button>
        <button value={"vitto"} onClick={handleSelected}>
          vitto
        </button>
      </div>
      {selected === "home" ? (
        <div>
          <div className="App">
            {/* <PredictionBot /> */}
            <div>
              <button onClick={connectMetamask}>connect metamask</button>
              <div>Address: {account}</div>
              <div>Chain id: {chain_id}</div>
              <div>Balance BNB: {balance}</div>
              <div>Amount winning/losing: {amountWon - amountLost}</div>
              <div className="current-epoch">
                <span>Current epoch: {currentEpoch}</span>
                <span>Current bet: {currentBet}</span>
              </div>
              <div className="bnb-details">
                <span>BNB price</span>
                <span>Latest: {latestPrice}</span>
                <span>Beg: {begPrice}</span>
                <span>End: {endPrice}</span>
              </div>
              <div>Latest epoch, latest bet, latest result</div>
              <div>W/L ratio</div>
              <div>W/L net</div>
              <button onClick={startBot}>start bot</button>
              <button onClick={stopBot}>stop bot</button>
              <div>Round: {round}</div>
            </div>
          </div>
        </div>
      ) : selected === "vitto" ? (
        <Vitto />
      ) : null}
    </>
  );
}

export default App;
