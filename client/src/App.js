import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './index.css';

// Components
import MainMenu from './components/MainMenu';
import GameLobby from './components/GameLobby';
import GameBoard from './components/GameBoard';
import VoteResults from './components/VoteResults';

const socket = io('http://localhost:5000');

function App() {
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [gameId, setGameId] = useState(null);
  const [username, setUsername] = useState('');
  const [currentScreen, setCurrentScreen] = useState('menu'); // menu, lobby, game, results
  const [voteResult, setVoteResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [isSpectator, setIsSpectator] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('game-state', (state) => {
      setGameState(state);
      if (state.status === 'playing') {
        setCurrentScreen('game');
      } else if (state.status === 'waiting') {
        setCurrentScreen('lobby');
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
      alert(data.message);
      resetGame();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('game-state');
      socket.off('vote-result');
      socket.off('host-disconnected');
    };
  }, []);

  const resetGame = () => {
    setGameState(null);
    setPlayerId(null);
    setGameId(null);
    setUsername('');
    setCurrentScreen('menu');
    setVoteResult(null);
    setIsSpectator(false);
  };

  const createGame = (enableBots = false) => {
    socket.emit('create-game', { enableBots }, (response) => {
      if (response.success) {
        setGameId(response.gameId);
      }
    });
  };

  const joinGame = (gameId, username) => {
    socket.emit('join-game', { gameId, username }, (response) => {
      if (response.success) {
        setPlayerId(response.playerId);
        setUsername(username);
        setGameId(gameId);
        setGameState(response.gameState);
        setIsSpectator(response.isSpectator || false);
        
        if (response.isSpectator) {
          // Si es espectador y el juego está en progreso, ir directamente al juego
          if (response.gameState.status === 'playing') {
            setCurrentScreen('game');
          } else {
            setCurrentScreen('lobby');
          }
          alert('Te has unido como espectador. Puedes observar el juego pero no puedes participar.');
        } else {
          setCurrentScreen('lobby');
        }
      } else {
        alert(`Error: ${response.error}`);
      }
    });
  };

  const startGame = (totalRounds = 3) => {
    socket.emit('start-game', { totalRounds }, (response) => {
      if (!response.success) {
        alert(`Error: ${response.error}`);
      }
    });
  };

  const continueRound = () => {
    socket.emit('continue-round', (response) => {
      if (response.success) {
        setCurrentScreen('game');
        setVoteResult(null);
      } else {
        alert('Error: No se pudo continuar a la siguiente ronda');
      }
    });
  };

  const vote = (targetId) => {
    socket.emit('vote', { targetId }, (response) => {
      if (!response.success) {
        alert('Error: No se pudo enviar el voto');
      }
    });
  };

  const handleExitGame = () => {
    // Salir completamente del juego
    resetGame();
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
        alert('Error: No se pudo resetear el juego');
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
          onLeaveGame={resetGame}
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

export default App;