import React, { useState } from 'react';
import { Icons } from './Icons';

const GameLobby = ({ gameState, username, onStartGame, onLeaveGame }) => {
  const [totalRounds, setTotalRounds] = useState(3);
  
  if (!gameState) return null;
  
  const canStart = gameState.players.length >= 3;
  const isHost = gameState.players[0]?.username === username;

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameState.gameId).then(() => {
      alert('¡Código copiado al portapapeles!');
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full animate-fade-in">
        {/* Código de la sala prominente */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Icons.Stadium className="w-8 h-8 text-warning-400 mr-2" />
            <h1 className="text-3xl font-bold text-warning-400">Sala de Espera</h1>
          </div>
          <div className="bg-gradient-to-r from-warning-500 to-warning-600 p-6 rounded-xl shadow-2xl mb-4 border-2 border-warning-300">
            <div className="flex items-center justify-center mb-2">
              <Icons.Cards className="w-5 h-5 text-black mr-2" />
              <p className="text-sm font-medium text-black">Código de la Sala</p>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <span className="font-mono text-4xl font-bold text-black tracking-wider bg-white bg-opacity-20 px-4 py-2 rounded-lg">{gameState.gameId}</span>
              <button 
                onClick={copyGameCode}
                className="bg-black bg-opacity-30 hover:bg-opacity-50 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg flex items-center space-x-2"
              >
                <Icons.Copy className="w-4 h-4" />
                <span>Copiar</span>
              </button>
            </div>
            <div className="flex items-center justify-center mt-2">
              <Icons.Share className="w-4 h-4 text-black mr-2" />
              <p className="text-sm text-black text-opacity-90 font-medium">
                Comparte este código con tus amigos para que se unan al partido
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Icons.Users className="w-5 h-5 text-primary-400" />
              <h2 className="text-xl font-semibold">Jugadores ({gameState.players.length}/6)</h2>
            </div>
            <div className="text-sm text-gray-300">
              {canStart ? '¡Listos para empezar!' : `Faltan ${3 - gameState.players.length} jugadores más`}
            </div>
          </div>
          
          <div className="grid gap-3">
            {gameState.players.map((player, index) => (
              <div 
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  player.username === username 
                    ? 'bg-primary-500 bg-opacity-30 ring-2 ring-primary-400' 
                    : 'bg-white bg-opacity-10'
                }`}
              >
                                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {player.isBot ? (
                        <Icons.Robot className="w-4 h-4 text-primary-400" />
                      ) : (
                        <Icons.User className="w-4 h-4 text-success-400" />
                      )}
                      <div className={`w-2 h-2 rounded-full ${
                        index === 0 ? 'bg-warning-400' : 'bg-success-400'
                      }`}></div>
                    </div>
                    <span className="font-medium">{player.username}</span>
                    {player.isBot && (
                      <span className="text-xs px-2 py-1 bg-primary-400 bg-opacity-30 text-primary-200 rounded-full">
                        Bot
                      </span>
                    )}
                    {index === 0 && (
                      <span className="text-xs px-2 py-1 bg-warning-400 bg-opacity-30 text-warning-200 rounded-full">
                        Anfitrión
                      </span>
                    )}
                    {player.username === username && (
                      <span className="text-xs px-2 py-1 bg-primary-400 bg-opacity-30 text-primary-200 rounded-full">
                        Tú
                      </span>
                    )}
                  </div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            ))}
            
            {/* Espacios vacíos */}
            {Array.from({ length: 6 - gameState.players.length }, (_, index) => (
              <div key={`empty-${index}`} className="flex items-center p-3 rounded-lg bg-white bg-opacity-5 border-2 border-dashed border-gray-500">
                <div className="flex items-center space-x-3 text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Esperando jugador...</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selector de Rondas - Solo para el host */}
        {isHost && (
          <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
            <div className="flex items-center justify-center mb-3">
              <Icons.Settings className="w-5 h-5 text-warning-400 mr-2" />
              <h3 className="text-lg font-semibold text-warning-400">Configuración del Juego</h3>
            </div>
            <div className="text-center">
              <label className="block text-sm font-medium mb-3">Número de Rondas</label>
              <div className="flex justify-center space-x-2">
                {[3, 5, 10].map((rounds) => (
                  <button
                    key={rounds}
                    onClick={() => setTotalRounds(rounds)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                      totalRounds === rounds
                        ? 'bg-warning-400 text-black'
                        : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                    }`}
                  >
                    {rounds} {rounds === 1 ? 'Ronda' : 'Rondas'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-300 mt-2">
                Cada ronda es como un nuevo juego con roles aleatorios
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {isHost ? (
            <button 
              onClick={() => onStartGame(totalRounds)}
              className={`w-full flex items-center justify-center space-x-2 ${canStart ? 'btn-success' : 'btn-secondary'} ${!canStart ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!canStart}
            >
              <Icons.Rocket className="w-5 h-5" />
              <span>{canStart ? `Iniciar Juego (${totalRounds} ${totalRounds === 1 ? 'Ronda' : 'Rondas'})` : `Faltan ${3 - gameState.players.length} jugadores más`}</span>
            </button>
          ) : (
            <div className="text-center p-4 bg-primary-500 bg-opacity-20 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Icons.Settings className="w-5 h-5 text-primary-400 mr-2 animate-spin" />
                <p className="text-primary-200">Esperando que el anfitrión inicie el juego...</p>
              </div>
              {!canStart && (
                <p className="text-sm text-gray-300 mt-1">
                  Faltan {3 - gameState.players.length} jugadores más para empezar
                </p>
              )}
            </div>
          )}
          
          <button onClick={onLeaveGame} className="btn-danger w-full flex items-center justify-center space-x-2">
            <Icons.Exit className="w-5 h-5" />
            <span>Salir de la Sala</span>
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400 space-y-3">
          <div className="flex items-center justify-center space-x-1">
            <Icons.Share className="w-4 h-4" />
            <span>Comparte el código de la sala con tus amigos</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Icons.Mask className="w-4 h-4" />
            <span>Un jugador será secretamente el impostor</span>
          </div>
          <div className="flex items-center justify-center space-x-1">
            <Icons.Vote className="w-4 h-4" />
            <span>Vota para eliminar jugadores y encontrar al impostor</span>
          </div>
          <div className="flex items-center justify-center space-x-1 text-xs text-warning-300">
            <Icons.Refresh className="w-3 h-3" />
            <span>Cada jugador recibirá un número de orden aleatorio en cada ronda</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;