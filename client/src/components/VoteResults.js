import React, { useEffect, useRef } from 'react';
import { Icons } from './Icons';

const VoteResults = ({ result, gameState, username, onContinueRound, onExitGame, onNewGame, isSpectator = false }) => {
  const isHost = gameState?.players[0]?.username === username && !isSpectator;

  // 🔹 Referencias para audio
  const audioRef = useRef(null);
  const lastPlaybackKey = useRef(null);

  // 🔊 Efecto de audio según el resultado
  useEffect(() => {
    if (!result || !gameState) return;

    console.log("🎯 result recibido:", JSON.stringify(result, null, 2));

    let audioKey = null;
    const totalPlayers = gameState.players.length;

    // ✅ Caso: hay ganador (victoria final)
    if (result.winner) {
      if (result.winner === "impostor" || result.winner === "impostors") {
        audioKey = "victoriaImpostor";
      } else if (
        result.winner === "innocent" || 
        result.winner === "innocents" || 
        result.winner === "inocentes"
      ) {
        audioKey = "victoriaInocentes";
      }
    }

    // ✅ Caso: flags del backend (seguridad extra)
    else if (result.playImpostorWinAudio) {
      audioKey = "victoriaImpostor";
    } else if (result.playInnocentsWinAudio) {
      audioKey = "victoriaInocentes";
    }

    // ✅ Caso: solo eliminación intermedia (aún sin ganador declarado)
    else if (result.eliminated && !result.winner) {
      // 🔹 Usar playInnocentAudio del backend como fuente principal
      if (result.playInnocentAudio) {
        audioKey = "muerteInocente";
      }
      // 🔹 Fallback: detectar por isImpostorEliminated
      else if (result.isImpostorEliminated === false && totalPlayers >= 4) {
        audioKey = "muerteInocente";
      }
      // 🔹 Si eliminaron al impostor pero no hay winner declarado, victoria inocentes
      else if (result.isImpostorEliminated === true) {
        audioKey = "victoriaInocentes";
      }
    }

    // ✅ Reproducir solo si cambia de audio
    if (audioKey && lastPlaybackKey.current !== audioKey) {
      lastPlaybackKey.current = audioKey;

      if (audioRef.current) {
        const src = `/audios/${audioKey}.mp3`;
        console.log("🔊 Reproduciendo:", src);

        audioRef.current.src = src;
        audioRef.current.play()
          .then(() => console.log("▶️ Audio empezó"))
          .catch(err => console.warn("⚠️ Error al reproducir:", err));
      }
    }
  }, [result, gameState]);

  if (!result) return null;

  const getResultMessage = () => {
    if (result.winner) {
      if (result.winner === 'innocents' || result.winner === 'inocentes') {
        const disconnectionMessage = result.disconnectionWin 
          ? "¡Un jugador clave se desconectó! ¡Los jugadores inocentes son victoriosos!"
          : "¡El impostor ha sido eliminado! ¡Los jugadores inocentes son victoriosos!";
        
        return {
          title: "¡Ganan los Inocentes!",
          message: disconnectionMessage,
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
          icon: <Icons.Mask className="w-8 h-8 text-danger-400 mx-auto mb-2" />
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
      <div className="card max-w-2xl w-full text-center animate-fade-in space-y-10">

        {/* 🔊 Elemento de audio */}
        <audio ref={audioRef} />

        {/* Bloque 1: Mensaje principal */}
        <div className={`p-6 rounded-xl ${
          color === 'success' ? 'bg-success-500 bg-opacity-20 border border-success-400' :
          color === 'danger' ? 'bg-danger-500 bg-opacity-20 border border-danger-400' :
          'bg-gray-500 bg-opacity-20 border border-gray-400'
        }`}>
          {icon}
          <h1 className="text-3xl font-bold mb-4">{title}</h1>
          <p className="text-xl">{message}</p>
        </div>

        {/* Bloque 2: Jugador de la ronda */}
        {result.revealedImpostor?.soccerPlayer && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg max-w-sm mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-warning-400">El jugador era:</h3>
            {result.revealedImpostor.soccerPlayer.photo && (
              <img
                src={result.revealedImpostor.soccerPlayer.photo}
                alt={result.revealedImpostor.soccerPlayer.name}
                className="w-32 h-32 object-cover rounded-full mx-auto mb-3 border-2 border-warning-400"
              />
            )}
            <p className="text-md font-medium text-white">
              {result.revealedImpostor.soccerPlayer.name}
            </p>
          </div>
        )}

        {/* Bloque 3: Impostor real */}
        {result.revealedImpostor && (
          <div className="bg-gray-900 rounded-xl p-6 shadow-lg max-w-sm mx-auto">
            <h3 className="text-lg font-semibold mb-2 text-danger-400">El impostor era:</h3>
            <p className="text-md font-medium text-white">
              {result.revealedImpostor.username}
            </p>
          </div>
        )}

        {/* Bloque 4: Jugadores restantes */}
        <div>
          <div className="flex items-center justify-center mb-4">
            <Icons.Users className="w-6 h-6 text-success-400 mr-2" />
            <h2 className="text-xl font-semibold">Jugadores Restantes</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {gameState.players.filter(p => p.isAlive).map((player) => (
              <div key={player.id} className="p-3 bg-white bg-opacity-10 rounded-lg">
                <div className="mb-2 flex items-center justify-center space-x-2">
                  {player.playerOrder && (
                    <div className="w-5 h-5 bg-warning-400 text-black rounded-full flex items-center justify-center text-xs font-bold">
                      {player.playerOrder}
                    </div>
                  )}
                  {player.isBot ? (
                    <Icons.Robot className="w-4 h-4 text-primary-400" />
                  ) : (
                    <Icons.User className="w-4 h-4 text-success-400" />
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

        {/* Bloque 5: Progreso y puntuaciones */}
        <div className="p-4 bg-white bg-opacity-10 rounded-lg">
          <div className="text-center mb-4">
            <h3 className="text-lg font-semibold text-warning-400 mb-2">Progreso del Juego</h3>
            <span className="text-sm">
              Ronda {result.currentRound || gameState?.currentRound || 1} de {result.totalRounds || gameState?.totalRounds || 3}
            </span>
          </div>
          
          {result?.scores && result.scores.length > 0 && (
            <div>
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
                        {player.playerOrder && (
                          <div className="w-5 h-5 bg-warning-400 text-black rounded-full flex items-center justify-center text-xs font-bold">
                            {player.playerOrder}
                          </div>
                        )}
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

        {/* Bloque 6: Botones */}
        <div className="space-y-4 max-w-sm mx-auto">
          {isSpectator ? (
            <div className="text-center p-4 bg-yellow-500 bg-opacity-20 rounded-lg">
              <Icons.Users className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-yellow-200">Estás observando como espectador</p>
              <p className="text-xs text-gray-400 mt-2">
                Solo puedes observar las decisiones de los jugadores
              </p>
              <button 
                onClick={onExitGame}
                className="btn-danger w-full flex items-center justify-center space-x-2 mt-4"
              >
                <Icons.Exit className="w-5 h-5" />
                <span>Salir del Juego</span>
              </button>
            </div>
          ) : isHost ? (
            <div className="space-y-3">
              <p className="text-sm text-warning-300 mb-3 font-medium">Opciones del Anfitrión:</p>

              {/* Caso especial: empate */}
              {result.tie ? (
                <div className="text-center p-4 bg-yellow-500 bg-opacity-20 rounded-lg">
                  <Icons.Vote className="w-6 h-6 mx-auto mb-2 text-yellow-400 animate-pulse" />
                  <p className="text-yellow-200">Hubo un empate en la votación...</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Esperando resolución antes de continuar
                  </p>
                </div>
              ) : (
                <>
                  {/* Continuar ronda si no ha terminado el torneo */}
                  {result.currentRound < result.totalRounds && (
                    <button 
                      onClick={onContinueRound}
                      className="btn-success w-full flex items-center justify-center space-x-2"
                    >
                      <Icons.Rocket className="w-5 h-5" />
                      <span>Continuar a Ronda {result.currentRound + 1}</span>
                    </button>
                  )}

                  {/* Nuevo juego solo al final */}
                  {result.currentRound >= result.totalRounds && (
                    <button 
                      onClick={onNewGame}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                      <Icons.Refresh className="w-5 h-5" />
                      <span>Nuevo Juego</span>
                    </button>
                  )}

                  {/* Terminar juego */}
                  <button 
                    onClick={onExitGame}
                    className="btn-danger w-full flex items-center justify-center space-x-2"
                  >
                    <Icons.Exit className="w-5 h-5" />
                    <span>Terminar Juego</span>
                  </button>
                </>
              )}
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
    </div>
  );
};

export default VoteResults;