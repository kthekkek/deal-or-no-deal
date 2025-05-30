import React, { useState } from 'react';
import Confetti from 'react-confetti';
import suitcaseImg from './assets/suitcase.png';
import './Game.css';

const CASE_VALUES = [
  1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000
];

function shuffle(array) {
  const arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const casesToOpenPerRound = [6, 5, 4, 3, 2, 1, 1, 1];

function PicksRemaining({ playerCase, opened, round }) {
  if (playerCase === null) return null;
  const picksSoFar = opened.length - (round > 1 ? casesToOpenPerRound.slice(0, round - 1).reduce((a, b) => a + b, 0) : 0);
  const picksLeft = casesToOpenPerRound[round - 1] - picksSoFar;
  if (picksLeft <= 0) return null;
  return (
    <div className="picks-remaining">
      Picks remaining this round: <span className="picks-number">{picksLeft}</span>
    </div>
  );
}

const Game = () => {
  const [cases, setCases] = useState(shuffle(CASE_VALUES));
  const [opened, setOpened] = useState([]);
  const [playerCase, setPlayerCase] = useState(null);
  const [round, setRound] = useState(1);
  const [offer, setOffer] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [acceptedOffer, setAcceptedOffer] = useState(null);
  const [offerTimer, setOfferTimer] = useState(10);
  const [showInstruction, setShowInstruction] = useState(true);

  // For confetti sizing
  const [dimensions, setDimensions] = React.useState({ width: window.innerWidth, height: window.innerHeight });
  React.useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Timer for banker offer
  React.useEffect(() => {
    let timer;
    if (offer !== null && !gameOver) {
      setOfferTimer(10);
      timer = setInterval(() => {
        setOfferTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleDecline();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line
  }, [offer, gameOver]);

  const handleCaseClick = (idx) => {
    if (playerCase === null) {
      setPlayerCase(idx);
      setShowInstruction(false);
    } else if (!opened.includes(idx) && idx !== playerCase && !gameOver && offer === null) {
      setOpened([...opened, idx]);
    }
  };

  React.useEffect(() => {
    if (playerCase !== null && offer === null && !gameOver) {
      const openedThisRound = opened.length - (round > 1 ? casesToOpenPerRound.slice(0, round - 1).reduce((a, b) => a + b, 0) : 0);
      if (openedThisRound === casesToOpenPerRound[round - 1]) {
        // Calculate offer
        const remaining = cases.filter((_, i) => !opened.includes(i) && i !== playerCase);
        const avg = remaining.reduce((a, b) => a + b, 0) / remaining.length;
        setTimeout(() => setOffer(Math.round(avg)), 1000);
      }
    }
  }, [opened, playerCase, round, offer, gameOver, cases]);

  const handleAccept = () => {
    setAcceptedOffer(offer);
    setGameOver(true);
    setOffer(null);
  };

  const handleDecline = () => {
    setOffer(null);
    setRound(round + 1);
    if (opened.length >= cases.length - 2) {
      setGameOver(true);
    }
  };

  // React-style reset function
  const resetGame = () => {
    setCases(shuffle(CASE_VALUES));
    setOpened([]);
    setPlayerCase(null);
    setRound(1);
    setOffer(null);
    setGameOver(false);
    setAcceptedOffer(null);
    setShowInstruction(true);
  };

  return (
    <div className="game-container">
      {acceptedOffer && <Confetti width={dimensions.width} height={dimensions.height} numberOfPieces={350} recycle={false} />}
      <h1>Deal or No Deal</h1>
      {showInstruction && playerCase === null && (
        <div className="game-instructions">
          <strong>Instructions:</strong> Choose the case you believe contains the <span style={{color:'#ffd700'}}>$1,000,000</span> prize. You'll keep this case until the end unless you accept a deal!
        </div>
      )}
      {playerCase === null ? (
        <div className="choose-case-tooltip-wrapper">
          <div className="choose-case choose-million">Choose your million dollar case
            <span className="tooltip-text">
              Pick the case you believe contains the $1,000,000 prize. You'll keep this case until the end unless you accept a deal!
            </span>
          </div>
        </div>
      ) : (
        <div className="player-case">Your case: <span className="case-number">{playerCase + 1}</span></div>
      )}
      <PicksRemaining playerCase={playerCase} opened={opened} round={round} />
      <div className="cases-grid">
        {cases.map((value, idx) => (
          <button
            key={idx}
            className={`case-btn${opened.includes(idx) ? ' opened' : ''}${playerCase === idx ? ' player' : ''}${opened.includes(idx) ? ' pop-open' : ''}`}
            onClick={() => handleCaseClick(idx)}
            disabled={opened.includes(idx) || (playerCase === null ? false : (playerCase === idx)) || gameOver || offer !== null}
          >
            {!opened.includes(idx) ? (
              <span className="suitcase-wrapper">
                <img src={suitcaseImg} alt="Suitcase" className="suitcase-img" />
                <span className="case-label">{idx + 1}</span>
              </span>
            ) : (
              <span className="case-value">{value}</span>
            )}
          </button>
        ))}
      </div>
      <div className="values-list">
        {CASE_VALUES.map((v, i) => (
          <span key={i} className={cases[playerCase] === v && gameOver && !acceptedOffer ? 'highlight' : opened.includes(cases.indexOf(v)) ? 'strikethrough' : ''}>{`$${v.toLocaleString()}`}</span>
        ))}
      </div>
      {offer !== null && !gameOver && (
        <div className="banker-offer">
          <div className="offer-text">Banker's Offer: <span className="offer-value">${offer.toLocaleString()}</span></div>
          <div className="offer-timer">Time left: <span className="timer-value">{offerTimer}</span> seconds</div>
          <button className="accept-btn" onClick={handleAccept}>Deal</button>
          <button className="decline-btn" onClick={handleDecline}>No Deal</button>
        </div>
      )}
      {gameOver && (
        <div className="game-over">
          {acceptedOffer ? (
            <div>You accepted the deal: <span className="final-value">${acceptedOffer.toLocaleString()}</span></div>
          ) : (
            <div>Your case contained: <span className="final-value">${cases[playerCase].toLocaleString()}</span></div>
          )}
          <button className="reveal-btn" onClick={resetGame}>Play Again</button>
        </div>
      )}
    </div>
  );
};

export default Game; 