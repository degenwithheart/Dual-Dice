import React, { useEffect, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { useGame, useMultiplayer, useGambaProvider } from 'gamba-react-v2'
import { GambaUi, useSound } from 'gamba-react-ui-v2'
import { BPS_PER_WHOLE } from 'gamba-core-v2'
import { PLATFORM_CREATOR_ADDRESS, MULTIPLAYER_FEE } from '../../../constants'
import { DiceGroup } from '../three/DiceGroup'
import { Effect } from '../three/Effect'
import styled from 'styled-components'
import { parseGameConfig, shorten, formatDuration, sol, checkWin } from '../utils'
import { GameConfig } from '../types'

// Import sounds (using base64 encoded minimal sounds as placeholders)
const SOUND_ROLL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ=='
const SOUND_WIN = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ=='
const SOUND_LOSE = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgQ=='

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`

const InfoOverlay = styled.div`
  position: absolute;
  left: 50%;
  bottom: 20px;
  transform: translateX(-50%);
  z-index: 10;
`

const InfoCard = styled.div`
  background: linear-gradient(135deg, rgba(20, 20, 30, 0.95), rgba(12, 12, 20, 0.9));
  padding: 20px 28px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 32px;
  backdrop-filter: blur(10px);
`

const PlayerCard = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: ${({ $highlight }) =>
    $highlight
      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))'
      : 'rgba(255, 255, 255, 0.03)'};
  border: 1px solid ${({ $highlight }) => ($highlight ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.08)')};
  min-width: 180px;
`

const PlayerAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
`

const PlayerInfo = styled.div`
  flex: 1;
`

const PlayerName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  margin-bottom: 2px;
`

const PlayerPrediction = styled.div`
  font-size: 0.75rem;
  color: #aaa;
`

const VSBadge = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 24px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.08));
  border: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  letter-spacing: 1px;
  color: #fff;
`

const StatusBar = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
`

const StatusBadge = styled.div<{ $waiting?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  text-transform: uppercase;
  font-weight: 600;
  border: 1px solid ${({ $waiting }) => ($waiting ? '#ffc107' : '#42ff78')};
  backdrop-filter: blur(10px);
`

const StatusDot = styled.span<{ $waiting?: boolean }>`
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background: ${({ $waiting }) => ($waiting ? '#ffc107' : '#42ff78')};
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`

const TimerText = styled.div`
  margin-top: 6px;
  color: #fff;
  font-size: 0.85rem;
  text-align: right;
  opacity: 0.9;
`

const ResultOverlay = styled(InfoCard)<{ $show: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  pointer-events: ${({ $show }) => ($show ? 'auto' : 'none')};
  transition: opacity 0.3s ease;
  flex-direction: column;
  gap: 16px;
  text-align: center;
  min-width: 300px;
`

const ResultTitle = styled.div<{ $win?: boolean }>`
  font-size: 2rem;
  font-weight: 700;
  color: ${({ $win }) => ($win ? '#42ff78' : '#ff5555')};
`

const ResultSubtitle = styled.div`
  font-size: 1.2rem;
  color: #ddd;
`

const ControlButton = styled.button<{ $variant?: 'primary' }>`
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  
  background: ${({ $variant }) =>
    $variant === 'primary'
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : '#333'};
  color: #fff;
  
  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const PredictionSelect = styled.select`
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #333;
  background: #222;
  color: #fff;
  font-size: 0.95rem;
  cursor: pointer;
  margin-right: 8px;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
`

export default function GameScreen({
  pk,
  onBack,
}: {
  pk: PublicKey
  onBack: () => void
}) {
  const { game: chainGame, metadata } = useGame(pk, { fetchMetadata: true })
  const { publicKey } = useWallet()
  const { join } = useMultiplayer()
  const gamba = useGambaProvider()
  const { anchorProvider } = gamba
  const currentToken = gamba.token
  const sounds = useSound({ roll: SOUND_ROLL, win: SOUND_WIN, lose: SOUND_LOSE })

  const [timeLeft, setTimeLeft] = useState(0)
  const [busy, setBusy] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [diceResults, setDiceResults] = useState<number[]>([])
  const [revealed, setRevealed] = useState(false)
  const [myPrediction, setMyPrediction] = useState<string>('over')

  // Timer
  useEffect(() => {
    if (!chainGame?.softExpirationTimestamp) return
    const end = Number(chainGame.softExpirationTimestamp) * 1000
    const tick = () => setTimeLeft(Math.max(end - Date.now(), 0))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [chainGame?.softExpirationTimestamp])

  const waiting = !!chainGame?.state.waiting
  const iAmInGame = !!publicKey && !!chainGame?.players.some((p) => p.user.equals(publicKey))

  // Parse game config
  const gameConfig = useMemo<GameConfig | null>(() => {
    if (!chainGame || !metadata) return null
    try {
      const makerKey = (chainGame as any).gameMaker.toBase58()
      const makerMeta = metadata[makerKey]
      return parseGameConfig(makerMeta)
    } catch {
      return null
    }
  }, [chainGame, metadata])

  // Get player assignments
  const playerAssignments = useMemo(() => {
    if (!chainGame || !metadata) return { player1: null, player2: null }
    
    const players = chainGame.players
    if (players.length === 0) return { player1: null, player2: null }

    const p1 = players[0]
    const p1Key = p1.user.toBase58()
    const p1Meta = metadata[p1Key]
    const p1Config = parseGameConfig(p1Meta)

    let p2 = null
    let p2Config = null
    if (players.length > 1) {
      p2 = players[1]
      const p2Key = p2.user.toBase58()
      const p2Meta = metadata[p2Key]
      p2Config = parseGameConfig(p2Meta)
    }

    return {
      player1: { pk: p1.user, config: p1Config },
      player2: p2 ? { pk: p2.user, config: p2Config } : null,
    }
  }, [chainGame, metadata])

  const handleJoin = async () => {
    if (!chainGame || !publicKey || !gameConfig || !currentToken) return
    setBusy(true)
    try {
      const decimals = currentToken.decimals || 9
      const lamports = chainGame.wager.toNumber()

      const joinMetadata = JSON.stringify({
        diceCount: gameConfig.diceCount,
        prediction: myPrediction,
        targetNumber: gameConfig.targetNumber,
      })

      await join({
        gameAccount: pk,
        mint: currentToken.mint,
        wager: lamports,
        creatorAddress: PLATFORM_CREATOR_ADDRESS,
        creatorFeeBps: Math.round(MULTIPLAYER_FEE * BPS_PER_WHOLE),
        metadata: joinMetadata,
      })
      
      sounds.play('roll', { playbackRate: 0.8 })
    } catch (e) {
      console.error('Join error:', e)
    } finally {
      setBusy(false)
    }
  }

  // Animate result when game settles
  useEffect(() => {
    const settled =
      !!chainGame && !chainGame.state.waiting && (chainGame.winnerIndexes?.length ?? 0) > 0
    if (!settled || revealed) return

    setRolling(true)
    sounds.play('roll')

    setTimeout(() => {
      // Generate random dice results for animation
      const results = Array.from(
        { length: gameConfig?.diceCount || 1 },
        () => Math.floor(Math.random() * 6) + 1,
      )
      setDiceResults(results)
      setRolling(false)
      setRevealed(true)

      // Check if current player won
      const winnerIdx = Number(chainGame.winnerIndexes[0])
      const isWinner = publicKey && chainGame.players[winnerIdx]?.user.equals(publicKey)
      sounds.play(isWinner ? 'win' : 'lose')
    }, 2500)
  }, [chainGame, revealed, sounds, gameConfig, publicKey])

  const total = diceResults.reduce((a, b) => a + b, 0)
  
  // Determine winner
  const winner = useMemo(() => {
    if (!chainGame || !revealed || chainGame.winnerIndexes.length === 0) return null
    const winIdx = Number(chainGame.winnerIndexes[0])
    return chainGame.players[winIdx]?.user
  }, [chainGame, revealed])

  const iWon = winner && publicKey && winner.equals(publicKey)

  return (
    <Container>
      {/* 3D Dice Scene */}
      <GambaUi.Portal target="screen">
        <Canvas
          orthographic
          camera={{ zoom: 60, position: [0, 0, 100] }}
          style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 100%)' }}
        >
          <React.Suspense fallback={null}>
            <DiceGroup
              count={gameConfig?.diceCount || 1}
              results={diceResults}
              rolling={rolling || waiting}
            />
          </React.Suspense>
          {rolling && <Effect color="white" />}
          {revealed && <Effect color={iWon ? '#42ff78' : '#ff5555'} />}
          <ambientLight intensity={2} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <pointLight position={[-5, -5, 5]} intensity={0.5} />
        </Canvas>

        {/* Status Badge */}
        <StatusBar>
          <StatusBadge $waiting={waiting}>
            <StatusDot $waiting={waiting} />
            {waiting ? 'Waiting for Players' : revealed ? 'Settled' : 'Rolling...'}
          </StatusBadge>
          {waiting && timeLeft > 0 && <TimerText>Starts in {formatDuration(timeLeft)}</TimerText>}
        </StatusBar>

        {/* Player Info */}
        <InfoOverlay>
          <InfoCard>
            <PlayerCard $highlight={winner?.equals(playerAssignments.player1?.pk!)}>
              <PlayerAvatar>{shorten(playerAssignments.player1?.pk!)[0]}</PlayerAvatar>
              <PlayerInfo>
                <PlayerName>{shorten(playerAssignments.player1?.pk!)}</PlayerName>
                <PlayerPrediction>
                  {playerAssignments.player1?.config
                    ? `${playerAssignments.player1.config.prediction} ${playerAssignments.player1.config.targetNumber}`
                    : 'Waiting...'}
                </PlayerPrediction>
              </PlayerInfo>
            </PlayerCard>

            <VSBadge>VS</VSBadge>

            <PlayerCard $highlight={winner?.equals(playerAssignments.player2?.pk!)}>
              {playerAssignments.player2 ? (
                <>
                  <PlayerAvatar>{shorten(playerAssignments.player2.pk)[0]}</PlayerAvatar>
                  <PlayerInfo>
                    <PlayerName>{shorten(playerAssignments.player2.pk)}</PlayerName>
                    <PlayerPrediction>
                      {playerAssignments.player2.config
                        ? `${playerAssignments.player2.config.prediction} ${playerAssignments.player2.config.targetNumber}`
                        : 'Waiting...'}
                    </PlayerPrediction>
                  </PlayerInfo>
                </>
              ) : (
                <PlayerInfo>
                  <PlayerName>Waiting...</PlayerName>
                  <PlayerPrediction>Open slot</PlayerPrediction>
                </PlayerInfo>
              )}
            </PlayerCard>
          </InfoCard>
        </InfoOverlay>

        {/* Result Overlay */}
        <ResultOverlay $show={revealed}>
          <ResultTitle $win={iWon}>{iWon ? '🎉 You Win!' : '💀 You Lose'}</ResultTitle>
          <ResultSubtitle>
            Total: {total}
            {gameConfig && ` (${gameConfig.prediction} ${gameConfig.targetNumber})`}
          </ResultSubtitle>
        </ResultOverlay>
      </GambaUi.Portal>

      {/* Controls */}
      <GambaUi.Portal target="controls">
        <ControlButton onClick={onBack} style={{ marginRight: 12 }}>
          ← Back to Lobby
        </ControlButton>

        {chainGame && !iAmInGame && !revealed && (
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <PredictionSelect
              value={myPrediction}
              onChange={(e) => setMyPrediction(e.target.value)}
              disabled={busy}
            >
              <option value="over">Over</option>
              <option value="under">Under</option>
              <option value="exact">Exact</option>
            </PredictionSelect>
            <ControlButton $variant="primary" onClick={handleJoin} disabled={busy}>
              {busy ? 'Joining...' : 'Join Game'}
            </ControlButton>
          </div>
        )}
      </GambaUi.Portal>
    </Container>
  )
}
