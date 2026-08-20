import React, { useEffect, useMemo, useState } from "react";
import "./styles.css";

const DEFAULT_NAMES = ["Alex", "Bailey", "Casey", "Devon", "Emery", "Frankie", "Gray", "Harper"];
const TIMER_OPTIONS = [
  { label: "1 MIN", seconds: 60 },
  { label: "2 MINS", seconds: 120 },
  { label: "3 MINS", seconds: 180 },
  { label: "5 MINS", seconds: 300 },
];
const WORDS = [
  ["Manager", "Supervisor", "Executive", "Boss"],
  ["Stapler", "Tape", "Paperclip", "Scissors"],
  ["Coffee", "Tea", "Water", "Juice"],
  ["Laptop", "Printer", "Scanner", "Projector"],
  ["Meeting", "Appointment", "Interview", "Call"],
  ["Salary", "Bonus", "Raise", "Commission"],
];

function sample(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function createRound(players) {
  const cluster = sample(WORDS);
  const realWord = sample(cluster);
  let decoyWord = sample(cluster);
  while (decoyWord === realWord) decoyWord = sample(cluster);
  const imposterIndex = Math.floor(Math.random() * players.length);
  return {
    players,
    realWord,
    decoyWord,
    imposterIndex,
    imposterName: players[imposterIndex],
    assignments: players.map((name, index) => ({
      name,
      word: index === imposterIndex ? decoyWord : realWord,
      isImposter: index === imposterIndex,
    })),
  };
}

function getResolution(round, votes) {
  const counts = Object.fromEntries(round.players.map((name) => [name, 0]));
  Object.values(votes).forEach((name) => {
    if (counts[name] !== undefined) counts[name] += 1;
  });
  const maxVotes = Math.max(...Object.values(counts));
  const topNames = Object.keys(counts).filter((name) => counts[name] === maxVotes);
  const tied = topNames.length > 1;
  const accused = tied ? topNames.join(", ") : topNames[0];
  return { counts, tied, accused, caught: !tied && accused === round.imposterName };
}

function Brand() {
  return <img className="brand" src="/assets/logo.svg" alt="Who Is Unemployed" />;
}

function Footer() {
  return <footer><strong>YOUR HR APPROVED</strong><span>BY</span><b>HENRYA</b></footer>;
}

function Button({ children, onClick, disabled = false }) {
  return <button className="primary-button" disabled={disabled} onClick={onClick}>{children}</button>;
}

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  return <main>
    <header className="app-header"><Brand /><button className="menu-button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><span /><span /><span /></button></header>
    <div className="page-content">{children}</div>
    <Footer />
    {menuOpen && <div className="menu-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
      <aside className="menu-panel" aria-label="Game menu" onClick={(event) => event.stopPropagation()}>
        <div className="menu-heading"><h2>GAME MENU</h2><button className="close-button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button></div>
        <section className="menu-section"><h3>ROLES</h3><div className="menu-item"><b>EMPLOYED PLAYERS</b><p>Receive the real word. Give clues that help your team without making the word too obvious.</p></div><div className="menu-item"><b>UNEMPLOYED PLAYER</b><p>Receives a decoy word. Blend in, listen carefully, and convince the group you belong.</p></div></section>
        <section className="menu-section"><h3>HOW TO PLAY</h3><div className="menu-item"><b>1. REVEAL</b><p>Pass the phone so each player privately checks their role and word.</p></div><div className="menu-item"><b>2. DISCUSS</b><p>Talk through your clues before the timer runs out.</p></div><div className="menu-item"><b>3. VOTE</b><p>Pass the phone again and vote privately for the suspected unemployed player.</p></div></section>
        <section className="menu-section"><h3>ROUND RULES</h3><p className="menu-note">Do not show your word. Do not announce your role. The group wins by finding the unemployed player.</p></section>
      </aside>
    </div>}
  </main>;
}

function Setup({ players, timerSeconds, onStart }) {
  const [count, setCount] = useState(players.length);
  const [names, setNames] = useState(() => players.slice());
  const [timer, setTimer] = useState(timerSeconds);
  const updateCount = (next) => {
    const value = Math.max(3, Math.min(8, next));
    setCount(value);
    setNames((current) => Array.from({ length: value }, (_, index) => current[index] || DEFAULT_NAMES[index]));
  };
  return <Layout><section className="setup-page">
    <div className="stepper"><button onClick={() => updateCount(count - 1)}>-</button><output>{count}</output><button onClick={() => updateCount(count + 1)}>+</button></div>
    <div className="player-list">{names.slice(0, count).map((name, index) => <label className="player-row" key={index}><img src="/assets/user.png" alt="" /><input value={name} placeholder={`PLAYER ${index + 1}`} onChange={(event) => setNames((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /></label>)}</div>
    <div className="timer-block"><img className="clock-image" src="/assets/clock.png" alt="" /><div className="timer-options">{TIMER_OPTIONS.map((option) => <button className={timer === option.seconds ? "selected" : ""} key={option.seconds} onClick={() => setTimer(option.seconds)}>{option.label}</button>)}</div><span className="timer-label">TIMER</span></div>
    <Button onClick={() => onStart(names.slice(0, count).map((name, index) => name.trim() || `Player ${index + 1}`), timer)}>START GAME</Button>
  </section></Layout>;
}

function Reveal({ round, onDone }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const assignment = round.assignments[index];
  const last = index === round.assignments.length - 1;
  return <Layout><section className="play-page">
    {!revealed ? <><h1>PLAYER NAME</h1><img className="player-image" src="/assets/user.png" alt="" /><div className="pass-name">{assignment.name}</div><Button onClick={() => setRevealed(true)}>REVEAL MY WORD</Button></> : <><div className="word-card">{assignment.isImposter && <strong className="imposter-copy">YOU ARE<br />UNEMPLOYED<br />HINT; WORD</strong>}<strong className="word">{assignment.word}</strong></div><Button onClick={() => last ? onDone() : (setRevealed(false), setIndex(index + 1))}>{last ? "HIDE & START DISCUSSION" : "HIDE & PASS"}</Button></>}
  </section></Layout>;
}

function Discussion({ seconds, onDone }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { if (left <= 0) { onDone(); return undefined; } const timer = setTimeout(() => setLeft((value) => value - 1), 1000); return () => clearTimeout(timer); }, [left, onDone]);
  return <Layout><section className="play-page"><h1>TIMER</h1><img className="discussion-image" src="/assets/preview.png" alt="People collaborating at work" /><div className="big-timer">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</div><p>DISCUSS AND FIND THE IMPOSTER</p><Button onClick={onDone}>SKIP</Button></section></Layout>;
}

function Voting({ round, onDone }) {
  const [index, setIndex] = useState(0);
  const [voting, setVoting] = useState(false);
  const [selected, setSelected] = useState("");
  const [votes, setVotes] = useState({});
  const current = round.players[index];
  const choices = round.players.filter((name) => name !== current);
  const submit = () => { const next = { ...votes, [current]: selected }; if (index === round.players.length - 1) onDone(next); else { setVotes(next); setIndex(index + 1); setSelected(""); setVoting(false); } };
  return <Layout><section className="play-page">{!voting ? <><h1>PLAYER NAME</h1><div className="pass-name">{current}</div><Button onClick={() => setVoting(true)}>VOTE & PASS</Button></> : <><h1>WHO IS THE<br />IMPOSTER</h1><div className="vote-list">{choices.map((name) => <button className={selected === name ? "chosen" : ""} key={name} onClick={() => setSelected(name)}>{name}</button>)}</div><Button disabled={!selected} onClick={submit}>VOTE & PASS</Button></>}</section></Layout>;
}

function Results({ round, votes, onRestart }) {
  const result = useMemo(() => getResolution(round, votes), [round, votes]);
  return <Layout><section className="results-page"><h1 className={result.caught ? "" : "red-heading"}>{result.caught ? "IMPOSTER FOUND" : "IMPOSTER ESCAPED !!"}</h1><div className="result-card"><strong>{result.caught ? "IMPOSTER FOUND" : "IMPOSTER ESCAPED"}</strong><span>ACTUAL IMPOSTER: {round.imposterName}</span><span>REAL WORD: {round.realWord}</span><span>{result.tied ? "VOTE TIE" : "ACCUSED PLAYER"}: {result.accused}</span><div className="tally">{Object.entries(result.counts).map(([name, count]) => <span key={name}>{name}<b>{count}</b></span>)}</div></div><Button onClick={onRestart}>RESTART</Button></section></Layout>;
}

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [players, setPlayers] = useState(DEFAULT_NAMES.slice(0, 3));
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [round, setRound] = useState(null);
  const [votes, setVotes] = useState({});
  const start = (nextPlayers, nextTimer) => { setPlayers(nextPlayers); setTimerSeconds(nextTimer); setVotes({}); setRound(createRound(nextPlayers)); setScreen("reveal"); };
  if (screen === "setup") return <Setup players={players} timerSeconds={timerSeconds} onStart={start} />;
  if (!round) return <Layout><section className="play-page"><h1>NO ACTIVE ROUND</h1><Button onClick={() => setScreen("setup")}>BACK TO SETUP</Button></section></Layout>;
  if (screen === "reveal") return <Reveal round={round} onDone={() => setScreen("discussion")} />;
  if (screen === "discussion") return <Discussion seconds={timerSeconds} onDone={() => setScreen("voting")} />;
  if (screen === "voting") return <Voting round={round} onDone={(nextVotes) => { setVotes(nextVotes); setScreen("results"); }} />;
  return <Results round={round} votes={votes} onRestart={() => { setRound(createRound(players)); setVotes({}); setScreen("reveal"); }} />;
}
