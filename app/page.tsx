'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from '../components/Globe';
import { CATEGORY_DESCRIPTIONS, DAILY_QUESTIONS, type ChallengeCategory, type Question, scoreGuess } from '../lib/questions';

type Coordinate = { lat: number; lng: number };
type Phase = 'placing' | 'locked' | 'revealing' | 'scored' | 'complete';
type Score = ReturnType<typeof scoreGuess>;

const DAILY_SEED = 'OCT / 25 / 26';

function formatScore(value: number) {
  return value.toLocaleString('en-US');
}

function formatDistance(value: number) {
  return value < 1000 ? `${value} km` : `${formatScore(value)} km`;
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function Header({ streak, countdown }: { streak: number; countdown: string }) {
  return (
    <header className="app-header">
      <a className="brand" href="#top" aria-label="Pinpoint home">
        <span className="brand-mark"><span /></span>
        <span>pin<span className="brand-slash">/</span>point</span>
      </a>
      <div className="header-center"><span className="status-dot" /> daily route live <span className="header-separator">/</span> {DAILY_SEED}</div>
      <div className="header-actions">
        <div className="streak-chip"><span className="streak-chip__value">{streak}</span><span><b>day run</b><small>next: {streak + 1}</small></span></div>
        <button className="avatar-button" type="button" aria-label="Open player menu">AR</button>
      </div>
      <div className="header-countdown"><span>refreshes in</span><strong>{countdown}</strong></div>
    </header>
  );
}

function Progress({ index, phase }: { index: number; phase: Phase }) {
  return (
    <div className="round-progress" aria-label={`Question ${index + 1} of ${DAILY_QUESTIONS.length}`}>
      <div className="round-progress__label"><span>today’s route</span><strong>{String(index + 1).padStart(2, '0')} / 05</strong></div>
      <div className="round-progress__track">
        {DAILY_QUESTIONS.map((question, questionIndex) => <span key={question.id} className={`${questionIndex < index || (questionIndex === index && (phase === 'scored' || phase === 'complete')) ? 'is-done' : ''} ${questionIndex === index ? 'is-current' : ''}`} />)}
      </div>
    </div>
  );
}

function ScoreRail({ scores, streak }: { scores: Score[]; streak: number }) {
  const totalScore = scores.reduce((sum, score) => sum + score.points, 0);
  const latest = scores.at(-1);
  return (
    <aside className="score-rail-new">
      <div className="rail-block rail-block--score">
        <span className="rail-label">current score</span>
        <strong>{formatScore(totalScore)}</strong>
        <small>{latest ? `+${formatScore(latest.points)} this guess` : 'Lock a pin to begin'}</small>
      </div>
      <div className="rail-divider" />
      <div className="rail-block">
        <span className="rail-label">daily position</span>
        <div className="rank-row"><strong>#184</strong><span>+12</span></div>
        <small>top 12% of today’s players</small>
      </div>
      <div className="rail-divider" />
      <div className="rail-block">
        <span className="rail-label">run health</span>
        <div className="run-meter"><span style={{ width: `${Math.min(100, streak * 10)}%` }} /></div>
        <small>{streak} days in motion</small>
      </div>
      <div className="rail-leaderboard">
        <div className="rail-leaderboard__head"><span>near you</span><span>score</span></div>
        {[
          ['Maya R.', '4,820', 'above'],
          ['you', formatScore(totalScore || 0), 'now'],
          ['Jon K.', '4,610', 'below'],
        ].map(([name, score, position]) => <div className={`rail-player ${name === 'you' ? 'rail-player--you' : ''}`} key={name}><span><b>{name}</b><small>{position}</small></span><strong>{score}</strong></div>)}
      </div>
    </aside>
  );
}

function RevealCard({ question, score }: { question: Question; score: Score }) {
  return (
    <div className="reveal-card-new">
      <div className="reveal-card-new__top"><span className="reveal-state-dot" /> <span>{score.feeling}</span><span className="reveal-card-new__region">{question.region}</span></div>
      <div className="reveal-card-new__answer"><span>The answer was</span><strong>{question.answer}</strong></div>
      <div className="reveal-stats">
        <div><strong>{formatDistance(score.distanceKm)}</strong><span>from target</span></div>
        <div><strong>{formatScore(score.points)}</strong><span>points</span></div>
      </div>
      <p>{question.lore}</p>
    </div>
  );
}

function CategoryTabs({ active, onChange }: { active: ChallengeCategory; onChange: (category: ChallengeCategory) => void }) {
  const categories = Object.keys(CATEGORY_DESCRIPTIONS) as ChallengeCategory[];
  return (
    <div className="category-tabs" aria-label="Challenge categories">
      {categories.map((category) => <button type="button" className={active === category ? 'is-active' : ''} key={category} onClick={() => onChange(category)}><span>{category}</span><small>{CATEGORY_DESCRIPTIONS[category]}</small></button>)}
    </div>
  );
}

function FinalResult({ scores, streak, onShare, shareLabel, onReplay }: { scores: Score[]; streak: number; onShare: () => void; shareLabel: string; onReplay: () => void }) {
  const totalScore = scores.reduce((sum, score) => sum + score.points, 0);
  const best = Math.min(...scores.map((score) => score.distanceKm));
  return (
    <section className="final-result" aria-live="polite">
      <div className="final-result__backdrop" />
      <div className="final-result__intro">
        <span className="overline">route complete <i /></span>
        <h1>You read the planet <em>well.</em></h1>
        <p>Five locations, one sharper instinct. Your next best guess is already waiting tomorrow.</p>
        <div className="final-score-lockup"><strong>{formatScore(totalScore)}</strong><span>today’s total</span></div>
        <div className="final-actions"><button type="button" className="button button--lime" onClick={onShare}>{shareLabel}<span>↗</span></button><button type="button" className="button button--quiet" onClick={onReplay}>run it again</button></div>
      </div>
      <div className="share-card" role="group" aria-label="Shareable result card">
        <div className="share-card__top"><span className="brand brand--small"><span className="brand-mark"><span /></span><span>pin<span className="brand-slash">/</span>point</span></span><span>{DAILY_SEED}</span></div>
        <div className="share-card__score"><span>{formatScore(totalScore)}</span><small>daily score</small></div>
        <div className="share-route">{scores.map((score, index) => <div key={`${score.points}-${index}`} className="share-route__row"><span>0{index + 1}</span><div><strong>{DAILY_QUESTIONS[index].answer}</strong><small>{formatDistance(score.distanceKm)} away</small></div><b>{formatScore(score.points)}</b></div>)}</div>
        <div className="share-card__footer"><span><b>{streak}</b> day run</span><span>best pin <b>{formatDistance(best)}</b></span><span>top 12%</span></div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [guess, setGuess] = useState<Coordinate | null>(null);
  const [phase, setPhase] = useState<Phase>('placing');
  const [scores, setScores] = useState<Score[]>([]);
  const [streak, setStreak] = useState(6);
  const [countdown, setCountdown] = useState(5 * 3600 + 42 * 60 + 15);
  const [shareLabel, setShareLabel] = useState('share result');
  const [activeCategory, setActiveCategory] = useState<ChallengeCategory>('Random places');
  const timers = useRef<number[]>([]);

  const question = DAILY_QUESTIONS[questionIndex];
  const currentScore = scores.at(-1);
  const globeTarget = phase === 'revealing' || phase === 'scored' ? question : null;
  const totalScore = useMemo(() => scores.reduce((sum, score) => sum + score.points, 0), [scores]);

  useEffect(() => {
    const interval = window.setInterval(() => setCountdown((value) => value > 0 ? value - 1 : 24 * 3600), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), []);

  function clearTimers() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }

  function handlePlacePin(coordinate: Coordinate) {
    if (phase !== 'placing') return;
    setGuess(coordinate);
  }

  function lockPin() {
    if (!guess || phase !== 'placing') return;
    const result = scoreGuess(guess, question, questionIndex);
    clearTimers();
    setPhase('locked');
    timers.current.push(window.setTimeout(() => setPhase('revealing'), 1050));
    timers.current.push(window.setTimeout(() => {
      setScores((previous) => [...previous, result]);
      setPhase('scored');
    }, 2850));
  }

  function nextQuestion() {
    if (phase !== 'scored') return;
    if (questionIndex === DAILY_QUESTIONS.length - 1) {
      setStreak(7);
      setPhase('complete');
      return;
    }
    clearTimers();
    setQuestionIndex((value) => value + 1);
    setGuess(null);
    setPhase('placing');
  }

  function replay() {
    clearTimers();
    setQuestionIndex(0);
    setGuess(null);
    setScores([]);
    setPhase('placing');
    setStreak(6);
  }

  async function shareResult() {
    const message = `I scored ${formatScore(totalScore)} on today’s Pinpoint route. Best pin: ${formatDistance(Math.min(...scores.map((score) => score.distanceKm)))}. Can you beat it?`;
    try {
      if (navigator.share) await navigator.share({ title: 'My Pinpoint result', text: message, url: window.location.href });
      else await navigator.clipboard.writeText(`${message} ${window.location.href}`);
      setShareLabel('result shared');
    } catch {
      setShareLabel('copy result');
    }
    window.setTimeout(() => setShareLabel('share result'), 2200);
  }

  return (
    <main id="top" className="pinpoint-shell">
      <Header streak={streak} countdown={formatCountdown(countdown)} />
      {phase === 'complete' ? <FinalResult scores={scores} streak={streak} onShare={shareResult} shareLabel={shareLabel} onReplay={replay} /> : (
        <>
          <section className="challenge-header">
            <div className="challenge-header__copy"><span className="overline">precision explorer <i /></span><h1>Read the planet.<br /><em>Trust the first instinct.</em></h1><p>Five strange locations. One clean line between your hunch and the truth.</p></div>
            <div className="challenge-header__meta"><div><span>daily set</span><strong>05</strong></div><div><span>run health</span><strong>{streak}<small>d</small></strong></div><div><span>route seed</span><strong>26</strong></div></div>
          </section>
          <section className="game-console" aria-label="Pinpoint daily challenge">
            <div className="game-console__top"><Progress index={questionIndex} phase={phase} /><div className="console-actions"><button className="console-link" type="button">practice <span>↗</span></button><button className="console-link" type="button">sound <span className="sound-bars"><i /><i /><i /></span></button></div></div>
            <div className="game-grid">
              <section className="clue-panel">
                <div className="clue-panel__meta"><span className="question-number">0{questionIndex + 1}</span><span className="question-kind">{question.category}</span><span className="difficulty">{question.difficulty}</span></div>
                <div className="clue-panel__body"><span className="overline">the clue <i /></span><h2>{question.clue}</h2><p className="clue-panel__hint">Place your pin anywhere on the globe. You can move it until you commit.</p></div>
                <div className="clue-panel__bottom"><div className="pin-status"><span className={guess ? 'pin-status__dot is-ready' : 'pin-status__dot'} />{phase === 'locked' ? 'pin locked — hold steady' : phase === 'revealing' ? 'finding the exact line' : guess ? 'pin ready to lock' : 'waiting for your first instinct'}</div><button className="button button--lime button--lock" type="button" disabled={!guess || phase !== 'placing'} onClick={lockPin}>{phase === 'locked' || phase === 'revealing' ? 'revealing' : phase === 'scored' ? 'answer found' : 'lock my pin'}<span>{phase === 'locked' || phase === 'revealing' ? '···' : '↗'}</span></button></div>
                {phase === 'locked' && <div className="anticipation"><span className="anticipation__orbit" /><strong>calculating your line</strong><small>The globe is about to tell you how close.</small></div>}
                {phase === 'revealing' && <div className="anticipation anticipation--revealing"><span className="anticipation__orbit" /><strong>follow the flight</strong><small>Both pins are coming into view.</small></div>}
                {phase === 'scored' && currentScore && <RevealCard question={question} score={currentScore} />}
                {phase === 'scored' && <button type="button" className="next-question" onClick={nextQuestion}>{questionIndex === DAILY_QUESTIONS.length - 1 ? 'see your route' : 'next location'}<span>↗</span></button>}
              </section>
              <section className="globe-panel"><div className="globe-panel__top"><span className="globe-coordinates">{guess ? `${guess.lat.toFixed(2)}° / ${guess.lng.toFixed(2)}°` : '18.42° N / 37.10° E'}</span><span className="globe-mode">{phase === 'placing' ? 'drag / tap / zoom' : phase === 'scored' ? 'answer locked' : 'signal acquired'}</span></div><Globe guess={guess} target={globeTarget} interactive={phase === 'placing'} onPlacePin={handlePlacePin} /><div className="globe-panel__bottom"><span><i className="legend-swatch legend-swatch--guess" /> your pin</span><span><i className="legend-swatch legend-swatch--target" /> target</span><span className="globe-panel__tip">{phase === 'placing' ? 'drag to explore the world' : 'revealing the answer'}</span></div></section>
              <ScoreRail scores={scores} streak={streak} />
            </div>
          </section>
          <section className="after-console"><div className="after-console__copy"><span className="overline">choose your texture <i /></span><h2>Every route has a different kind of tension.</h2></div><CategoryTabs active={activeCategory} onChange={setActiveCategory} /><div className="after-console__footer"><span>category preview</span><strong>{activeCategory}</strong><small>{CATEGORY_DESCRIPTIONS[activeCategory]}</small></div></section>
        </>
      )}
      <footer className="app-footer"><span>pinpoint / a daily game for people who read the world</span><span>privacy · terms · built with open geography</span></footer>
    </main>
  );
}
