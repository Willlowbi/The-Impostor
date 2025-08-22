import React, { useState } from 'react';
import { Icons } from './Icons';

const GameBoard = ({ gameState, playerId, onVote }) => {
  const [selectedVote, setSelectedVote] = useState(null);

  if (!gameState) return null;

  const alivePlayers = gameState.players.filter(p => p.isAlive);

  const handleVote = (targetId) => {
    if (gameState.hasVoted) return;
    
    setSelectedVote(targetId);
    onVote(targetId);
  };

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-2">
            <Icons.Soccer className="w-8 h-8 text-warning-400 mr-3" />
            <div className="text-center">
              <h1 className="text-3xl font-bold text-warning-400">Turno {gameState.round}</h1>
              {gameState.totalRounds > 1 && (
                <p className="text-sm text-warning-300">
                  Ronda {gameState.currentRound} de {gameState.totalRounds} del Juego
                </p>
              )}
            </div>
          </div>
          <div className="text-lg text-gray-300">
            {gameState.allVoted ? '¡Todos han votado! Procesando resultados...' : 
             `${gameState.voteCounts}/${gameState.totalAlivePlayers} jugadores han votado`}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tu Carta */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-center mb-4">
              <Icons.Cards className="w-6 h-6 text-primary-400 mr-2" />
              <h2 className="text-xl font-semibold">Tu Identidad</h2>
            </div>
            <div className={`card text-center transform transition-all duration-300 hover:scale-105 ${
              gameState.isImpostor ? 'impostor-card' : ''
            }`}>
              {gameState.isImpostor ? (
                <div className="animate-fade-in">
                  <Icons.Mask className="w-16 h-16 mx-auto mb-4 text-red-200" />
                  <h3 className="text-2xl font-bold mb-2">IMPOSTOR</h3>
                  <p className="text-red-200">
                    ¡Eres el impostor! Trata de mezclarte y eliminar a los jugadores inocentes.
                  </p>
                </div>
              ) : gameState.currentPlayer ? (
                <div className="animate-fade-in">
                  <img 
                    src={gameState.currentPlayer.photo} 
                    alt={gameState.currentPlayer.name}
                    className="w-32 h-32 mx-auto mb-4 rounded-full object-cover border-4 border-white border-opacity-30"
                    onError={(e) => {
                      // Usar un generador de avatar más confiable
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(gameState.currentPlayer.name)}&background=22c55e&color=ffffff&size=128&font-size=0.6`;
                    }}
                  />
                  <h3 className="text-xl font-bold mb-2">{gameState.currentPlayer.name}</h3>
                  <p className="text-primary-200">
                    ¡Eres inocente! Encuentra y vota al impostor.
                  </p>
                </div>
              ) : (
                <div className="animate-pulse">
                  <div className="w-32 h-32 bg-gray-300 bg-opacity-30 rounded-full mx-auto mb-4"></div>
                  <div className="h-4 bg-gray-300 bg-opacity-30 rounded mx-auto"></div>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Jugadores */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-center mb-4">
              <Icons.Users className="w-6 h-6 text-success-400 mr-2" />
              <h2 className="text-xl font-semibold">Jugadores Vivos</h2>
            </div>
            <div className="space-y-3">
              {alivePlayers.map((player) => (
                <div 
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                    player.id === playerId 
                      ? 'bg-primary-500 bg-opacity-30 ring-2 ring-primary-400' 
                      : 'bg-white bg-opacity-10'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {player.isBot ? (
                      <Icons.Robot className="w-4 h-4 text-primary-400" />
                    ) : (
                      <Icons.User className="w-4 h-4 text-success-400" />
                    )}
                    <span className="font-medium">{player.username}</span>
                    {player.isBot && (
                      <span className="text-xs px-2 py-1 bg-primary-400 bg-opacity-30 text-primary-200 rounded-full">
                        Bot
                      </span>
                    )}
                    {player.id === playerId && (
                      <span className="text-xs px-2 py-1 bg-primary-400 bg-opacity-30 text-primary-200 rounded-full">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">Vivo</div>
                </div>
              ))}
            </div>

            {gameState.players.filter(p => !p.isAlive).length > 0 && (
              <>
                <div className="flex items-center justify-center mt-6 mb-3">
                  <Icons.Skull className="w-5 h-5 text-gray-400 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-400">Eliminados</h3>
                </div>
                <div className="space-y-2">
                  {gameState.players.filter(p => !p.isAlive).map((player) => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-danger-500 bg-opacity-20"
                    >
                      <div className="flex items-center space-x-3">
                        <Icons.Skull className="w-4 h-4 text-danger-400" />
                        <span className="font-medium text-gray-300 line-through">{player.username}</span>
                        {player.isBot && (
                          <span className="text-xs px-1 py-0.5 bg-gray-500 bg-opacity-30 text-gray-300 rounded">
                            Bot
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-danger-300">Eliminado</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Panel de Votación */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-center mb-4">
              <Icons.Vote className="w-6 h-6 text-warning-400 mr-2" />
              <h2 className="text-xl font-semibold">Emite tu Voto</h2>
            </div>
            
            {gameState.hasVoted ? (
              <div className="card text-center bg-success-500 bg-opacity-20">
                <Icons.Check className="w-12 h-12 mx-auto mb-3 text-success-400" />
                <h3 className="text-lg font-bold mb-2">¡Voto Enviado!</h3>
                <p className="text-success-200">
                  {selectedVote === 'skip' 
                    ? "Decidiste saltar esta ronda." 
                    : `Votaste por ${alivePlayers.find(p => p.id === selectedVote)?.username || 'Desconocido'}.`
                  }
                </p>
                <div className="flex items-center justify-center mt-3">
                  <Icons.Settings className="w-4 h-4 text-gray-300 mr-2 animate-spin" />
                  <p className="text-sm text-gray-300">
                    Esperando a otros jugadores...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {alivePlayers.filter(p => p.id !== playerId).map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleVote(player.id)}
                    className="player-card w-full text-left hover:bg-danger-500 hover:bg-opacity-20 hover:ring-danger-400"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icons.X className="w-4 h-4 text-danger-400" />
                        <span className="font-medium">{player.username}</span>
                        {player.isBot && (
                          <span className="text-xs px-1 py-0.5 bg-primary-400 bg-opacity-30 text-primary-200 rounded">
                            Bot
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-gray-300 flex items-center space-x-1">
                        <Icons.X className="w-3 h-3" />
                        <span>Eliminar</span>
                      </span>
                    </div>
                  </button>
                ))}
                
                <button
                  onClick={() => handleVote('skip')}
                  className="player-card w-full text-left hover:bg-warning-500 hover:bg-opacity-20"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Icons.Skip className="w-4 h-4 text-warning-400" />
                      <span className="font-medium">Saltar Voto</span>
                    </div>
                    <span className="text-sm text-gray-300 flex items-center space-x-1">
                      <Icons.Skip className="w-3 h-3" />
                      <span>No votar</span>
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Instrucciones del Juego */}
        <div className="mt-12 text-center text-sm text-gray-400 space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <Icons.Vote className="w-4 h-4" />
            <span>Vota por quien crees que es el impostor</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Icons.Users className="w-4 h-4" />
            <span>El jugador con más votos será eliminado</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <Icons.Trophy className="w-4 h-4" />
            <span>Los inocentes ganan eliminando al impostor, el impostor gana sobreviviendo hasta los últimos 2</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;