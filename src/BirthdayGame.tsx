import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import './game.css';

// ─────────────────────────────────────────────
// IMAGE ASSETS (from Figma)
// ─────────────────────────────────────────────
const IMG = {
  ball:          'https://www.figma.com/api/mcp/asset/372a4d89-d11f-4d96-b510-db9b5fd7bfe1',
  net:           'https://www.figma.com/api/mcp/asset/961f8486-4f6d-4175-853d-a34174937eb7',
  horizon:       'https://www.figma.com/api/mcp/asset/b942bb4b-52d7-4b1b-b335-dc661bafa529',
  ballShadow:    'https://www.figma.com/api/mcp/asset/d5ef49cb-c4ca-4fb6-bd3a-d13f5a66c1e1',
  swipeHand:     'https://www.figma.com/api/mcp/asset/a69cae31-34b0-4863-a1fc-c5cc7a5eaacb',
  giftIcon:      'https://www.figma.com/api/mcp/asset/19a04af7-00cc-47c0-a5d9-8637b496f505',
  letter:        'https://www.figma.com/api/mcp/asset/28bd644d-af58-41c6-92a1-8205efae5e6e',
  coupon:        'https://www.figma.com/api/mcp/asset/50d10c2c-af73-4304-bce8-26aa2dd4a427',
  island:        'https://www.figma.com/api/mcp/asset/0d964fd0-fbd5-4000-b216-0aa3c6b9c1e0',
  telepathy:     'https://www.figma.com/api/mcp/asset/68502499-3c90-4b4f-b650-78cceed38a16',
  popperL:       'https://www.figma.com/api/mcp/asset/ac0ba5c9-8a31-4dff-8fb5-43776a8faaa3',
  popperFinale:  'https://www.figma.com/api/mcp/asset/c1762aab-ac0f-42a9-9b28-fedab2ab0dcb',
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Screen =
  | 'intro'
  | 'serve'
  | 'ball_away'
  | 'ball_back'
  | 'spike'
  | 'spike_away'
  | 'missed'
  | 'rally_won'
  | 'gift_closed'
  | 'gift_opened'
  | 'finale_anim1'
  | 'finale_anim2'
  | 'giftbox';

// Court geometry
const NET_Y = 298;  // net top pixel in 390×844 frame
const CX    = 195;  // horizontal center of 390px frame

// Ball positions — only top+size; left is always CX - size/2
const BPOS = {
  serve:  { top: 415, size: 200 },  // user floor, large
  opp:    { top: 175, size: 52  },  // opponent side
  peak:   { top: 75,  size: 46  },  // arc apex
  spike:  { top: 305, size: 200 },  // mid-frame, ready to spike
  ground: { top: 341, size: 46  },  // opponent floor near net base (matches Figma 10:77)
};

// Ball transition durations (ms)
const DUR = {
  serveAway:   1000,
  awayBack:     900,
  spikeAway:    850,
  backSpike:    600,
  spikeGround:  350,
  spikeWindow: 1800,
  autoFinale:  2500,
};

// ─────────────────────────────────────────────
// CONFETTI DATA (intro screen — falling rain)
// ─────────────────────────────────────────────
const CONFETTI = [
  { left:  30, startY:  -20, color: '#ffe43f', rot: -10, w: 8, h: 14, dur: 4.5, delay: 0.0,  swayX:  8 },
  { left:  80, startY:  -60, color: '#f97316', rot:  18, w: 7, h: 13, dur: 3.8, delay: 0.7,  swayX: -6 },
  { left: 140, startY:  -40, color: '#88d8ff', rot: -32, w: 6, h: 12, dur: 5.2, delay: 1.4,  swayX: 10 },
  { left: 190, startY:  -30, color: '#ffffff', rot:  12, w: 8, h: 14, dur: 4.0, delay: 0.3,  swayX: -8 },
  { left: 240, startY:  -55, color: '#ffe43f', rot: -22, w: 7, h: 13, dur: 3.5, delay: 1.8,  swayX:  6 },
  { left: 300, startY:  -15, color: '#f97316', rot:  28, w: 8, h: 14, dur: 4.8, delay: 0.9,  swayX: -10},
  { left: 350, startY:  -45, color: '#88d8ff', rot: -15, w: 6, h: 12, dur: 3.9, delay: 2.2,  swayX:  7 },
  { left:  55, startY:  -70, color: '#ffffff', rot:  35, w: 5, h: 10, dur: 5.0, delay: 1.1,  swayX: -5 },
  { left: 110, startY:  -25, color: '#ffe43f', rot:  -8, w: 7, h: 13, dur: 4.3, delay: 2.6,  swayX:  9 },
  { left: 165, startY:  -50, color: '#f97316', rot:  22, w: 8, h: 14, dur: 3.7, delay: 0.5,  swayX: -7 },
  { left: 215, startY:  -35, color: '#88d8ff', rot: -28, w: 6, h: 12, dur: 4.6, delay: 1.6,  swayX:  8 },
  { left: 265, startY:  -65, color: '#ffe43f', rot:  16, w: 7, h: 13, dur: 3.6, delay: 2.9,  swayX: -6 },
  { left: 315, startY:  -40, color: '#ffffff', rot: -20, w: 5, h: 10, dur: 5.1, delay: 0.8,  swayX: 10 },
  { left: 370, startY:  -30, color: '#f97316', rot:  30, w: 8, h: 14, dur: 4.1, delay: 2.0,  swayX: -8 },
  { left:  20, startY:  -55, color: '#88d8ff', rot:  -5, w: 6, h: 12, dur: 4.7, delay: 1.3,  swayX:  6 },
  { left: 340, startY:  -20, color: '#ffe43f', rot:  25, w: 7, h: 13, dur: 3.9, delay: 3.1,  swayX: -9 },
];

// ─────────────────────────────────────────────
// GIFT CONTENT DATA
// ─────────────────────────────────────────────
const GIFTS = [
  {
    closedTitle: ['GIFT 1', 'UNLOCKED!'],
    closedSubtitle: "You've received a letter!",
    closedImage: IMG.letter,
    closedImageRot: -15.7,
    openedContent: (
      <>
        <p style={{lineHeight: 1.23, fontSize: 17}}>Thank you for not giving up on life cause honestly life would be so boring without you 🥺</p>
        <p style={{marginTop: 10, fontWeight: 700, lineHeight: 1.23, fontSize: 17}}>ILY WEEKEND GIRLFRIEND ❤️</p>
        <p style={{marginTop: 10, fontSize: 14, lineHeight: 1.23}}>Here's rare pic of us every time we ask the question</p>
        <p style={{fontWeight: 700, fontSize: 14, lineHeight: 1.23}}>"What should we eat this weekend"</p>
        <img src={IMG.telepathy} alt="" style={{width: '100%', maxHeight: 145, objectFit: 'contain', borderRadius: 11, marginTop: 12, display: 'block'}} />
      </>
    ),
    openedBtn: 'Next Rally',
    rallyLabel: 'RALLY 1 / 3',
  },
  {
    closedTitle: ['GIFT 2', 'UNLOCKED!'],
    closedSubtitle: "You've received a COUPON!",
    closedImage: IMG.coupon,
    closedImageRot: -13.07,
    openedContent: (
      <>
        <p style={{fontSize: 48, lineHeight: 1.08}}>🎂📽️🍿🧋</p>
        <p style={{fontSize: 26, marginTop: 10, lineHeight: 0.9}}>Movie Date</p>
        <p style={{fontSize: 26, lineHeight: 0.9}}>you &amp; me? 👀</p>
        <p style={{fontSize: 16, marginTop: 12, lineHeight: 1.4, color: '#444'}}>Coupon include 1 dessert treat! Redeem it early before the movie ends.</p>
        <p style={{fontSize: 16, marginTop: 6, lineHeight: 1.4}}>(Hee-hee) <span style={{fontSize: 24}}>🎩🕶️🕺🎤</span></p>
      </>
    ),
    openedBtn: 'Next Rally',
    rallyLabel: 'RALLY 2 / 3',
  },
  {
    closedTitle: ['GIFT 3', 'UNLOCKED!'],
    closedSubtitle: "You've received\na SURPRISE GIFT!",
    closedImage: IMG.island,
    closedImageRot: 0,
    openedContent: (
      <>
        <p style={{fontSize: 56, lineHeight: 1.0}}>🎁</p>
        <p style={{fontSize: 30, lineHeight: 0.88, marginTop: 4}}>EXCLUSIVE</p>
        <p style={{fontSize: 30, lineHeight: 0.88}}>BATAM TRIP</p>
        <p style={{fontSize: 30, lineHeight: 0.88}}>🗣️🗣️🗣️</p>
        <p style={{fontSize: 15, marginTop: 10, lineHeight: 1.4}}>Enjoy 1x night free stay</p>
        <p style={{fontSize: 15, lineHeight: 1.4}}>Redeem anytime 🏝️</p>
      </>
    ),
    openedBtn: 'Tap to continue',
    rallyLabel: 'RALLY 3 / 3',
  },
];

// ─────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────

function CourtBackground() {
  return (
    <>
      <div className="g-back-wall" />
      <div className="g-court-floor" />
      <img className="g-court-horizon" src={IMG.horizon} alt="" />
    </>
  );
}

interface HUDProps {
  rallyIndex: number;
  onGiftBox: () => void;
}
function GameHUD({ rallyIndex, onGiftBox }: HUDProps) {
  return (
    <div className="g-hud">
      <div className="g-rally-badge">RALLY {rallyIndex + 1} / 3</div>
      <button className="g-gift-btn" onClick={onGiftBox}>
        <img src={IMG.giftIcon} alt="" />
        <span>Gift Box</span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN GAME COMPONENT
// ─────────────────────────────────────────────
export default function BirthdayGame() {
  const [screen, setScreen] = useState<Screen>('intro');
  const [rallyIndex, setRallyIndex] = useState(0);          // 0,1,2
  const [unlockedGifts, setUnlockedGifts] = useState(0);   // 0..3
  const [prevScreen, setPrevScreen] = useState<Screen>('serve');
  const [showRipple, setShowRipple] = useState(false);
  const [ripplePos, setRipplePos] = useState({ x: 195, y: 350 });
  const [giftboxViewGift, setGiftboxViewGift] = useState<number | null>(null);

  const missTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  const clearTimers = useCallback(() => {
    if (missTimer.current) { clearTimeout(missTimer.current); missTimer.current = null; }
    if (autoTimer.current) { clearTimeout(autoTimer.current); autoTimer.current = null; }
  }, []);

  // ── Ball motion values (imperative, always-current) ───────────
  const ballTopMV  = useMotionValue(BPOS.serve.top);
  const ballSizeMV = useMotionValue(BPOS.serve.size);
  // left auto-centers based on size
  const ballLeftMV = useTransform(ballSizeMV, (s: number) => CX - s / 2);
  // ball center Y — for dynamic z-index against net (NET_Y = 298)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ballCY = useTransform([ballTopMV, ballSizeMV] as any, ([t, s]: number[]) => t + s / 2);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ballZMV = useTransform(ballCY as any, (cy: number) => cy > NET_Y ? 20 : 5);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const netZMV  = useTransform(ballCY as any, (cy: number) => cy > NET_Y ? 5  : 20);

  const showBall = ['serve','ball_away','ball_back','spike','spike_away','rally_won'].includes(screen);

  // ── Imperative arc animations ─────────────────────────────────
  useEffect(() => {
    const FWD = [0, 0.42, 1] as [number, number, number];  // arc peak early
    const REV = [0, 0.58, 1] as [number, number, number];  // arc peak late

    if (screen === 'serve') {
      ballTopMV.set(BPOS.serve.top);
      ballSizeMV.set(BPOS.serve.size);
    } else if (screen === 'ball_away') {
      ballTopMV.set(BPOS.serve.top);
      ballSizeMV.set(BPOS.serve.size);
      const a1 = animate(ballTopMV,  [BPOS.serve.top,  BPOS.peak.top,  BPOS.opp.top],  { duration: DUR.serveAway / 1000, ease: 'easeInOut', times: FWD });
      const a2 = animate(ballSizeMV, [BPOS.serve.size, BPOS.peak.size, BPOS.opp.size], { duration: DUR.serveAway / 1000, ease: 'easeInOut', times: FWD });
      return () => { a1.stop(); a2.stop(); };
    } else if (screen === 'ball_back') {
      ballTopMV.set(BPOS.opp.top);
      ballSizeMV.set(BPOS.opp.size);
      const a1 = animate(ballTopMV,  [BPOS.opp.top,  BPOS.peak.top,  BPOS.spike.top],  { duration: DUR.awayBack / 1000, ease: 'easeInOut', times: REV });
      const a2 = animate(ballSizeMV, [BPOS.opp.size, BPOS.peak.size, BPOS.spike.size], { duration: DUR.awayBack / 1000, ease: 'easeInOut', times: REV });
      return () => { a1.stop(); a2.stop(); };
    } else if (screen === 'spike') {
      ballTopMV.set(BPOS.spike.top);
      ballSizeMV.set(BPOS.spike.size);
    } else if (screen === 'spike_away') {
      ballTopMV.set(BPOS.spike.top);
      ballSizeMV.set(BPOS.spike.size);
      const a1 = animate(ballTopMV,  [BPOS.spike.top,  BPOS.peak.top,  BPOS.opp.top],  { duration: DUR.spikeAway / 1000, ease: 'easeInOut', times: FWD });
      const a2 = animate(ballSizeMV, [BPOS.spike.size, BPOS.peak.size, BPOS.opp.size], { duration: DUR.spikeAway / 1000, ease: 'easeInOut', times: FWD });
      // after arc lands, ball drops to opponent floor
      const tid = setTimeout(() => {
        animate(ballTopMV,  BPOS.ground.top,  { duration: DUR.spikeGround / 1000, ease: 'easeIn' });
        animate(ballSizeMV, BPOS.ground.size, { duration: DUR.spikeGround / 1000, ease: 'easeIn' });
      }, DUR.spikeAway);
      return () => { a1.stop(); a2.stop(); clearTimeout(tid); };
    } else if (screen === 'rally_won') {
      // Ensure ball is resting on opponent floor (ground drop may have just finished)
      ballTopMV.set(BPOS.ground.top);
      ballSizeMV.set(BPOS.ground.size);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Transitions ───────────────────────────────────────────────

  function goToServe() {
    clearTimers();
    setScreen('serve');
  }

  function handleServe() {
    if (screen !== 'serve') return;
    clearTimers();
    setScreen('ball_away');
    autoTimer.current = setTimeout(() => {
      setScreen('ball_back');
      autoTimer.current = setTimeout(() => {
        setScreen('spike');
        // auto-miss after spike window
        missTimer.current = setTimeout(() => {
          setScreen('missed');
        }, DUR.spikeWindow);
      }, DUR.awayBack);
    }, DUR.serveAway);
  }

  function handleSpikeTap(e: React.MouseEvent | React.TouchEvent) {
    if (screen !== 'spike') return;
    clearTimers();

    // get tap position for ripple
    let cx = 195, cy = 350;
    if ('touches' in e && e.touches.length > 0) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else if ('clientX' in e) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      cx = (e as React.MouseEvent).clientX - rect.left;
      cy = (e as React.MouseEvent).clientY - rect.top;
    }
    setRipplePos({ x: cx, y: cy });
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 700);

    // Ball arcs away (850ms), drops to floor (350ms), then rally_won shows
    setScreen('spike_away');
    autoTimer.current = setTimeout(() => {
      setScreen('rally_won');
    }, DUR.spikeAway + DUR.spikeGround + 100);
  }

  function handleOpenGift() {
    setScreen('gift_closed');
  }

  function handleRevealGift() {
    setScreen('gift_opened');
  }

  function handleAfterGift() {
    const newUnlocked = unlockedGifts + 1;
    setUnlockedGifts(newUnlocked);
    if (rallyIndex < 2) {
      const nextRally = rallyIndex + 1;
      setRallyIndex(nextRally);
      goToServe();
    } else {
      // All rallies done → finale
      setScreen('finale_anim1');
      autoTimer.current = setTimeout(() => {
        setScreen('finale_anim2');
      }, DUR.autoFinale);
    }
  }

  function handlePlayAgain() {
    clearTimers();
    setRallyIndex(0);
    setUnlockedGifts(0);
    setScreen('intro');
  }

  function handleGiftBoxOpen() {
    clearTimers();
    setPrevScreen(screen);
    setGiftboxViewGift(null);
    setScreen('giftbox');
  }

  function handleGiftBoxBack() {
    if (giftboxViewGift !== null) {
      setGiftboxViewGift(null);
      setScreen('giftbox');
    } else {
      setScreen(prevScreen === 'giftbox' ? 'serve' : prevScreen);
    }
  }

  function handleGiftSlotTap(idx: number) {
    if (idx < unlockedGifts) {
      setGiftboxViewGift(idx);
      setScreen('gift_opened');
    }
  }

  // ── Swipe-up detection ────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (screen !== 'serve') return;
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    if (dy > 40) handleServe();
  }

  // Cleanup on unmount
  useEffect(() => () => clearTimers(), [clearTimers]);

  // ── Render helpers ────────────────────────────────────────────
  const currentGiftIdx = giftboxViewGift !== null ? giftboxViewGift : rallyIndex;
  const gift = GIFTS[currentGiftIdx] ?? GIFTS[0];

  // ─────────────────────────────────────────────────────────────
  // SCREEN: INTRO
  // ─────────────────────────────────────────────────────────────
  function renderIntro() {
    return (
      <motion.div
        key="intro"
        className="g-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="g-intro-bg" />
        {CONFETTI.map((c, i) => (
          <motion.div
            key={i}
            className="g-confetti"
            style={{ left: c.left, top: c.startY, width: c.w, height: c.h, background: c.color }}
            animate={{
              y: [0, 900],
              rotate: [c.rot, c.rot + 360],
              x: [0, c.swayX, 0, -c.swayX * 0.6, 0],
            }}
            transition={{
              duration: c.dur,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'linear',
              delay: c.delay,
              x: { ease: 'easeInOut', duration: c.dur },
            }}
          />
        ))}
        <motion.p
          className="g-intro-label"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >BIRTHDAY RALLY</motion.p>
        <div className="g-intro-title">
          {['Happy', 'Birthday', 'Sabi!!!'].map((word, i) => (
            <motion.div
              key={word}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: 'easeOut' }}
            >{word}</motion.div>
          ))}
        </div>
        <div className="g-intro-body">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: 'easeOut' }}
          >
            <p>For your 26th birthday, you're invited to play a tiny volleyball rally.</p>
            <p style={{ marginTop: 16 }}>Win each rally to unlock a gift.</p>
            <p>Have fun!</p>
          </motion.div>
        </div>
        <div className="g-intro-btn-wrap">
          <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={() => setScreen('serve')}>
            Play Now
          </button>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN: GAME (serve / ball_away / ball_back / spike / missed / rally_won)
  // ─────────────────────────────────────────────────────────────
  function renderGame() {
    const isActive = ['serve','ball_away','ball_back','spike','spike_away','missed','rally_won'].includes(screen);
    if (!isActive) return null;

    return (
      <motion.div
        key="game"
        className="g-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Court */}
        <CourtBackground />

        {/* Ball shadow (serve state only) */}
        {screen === 'serve' && (
          <img className="g-ball-shadow" src={IMG.ballShadow} alt="" />
        )}

        {/* Swipe hand icon (serve state only) */}
        {screen === 'serve' && (
          <motion.img
            src={IMG.swipeHand}
            alt=""
            style={{ position: 'absolute', left: 143, top: 399, width: 129, height: 106, zIndex: 25, pointerEvents: 'none' }}
            animate={{ rotate: [-8, 5, -8], y: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Net — z-index is reactive to ball position; always in front when ball is on ground */}
        <motion.img
          className="g-net"
          src={IMG.net}
          alt=""
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          style={{ zIndex: screen === 'rally_won' ? 20 : netZMV as any, position: 'absolute' }}
        />

        {/* Animated ball — position driven by motion values */}
        {showBall && (
          <motion.div
            className="g-ball-wrap"
            style={{
              position: 'absolute',
              top: ballTopMV,
              left: ballLeftMV,
              width: ballSizeMV,
              height: ballSizeMV,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              zIndex: screen === 'rally_won' ? 5 : ballZMV as any,
              pointerEvents: 'none',
            }}
          >
            <motion.div
              style={{ position: 'relative', width: '100%', height: '100%' }}
              animate={screen === 'serve' ? { y: [0, -14, 0] } : { y: 0 }}
              transition={screen === 'serve' ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.1 }}
            >
              <img src={IMG.ball} alt="volleyball" />
            </motion.div>
          </motion.div>
        )}

        {/* Swipe hint overlay on serve */}
        {screen === 'serve' && (
          <div
            className="g-swipe-overlay"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={handleServe}
          />
        )}

        {/* Spike tap target */}
        {screen === 'spike' && (
          <div
            className="g-swipe-overlay"
            onClick={handleSpikeTap}
            onTouchStart={(e) => { e.preventDefault(); handleSpikeTap(e); }}
          />
        )}

        {/* Tap ripple effect on spike */}
        {showRipple && (
          <div
            className="g-tap-ripple"
            style={{
              left: ripplePos.x - 30,
              top: ripplePos.y - 30,
              width: 60, height: 60,
              zIndex: 35,
            }}
          />
        )}

        {/* HUD */}
        <GameHUD rallyIndex={rallyIndex} onGiftBox={handleGiftBoxOpen} />

        {/* Serve screen text */}
        {screen === 'serve' && (
          <>
            <div className="g-serve-title">
              <div>Your Turn</div>
              <div>to Serve</div>
            </div>
            <p className="g-serve-hint">Swipe up to serve</p>
          </>
        )}

        {/* Spike text */}
        {screen === 'spike' && (
          <div className="g-spike-text">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div>Tap to Spike</div>
              <div>now!</div>
            </motion.div>
          </div>
        )}

        {/* SPIKE!!! flash overlay during ball travel */}
        {screen === 'spike_away' && <SpikeFlash />}

        {/* Missed screen */}
        {screen === 'missed' && (
          <>
            <p className="g-missed-text">You missed :(</p>
            <div className="g-missed-btn-wrap">
              <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={goToServe}>
                Play Rally Again
              </button>
            </div>
          </>
        )}

        {/* Rally won screen */}
        {screen === 'rally_won' && (
          <>
            {/* All celebration elements appear together */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25 }}
            >
              <img className="g-popper-l" src={IMG.popperL} alt="" />
              <img className="g-popper-r" src={IMG.popperL} alt="" />
              <BurstConfetti />
              <p className="g-rally-won-title">NICE SPIKE!</p>
            </motion.div>
            <div className="g-rally-won-btn-wrap">
              <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={handleOpenGift}>
                Open Gift
              </button>
            </div>
          </>
        )}
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN: GIFT CLOSED
  // ─────────────────────────────────────────────────────────────
  function renderGiftClosed() {
    if (screen !== 'gift_closed') return null;
    return (
      <motion.div
        key="gift_closed"
        className="g-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        onClick={handleRevealGift}
        style={{ cursor: 'pointer' }}
      >
        <CourtBackground />
        <img className="g-net" src={IMG.net} alt="" style={{ zIndex: 5, position: 'absolute' }} />
        <div className="g-gift-dark-overlay" />
        <GameHUD rallyIndex={rallyIndex} onGiftBox={handleGiftBoxOpen} />

        {/* Title */}
        <div className="g-gift-title">
          {gift.closedTitle.map((line, i) => <div key={i}>{line}</div>)}
        </div>

        {/* Gift item image */}
        {gift.closedImage ? (
          <div className="g-gift-item-wrap">
            <motion.img
              src={gift.closedImage}
              alt="gift"
              style={{ width: 284, height: 284, objectFit: 'contain' }}
              animate={{ rotate: [gift.closedImageRot - 6, gift.closedImageRot + 6, gift.closedImageRot - 6] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        ) : (
          <div className="g-gift-item-wrap" style={{ fontSize: 120, textAlign: 'center', top: 270, width: 284 }}>
            🎁
          </div>
        )}

        {/* Subtitle */}
        <p className="g-gift-subtitle" style={{ whiteSpace: 'pre-line' }}>
          {gift.closedSubtitle}
        </p>

        <p className="g-gift-tap-hint">Tap to Open</p>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN: GIFT OPENED
  // ─────────────────────────────────────────────────────────────
  function renderGiftOpened() {
    if (screen !== 'gift_opened') return null;
    const isFromGiftBox = giftboxViewGift !== null;

    return (
      <motion.div
        key="gift_opened"
        className="g-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CourtBackground />
        <img className="g-net" src={IMG.net} alt="" style={{ zIndex: 5, position: 'absolute' }} />
        <div className="g-gift-opened-overlay" />
        <GameHUD rallyIndex={rallyIndex} onGiftBox={() => {}} />

        {/* Rain confetti for gift 3 (above card) */}
        {currentGiftIdx === 2 && <RainConfetti />}

        {/* Card slides up from below */}
        <motion.div
          className="g-gift-card g-gift-card-big"
          initial={{ y: 700, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        >
          {currentGiftIdx === 2 ? (
            <motion.div
              animate={{ x: [0, -10, 10, -8, 8, -5, 5, -3, 3, 0] }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.45 }}
            >
              {gift.openedContent}
            </motion.div>
          ) : gift.openedContent}
        </motion.div>

        <div className="g-gift-opened-btn-wrap">
          {isFromGiftBox ? (
            <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={handleGiftBoxBack}>
              Back to Gift Box
            </button>
          ) : (
            <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={handleAfterGift}>
              {gift.openedBtn}
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN: FINALE (shared background, text fades between states)
  // ─────────────────────────────────────────────────────────────
  function renderFinale() {
    if (!['finale_anim1', 'finale_anim2'].includes(screen)) return null;
    return (
      <motion.div
        key="finale"
        className="g-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Persistent background — does NOT re-mount between anim1/anim2 */}
        <CourtBackground />
        <img className="g-net" src={IMG.net} alt="" style={{ zIndex: 5, position: 'absolute' }} />
        <div className="g-finale-overlay" style={{ background: 'rgba(0,0,0,0.72)' }} />
        <GameHUD rallyIndex={2} onGiftBox={screen === 'finale_anim2' ? handleGiftBoxOpen : () => {}} />

        {/* Only the text content fades between states */}
        <AnimatePresence mode="wait">
          {screen === 'finale_anim1' && (
            <motion.div
              key="anim1-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
            >
              <img className="g-finale-popper" src={IMG.popperFinale} alt="" style={{ pointerEvents: 'none' }} />
              <p className="g-finale-anim1-title">YOU'VE UNLOCKED 3 GIFTS!</p>
            </motion.div>
          )}
          {screen === 'finale_anim2' && (
            <motion.div
              key="anim2-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{ position: 'absolute', inset: 0 }}
            >
              <div className="g-finale-anim2-title">
                <div>Happy 26TH</div>
                <div>Birthday</div>
                <div>Sabi!!!</div>
              </div>
              <div className="g-finale-sub">
                <div>HOPE YOU ENJOYED</div>
                <div>THIS SHORT RALLY</div>
              </div>
              <div className="g-finale-btns">
                <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={handlePlayAgain}>
                  Play Again
                </button>
                <button className="g-btn g-btn-light" style={{ width: '100%' }} onClick={handleGiftBoxOpen}>
                  View Gifts
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SCREEN: GIFT BOX
  // ─────────────────────────────────────────────────────────────
  function renderGiftBox() {
    if (screen !== 'giftbox') return null;

    const giftLabels = [
      { unlocked: '💌  LETTER', locked: ['🔒', 'Oopsie, you need to win the', '1st rally to receive the gift'] },
      { unlocked: '🎟️  TICKET', locked: ['🔒', 'Oopsie, you need to win the', '2nd rally to receive the gift'] },
      { unlocked: '🏝️  BATAM TRIP', locked: ['🔒', 'Oopsie, you need to win the', '3rd rally to receive the gift'] },
    ];

    return (
      <motion.div
        key="giftbox"
        className="g-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="g-giftbox-bg" />

        <button className="g-back-btn" onClick={handleGiftBoxBack}>
          <span>Back</span>
        </button>

        <p className="g-giftbox-label">COLLECTED GIFTS</p>
        <p className="g-giftbox-title">GIFT BOX</p>
        <p className="g-giftbox-sub">Tap a gift to revisit what you've unlocked.</p>

        <div className="g-gift-slots">
          {giftLabels.map((g, i) => {
            const isOpen = i < unlockedGifts;
            return (
              <button
                key={i}
                className={`g-gift-slot ${isOpen ? 'g-gift-slot-open' : ''}`}
                onClick={() => handleGiftSlotTap(i)}
              >
                {isOpen ? (
                  <span className="g-gift-slot-label">{g.unlocked}</span>
                ) : (
                  <div className="g-gift-slot-locked">
                    {g.locked.map((line, j) => <div key={j}>{line}</div>)}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Play Again button only when all 3 unlocked */}
        {unlockedGifts === 3 && (
          <div className="g-giftbox-play-btn-wrap">
            <button className="g-btn g-btn-orange" style={{ width: '100%' }} onClick={handlePlayAgain}>
              Play Again
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="g-viewport">
      <div className="g-frame">
        <AnimatePresence mode="wait">
          {screen === 'intro' && renderIntro()}
          {['serve','ball_away','ball_back','spike','spike_away','missed','rally_won'].includes(screen) && renderGame()}
          {screen === 'gift_closed' && renderGiftClosed()}
          {screen === 'gift_opened' && renderGiftOpened()}
          {['finale_anim1', 'finale_anim2'].includes(screen) && renderFinale()}
          {screen === 'giftbox' && renderGiftBox()}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BURST CONFETTI (rally won celebration)
// ─────────────────────────────────────────────
function BurstConfetti() {
  const pieces = [
    { left: 158, top: 191, color: '#ffe43f', rot: -14.77 },
    { left: 112, top: 197, color: '#f97316', rot: -24 },
    { left:  84, top: 206, color: '#88d8ff', rot:   7 },
    { left: 166, top: 204, color: '#ffe43f', rot: -17 },
    { left:  95, top: 170, color: '#f97316', rot: -19 },
    { left: 145, top: 180, color: '#88d8ff', rot:  10 },
    { left: 244, top: 160, color: '#ffe43f', rot:  25 },
    { left: 101, top: 247, color: '#f97316', rot: -14 },
    { left: 271, top: 221, color: '#ffe43f', rot:  18 },
    { left: 190, top: 202, color: '#f97316', rot:  36 },
    { left: 136, top: 181, color: '#88d8ff', rot: -25 },
    { left: 163, top: 240, color: '#ffe43f', rot:  28 },
    { left: 284, top: 159, color: '#f97316', rot:  -4 },
    { left: 159, top: 171, color: '#88d8ff', rot:  14 },
    { left: 103, top: 186, color: '#ffe43f', rot: -31 },
    { left: 306, top: 256, color: '#f97316', rot:  29 },
  ];

  return (
    <>
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], y: [0, -20, -30, -50] }}
          transition={{ duration: 1.2, delay: i * 0.03, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            left: p.left, top: p.top,
            width: 6, height: 12,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            zIndex: 8,
          }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────
// RAIN CONFETTI (gift 3 opened — continuous fall)
// ─────────────────────────────────────────────
function RainConfetti() {
  const colors = ['#ffe43f', '#f97316', '#88d8ff', '#ffffff', '#ff6b9d', '#a8ff78'];
  const pieces = Array.from({ length: 42 }, (_, i) => ({
    left: Math.round((i * 9.5 + (i % 3) * 17) % 390),
    startY: -Math.round((i * 29) % 130) - 10,
    color: colors[i % colors.length],
    rot: Math.round((i * 53) % 360) - 180,
    w: [5, 6, 7, 8, 9][i % 5],
    h: [9, 10, 11, 12, 13, 14][i % 6],
    dur: 1.8 + (i * 0.17) % 2.2,
    delay: (i * 0.19) % 3.8,
    swayX: (i % 2 === 0 ? 1 : -1) * (6 + (i % 4) * 3),
  }));

  return (
    <>
      {pieces.map((p, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.startY,
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: 2,
            zIndex: 30,
            pointerEvents: 'none',
          }}
          animate={{
            y: [0, 900],
            rotate: [p.rot, p.rot + 360],
            x: [0, p.swayX, 0, -p.swayX * 0.6, 0],
          }}
          transition={{
            duration: p.dur,
            repeat: Infinity,
            repeatType: 'loop',
            ease: 'linear',
            delay: p.delay,
            x: { ease: 'easeInOut', duration: p.dur },
          }}
        />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────
// SPIKE FLASH (diagonal text sweep on spike_away)
// ─────────────────────────────────────────────
function SpikeFlash() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -220, y: 180 }}
      animate={{ opacity: [0, 1, 1, 0], x: [-220, 0, 220], y: [180, 20, -140] }}
      transition={{ duration: 0.65, ease: 'linear', times: [0, 0.15, 0.75, 1] }}
      style={{
        position: 'absolute',
        left: 195,
        top: 300,
        width: 560,
        marginLeft: -280,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        fontFamily: "'Jersey 15', monospace",
        fontSize: 185,
        color: '#f97316',
        textAlign: 'center',
        lineHeight: 0.88,
        transform: 'rotate(-18.61deg)',
        whiteSpace: 'nowrap',
        transformOrigin: 'center center',
      }}>
        SPIKE!!!
      </div>
    </motion.div>
  );
}
