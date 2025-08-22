import React from 'react';
import { Icons } from './Icons';

const VoteResults = ({ result, gameState, username, onContinueRound, onExitGame, onNewGame }) => {
  if (!result) return null;

  const isHost = gameState?.players[0]?.username === username;

  const getResultMessage = () => {
    if (result.winner) {
      if (result.winner === 'innocents') {
        return {
          title: "¡Ganan los Inocentes!",
          message: "¡El impostor ha sido eliminado! ¡Los jugadores inocentes son victoriosos!",
          color: "success",
          icon: <Icons.Trophy className="w-8 h-8 text-success-400 mx-auto mb-2" />
        };
      } else {
        return {
          title: "¡Gana el Impostor!",
          message: "¡El impostor ha eliminado exitosamente suficientes jugadores para ganar!",
          color: "danger",
          icon: <Icons.Mask className="w-8 h-8 text-danger-400 mx-auto mb-2" />
        };
      }
    }
    
    if (result.tie) {
      return {
        title: "Empate en la Votación",
        message: "¡La votación terminó empatada! Nadie fue eliminado esta ronda.",
        color: "secondary",
        icon: <Icons.Vote className="w-8 h-8 text-gray-400 mx-auto mb-2" />
      };
    }
    
    if (result.eliminated) {
      if (result.isImpostorEliminated) {
        return {
          title: "¡Impostor Encontrado!",
          message: `¡${result.eliminated.username} era el impostor y ha sido eliminado!`,
          color: "success",
          icon: <Icons.Trophy className="w-8 h-8 text-success-400 mx-auto mb-2" />
        };
      } else {
        return {
          title: "Inocente Eliminado",
          message: `¡${result.eliminated.username} era inocente y ha sido eliminado!`,
          color: "danger",
          icon: <Icons.Skull className="w-8 h-8 text-danger-400 mx-auto mb-2" />
        };
      }
    }

    return {
      title: "Resultados de la Votación",
      message: "Procesando resultados de la votación...",
      color: "secondary",
      icon: <Icons.Vote className="w-8 h-8 text-gray-400 mx-auto mb-2" />
    };
  };

  const { title, message, color, icon } = getResultMessage();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-2xl w-full text-center animate-fade-in">
        <div className={`mb-8 p-6 rounded-xl ${
          color === 'success' ? 'bg-success-500 bg-opacity-20 border border-success-400' :
          color === 'danger' ? 'bg-danger-500 bg-opacity-20 border border-danger-400' :
          'bg-gray-500 bg-opacity-20 border border-gray-400'
        }`}>
          {icon}
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <p className="text-xl">{message}</p>
        </div>

        {result.eliminated && (
          <div className="mb-8">
            <div className={`inline-block p-4 rounded-lg ${
              result.isImpostorEliminated 
                ? 'bg-success-500 bg-opacity-30 border border-success-400' 
                : 'bg-danger-500 bg-opacity-30 border border-danger-400'
            }`}>
              <div className="mb-2">
                {result.isImpostorEliminated ? (
                  <Icons.Mask className="w-10 h-10 mx-auto text-success-400" />
                ) : (
                  <Icons.User className="w-10 h-10 mx-auto text-danger-400" />
                )}
              </div>
              <div className="text-lg font-semibold flex items-center justify-center space-x-2">
                <span>{result.eliminated.username}</span>
                {result.eliminated.isBot && (
                  <span className="text-xs px-2 py-1 bg-gray-500 bg-opacity-50 text-gray-200 rounded">
                    Bot
                  </span>
                )}
              </div>
              <div className="text-sm opacity-75">
                {result.isImpostorEliminated ? '¡era el IMPOSTOR!' : 'era inocente'}
              </div>
            </div>
          </div>
        )}

        {/* Estado Actual del Juego */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <Icons.Users className="w-6 h-6 text-success-400 mr-2" />
            <h2 className="text-xl font-semibold">Jugadores Restantes</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gameState.players.filter(p => p.isAlive).map((player) => (
              <div key={player.id} className="p-3 bg-white bg-opacity-10 rounded-lg">
                <div className="mb-2">
                  {player.isBot ? (
                    <Icons.Robot className="w-4 h-4 text-primary-400 mx-auto" />
                  ) : (
                    <Icons.User className="w-4 h-4 text-success-400 mx-auto" />
                  )}
                </div>
                <div className="font-medium">{player.username}</div>
                <div className="text-sm text-gray-300">Vivo</div>
                {player.isBot && (
                  <div className="text-xs text-primary-300 mt-1">Bot</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Información del Juego */}
        <div className="mb-6 p-4 bg-white bg-opacity-10 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-warning-400 mb-2">Progreso del Juego</h3>
            <div className="flex justify-center space-x-4 text-sm">
              <span>Ronda {result.currentRound || gameState?.currentRound || 1} de {result.totalRounds || gameState?.totalRounds || 3}</span>
            </div>
          </div>
          
          {/* Tabla de Puntuaciones */}
          {result?.scores && result.scores.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-semibold mb-3 text-center">Tabla de Posiciones</h4>
              <div className="space-y-2">
                {result.scores.map((player, index) => (
                  <div 
                    key={player.id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      player.username === username ? 'bg-primary-400 bg-opacity-30' : 'bg-white bg-opacity-10'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`text-lg font-bold ${
                        index === 0 ? 'text-warning-400' : 
                        index === 1 ? 'text-gray-300' : 
                        index === 2 ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        {index + 1}°
                      </div>
                      <div className="flex items-center space-x-2">
                        {player.isBot ? (
                          <Icons.Robot className="w-4 h-4 text-primary-400" />
                        ) : (
                          <Icons.User className="w-4 h-4 text-success-400" />
                        )}
                        <span className="font-medium">{player.username}</span>
                        {player.isBot && (
                          <span className="text-xs text-primary-300">Bot</span>
                        )}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-warning-400">
                      {player.score} pts
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Opciones de Juego */}
        {result.tournamentFinished ? (
          <div className="text-center">
            <Icons.Trophy className="w-16 h-16 mx-auto mb-6 text-warning-400" />
            <h2 className="text-2xl font-bold mb-4 text-warning-400">¡Juego Terminado!</h2>
            {result?.scores && result.scores.length > 0 && (
              <p className="text-lg mb-6">
                ¡Felicidades a <span className="font-bold text-warning-400">{result.scores[0].username}</span> por ganar el juego!
              </p>
            )}
            
            <div className="space-y-4 max-w-sm mx-auto">
              {isHost ? (
                <div className="space-y-3">
                  <p className="text-sm text-warning-300 mb-3 font-medium">Opciones del Anfitrión:</p>
                  <button 
                    onClick={onNewGame}
                    className="btn-success w-full flex items-center justify-center space-x-2"
                  >
                    <Icons.Rocket className="w-5 h-5" />
                    <span>Nuevo Juego</span>
                  </button>
                  <div className="border-t border-white border-opacity-20 pt-3"></div>
                </div>
              ) : null}
              
              <button 
                onClick={onExitGame}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Icons.Exit className="w-5 h-5" />
                <span>Volver al Menú Principal</span>
              </button>
              
              {!isHost && (
                <p className="text-xs text-gray-500 mt-3">
                  Solo el anfitrión puede iniciar un nuevo juego
                </p>
              )}
            </div>
          </div>
        ) : result.roundFinished ? (
          <div className="text-center">
            <div className="mb-6">
              {result.winner === 'innocents' ? (
                <Icons.Check className="w-16 h-16 mx-auto mb-4 text-success-400" />
              ) : (
                <Icons.Mask className="w-16 h-16 mx-auto mb-4 text-danger-400" />
              )}
              <h2 className="text-xl font-bold mb-2">¡Ronda {result.currentRound} Completada!</h2>
              <p className="text-gray-300">
                {result.winner === 'innocents' ? 'Los inocentes ganan esta ronda' : 'El impostor gana esta ronda'}
              </p>
            </div>
            
            <div className="space-y-4 max-w-sm mx-auto">
              {isHost ? (
                <div className="space-y-3">
                  <p className="text-sm text-warning-300 mb-3 font-medium">Opciones del Anfitrión:</p>
                  {result.currentRound < result.totalRounds ? (
                    <button 
                      onClick={onContinueRound}
                      className="btn-success w-full flex items-center justify-center space-x-2"
                    >
                      <Icons.Rocket className="w-5 h-5" />
                      <span>Continuar a Ronda {result.currentRound + 1}</span>
                    </button>
                  ) : null}
                  <button 
                    onClick={onExitGame}
                    className="btn-danger w-full flex items-center justify-center space-x-2"
                  >
                    <Icons.Exit className="w-5 h-5" />
                    <span>Terminar Juego</span>
                  </button>
                </div>
              ) : (
                <div className="text-center p-4 bg-primary-500 bg-opacity-20 rounded-lg">
                  <Icons.Settings className="w-6 h-6 mx-auto mb-2 text-primary-400 animate-pulse" />
                  <p className="text-primary-200">Esperando decisión del anfitrión...</p>
                  <p className="text-xs text-gray-400 mt-2">
                    El anfitrión decidirá si continuar o terminar el juego
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <Icons.Settings className="w-8 h-8 mx-auto mb-4 text-gray-300 animate-spin" />
            <p className="text-lg text-gray-300 mb-2">
              {result.tie ? 'Empate - Continuando turno...' : 'Continuando turno...'}
            </p>
            <p className="text-sm text-gray-400">
              Esperando próximo turno de votación
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoteResults;