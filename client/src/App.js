import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './index.css';

// Components
import MainMenu from './components/MainMenu';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import VoteResults from './components/VoteResults';
import { ToastProvider, useToast } from './components/Toast';

// Seleccionar endpoint de Socket.IO según entorno (dev/prod)
// - En desarrollo con CRA (localhost:3000) conectamos a 5000
// - En producción usamos el mismo origen que sirve la app
const SOCKET_URL = (typeof window !== 'undefined'
  && window.location.hostname === 'localhost'
  && (window.location.port === '3000' || window.location.port === '5173'))
  ? 'http://localhost:5000'
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000');
const socket = io(SOCKET_URL, { withCredentials: true });

const STORAGE_KEYS = {
  gameId: 'impostor-gameId',
  playerId: 'impostor-playerId',
  username: 'impostor-username'
};

function InnerApp() {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [username, setUsername] = useState('');
  const [currentScreen, setCurrentScreen] = useState('menu'); // menu, lobby, game, results
  const [voteResult, setVoteResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isSpectator, setIsSpectator] = useState(false);
  const autoJoinTriedRef = useRef(false);
  const playerIdRef = useRef(null);
  const usernameRef = useRef('');
  const { showToast } = useToast();
  const lastStatusRef = useRef(null);

  // joinGame debe declararse antes de usarlo en efectos/dependencias
  const joinGame = useCallback((gameId, username) => {
    const savedPlayerId = localStorage.getItem(STORAGE_KEYS.playerId);
    socket.emit('join-game', { gameId, username, playerId: savedPlayerId || null }, (response) => {
      if (response.success) {
        setPlayerId(response.playerId);
        playerIdRef.current = response.playerId;
        setUsername(username);
        usernameRef.current = username;
        setGameId(gameId);
        setGameState(response.gameState);
        setIsSpectator(response.isSpectator || false);
        // Persistir sesión
        localStorage.setItem(STORAGE_KEYS.gameId, gameId);
        localStorage.setItem(STORAGE_KEYS.playerId, response.playerId);
        localStorage.setItem(STORAGE_KEYS.username, username);
        
        if (response.isSpectator) {
          // Si es espectador y el juego está en progreso, ir directamente al juego
          if (response.gameState.status === 'playing') {
            setCurrentScreen('game');
          } else {
            setCurrentScreen('lobby');
          }
          showToast('Te has unido como espectador. Puedes observar el juego pero no puedes participar.', { type: 'warning', duration: 4000 });
        } else {
          setCurrentScreen('lobby');
        }
      } else {
        showToast(`Error: ${response.error}`, { type: 'danger', duration: 4000 });
      }
    });
  }, [showToast]);

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionStatus('connected');
      // Intentar reingresar automáticamente solo una vez por conexión
      if (!autoJoinTriedRef.current) {
        autoJoinTriedRef.current = true;
        const savedGameId = localStorage.getItem(STORAGE_KEYS.gameId);
        const savedPlayerId = localStorage.getItem(STORAGE_KEYS.playerId);
        const savedUsername = localStorage.getItem(STORAGE_KEYS.username);
        if (savedGameId && (savedPlayerId || savedUsername)) {
          socket.emit('join-game', { gameId: savedGameId, username: savedUsername || '', playerId: savedPlayerId || null }, (response) => {
            if (response?.success) {
              setPlayerId(response.playerId);
              setUsername(savedUsername || '');
              playerIdRef.current = response.playerId;
              usernameRef.current = savedUsername || '';
              setGameId(savedGameId);
              setGameState(response.gameState);
              setIsSpectator(response.isSpectator || false);
            }
          });
        }
      }
    });

    socket.on('spectator-joined', ({ username: spectatorName }) => {
      const name = spectatorName || 'Un jugador';
      // Evitar duplicar toast al propio espectador (ya se muestra uno al unirse)
      if ((usernameRef.current || '').trim() === (spectatorName || '').trim()) return;
      showToast(`El jugador ${name} se ha unido a la sala como espectador`, { type: 'warning', duration: 3500 });
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('game-state', (state) => {
      setGameState(state);
      // Toast de inicio de juego: transición waiting -> playing
      if (lastStatusRef.current !== 'playing' && state.status === 'playing') {
        showToast('¡El juego ha comenzado!', { type: 'success', duration: 3000 });
      }
      lastStatusRef.current = state.status;
      if (state.status === 'playing') {
        setCurrentScreen('game');
      } else if (state.status === 'waiting') {
        setCurrentScreen('lobby');
        // Si estamos en lobby y este cliente no figura como jugador, auto-convertir desde espectador a jugador
        const currentPlayerId = playerIdRef.current;
        const currentUsername = usernameRef.current;
        const isInPlayers = Array.isArray(state.players) && state.players.some(p => p.id === currentPlayerId);
        if (!isInPlayers) {
          setIsSpectator(false);
          const name = (currentUsername && currentUsername.trim()) || (localStorage.getItem('impostor-username') || '').trim();
          if (name && state.gameId) {
            // Intentar unirse como jugador normal usando el mismo nombre
            joinGame(state.gameId, name);
          }
        }
      }
    });

    socket.on('vote-result', (result) => {
      setVoteResult(result);
      setCurrentScreen('results');
      
      // Solo avanzar automáticamente si no hay ganador
      if (!result.winner) {
        setTimeout(() => {
          setCurrentScreen('game');
          setVoteResult(null);
        }, 5000);
      }
      // Si hay ganador, esperar a que el usuario elija una opción
    });

    socket.on('host-disconnected', (data) => {
      showToast(data.message || 'El anfitrión ha abandonado el juego.', { type: 'danger', duration: 4500 });
      resetGame();
    });

    return () => {
      socket.off('connect');
      socket.off('spectator-joined');
      socket.off('disconnect');
      socket.off('game-state');
      socket.off('vote-result');
      socket.off('host-disconnected');
    };
  }, [joinGame, showToast]);

  const resetGame = () => {
    setGameState(null);
    setPlayerId(null);
    setGameId(null);
    setUsername('');
    setCurrentScreen('menu');
    setVoteResult(null);
    setIsSpectator(false);
    // Limpiar persistencia
    localStorage.removeItem(STORAGE_KEYS.gameId);
    localStorage.removeItem(STORAGE_KEYS.playerId);
  };

  const createGame = (enableBots = false) => {
    socket.emit('create-game', { enableBots }, (response) => {
      if (response.success) {
        setGameId(response.gameId);
      }
    });
  };

  

  const startGame = (totalRounds = 3) => {
    socket.emit('start-game', { totalRounds }, (response) => {
      if (!response.success) {
        showToast(`Error: ${response.error}`, { type: 'danger', duration: 4000 });
      }
    });
  };

  const continueRound = () => {
    socket.emit('continue-round', (response) => {
      if (response.success) {
        setCurrentScreen('game');
        setVoteResult(null);
      } else {
        showToast('Error: No se pudo continuar a la siguiente ronda', { type: 'danger', duration: 4000 });
      }
    });
  };

  const vote = (targetId) => {
    socket.emit('vote', { targetId }, (response) => {
      if (!response.success) {
        showToast('Error: No se pudo enviar el voto', { type: 'danger', duration: 3500 });
      }
    });
  };

  const handleExitGame = () => {
    // Salir completamente del juego (avisar al servidor si estamos en una sala)
    const savedGameId = localStorage.getItem(STORAGE_KEYS.gameId);
    if (savedGameId) {
      socket.emit('leave-lobby', () => {
        resetGame();
      });
    } else {
      resetGame();
    }
  };

  const handleNewGame = () => {
    // Nuevo juego con los mismos jugadores - resetear solo el estado del juego
    // pero mantener la sala y jugadores
    setCurrentScreen('lobby');
    setVoteResult(null);
    
    // El servidor necesitará una nueva función para resetear el estado del juego
    socket.emit('reset-game', (response) => {
      if (response.success) {
        setGameState(response.gameState);
      } else {
        showToast('Error: No se pudo resetear el juego', { type: 'danger', duration: 4000 });
      }
    });
  };

  if (connectionStatus !== 'connected') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-lg">
            {connectionStatus === 'connecting' ? '⚽ Conectando al servidor...' : '⚠️ Conexión perdida. Reconectando...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {currentScreen === 'menu' && (
        <MainMenu 
          onCreateGame={createGame}
          onJoinGame={joinGame}
          gameId={gameId}
        />
      )}
      
      {currentScreen === 'lobby' && (
        <GameLobby 
          gameState={gameState}
          username={username}
          onStartGame={startGame}
          onLeaveGame={() => {
            socket.emit('leave-lobby', () => {
              resetGame();
            });
          }}
        />
      )}
      
      {currentScreen === 'game' && (
        <GameBoard 
          gameState={gameState}
          playerId={playerId}
          onVote={vote}
          isSpectator={isSpectator}
        />
      )}
      
      {currentScreen === 'results' && voteResult && (
        <VoteResults 
          result={voteResult}
          gameState={gameState}
          username={username}
          onContinueRound={continueRound}
          onExitGame={handleExitGame}
          onNewGame={handleNewGame}
          isSpectator={isSpectator}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <InnerApp />
    </ToastProvider>
  );
}

export default App;