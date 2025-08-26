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
            <svg viewBox="0 0 550 512" className="w-10 h-10 text-warning-400 mr-3" xmlns="http://www.w3.org/2000/svg">
              <g fill="currentColor">
                <path d="M256.76 103.95c-38.69 0-70.16 33.25-70.16 74.13 0 40.87 31.47 74.12 70.16 74.12s70.16-33.25 70.16-74.12c0-40.88-31.47-74.13-70.16-74.13zm0 118.25c-22.15 0-40.16-19.79-40.16-44.12 0-24.33 18.01-44.13 40.16-44.13s40.16 19.8 40.16 44.13c0 24.33-18.01 44.12-40.16 44.12z"/>
                <path d="M406.15 113.92h-.48c-33.56.28-60.62 29.29-60.33 64.66.29 35.2 27.56 63.65 60.91 63.65h.48c16.45-.14 31.81-7.07 43.24-19.52 11.16-12.17 17.23-28.2 17.09-45.14-.29-35.2-27.56-63.65-60.91-63.65zm21.71 88.5c-5.74 6.26-13.33 9.74-21.38 9.81h-.23c-16.91 0-30.76-15.15-30.91-33.9-.16-18.83 13.56-34.27 30.58-34.41h.23c16.91 0 30.76 15.16 30.91 33.9.08 9.32-3.19 18.06-9.2 24.6z"/>
                <path d="M421.7 249.73h-31c-23.85 0-45.57 9.3-61.72 24.46-15.72-9.3-34.03-14.64-53.58-14.64h-37.29c-19.93 0-38.59 5.55-54.5 15.18-16.22-15.48-38.17-25-62.31-25h-31c-49.79 0-90.3 40.51-90.3 90.3v38.23h132.54v29.79h248.43v-29.79H512v-38.23c0-49.79-40.51-90.3-90.3-90.3zM133.89 348.26H30v-8.23c0-33.25 27.05-60.3 60.3-60.3h31c14.8 0 28.37 5.36 38.88 14.25-13.57 14.84-22.96 33.56-26.29 54.28zm217.08 29.79H300.4h-88.8h-49.06v-12.93c0-5.79.66-11.44 1.9-16.86 2.43-10.64 7.12-20.44 13.53-28.85 6.37-8.37 14.45-15.37 23.72-20.48 10.81-5.98 23.23-9.38 36.42-9.38h37.29c12.73 0 24.72 3.16 35.25 8.74 9.26 4.9 17.39 11.68 23.87 19.82 6.94 8.7 11.99 18.95 14.55 30.15 1.24 5.42 1.9 11.07 1.9 16.86v12.93zm131.03-29.79H379.62c-3.39-21.05-13.03-40.04-26.94-55 10.38-8.46 23.62-13.53 38.02-13.53h31c33.25 0 60.3 27.05 60.3 60.3v8.23z"/>
                <path d="M105.75 113.92h-.48c-33.56.28-60.62 29.29-60.33 64.66.29 35.2 27.56 63.65 60.91 63.65h.48c16.45-.14 31.81-7.07 43.24-19.52 11.16-12.17 17.23-28.2 17.09-45.14-.29-35.2-27.56-63.65-60.91-63.65zm21.71 88.5c-5.74 6.26-13.33 9.74-21.38 9.81h-.23c-16.91 0-30.76-15.15-30.91-33.9-.16-18.83 13.56-34.27 30.58-34.41h.23c16.91 0 30.76 15.16 30.91 33.9.08 9.32-3.19 18.06-9.2 24.6z"/>
              </g>
            </svg>
            <h1 className="text-3xl font-bold text-warning-400">Lobby</h1>
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