import React, { useState, useEffect } from 'react';
import { Icons } from './Icons';

const MainMenu = ({ onCreateGame, onJoinGame, gameId }) => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinGameId, setJoinGameId] = useState('');
  const [username, setUsername] = useState('');
  const [enableBots, setEnableBots] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [gameIdError, setGameIdError] = useState('');

  // Cargar nombre guardado al montar el componente
  useEffect(() => {
    const savedUsername = localStorage.getItem('impostor-username');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Guardar nombre cuando cambie
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem('impostor-username', username);
    }
  }, [username]);

  const handleCreateGame = () => {
    if (!username.trim()) {
      setUsernameError('Por favor ingresa tu nombre de usuario');
      return;
    }
    setUsernameError('');
    onCreateGame(enableBots);
  };

  // Auto-join when game is created
  useEffect(() => {
    if (gameId && username.trim()) {
      setTimeout(() => {
        onJoinGame(gameId, username);
      }, 100);
    }
  }, [gameId, username, onJoinGame]);

  const handleJoinGame = () => {
    if (!username.trim()) {
      setUsernameError('Por favor ingresa tu nombre de usuario');
      return;
    }
    if (!joinGameId.trim()) {
      setGameIdError('Por favor ingresa el código de la sala');
      return;
    }
    setUsernameError('');
    setGameIdError('');
    onJoinGame(joinGameId.toUpperCase(), username);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center animate-fade-in">
        <div className="mb-8">
          <div className="flex items-center justify-center mb-4">
            <Icons.Soccer className="w-12 h-12 text-warning-400 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-warning-400 to-warning-600 bg-clip-text text-transparent">
              El Impostor
            </h1>
          </div>
          <p className="text-gray-300 text-lg">
            ¿Puedes encontrar al impostor entre los jugadores de fútbol?
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div>
            <div className="relative">
              <Icons.User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 z-10" />
              <input
                type="text"
                placeholder="Ingresa tu nombre de usuario"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setUsernameError(''); // Limpiar error cuando el usuario escriba
                }}
                className={`input pl-12 ${usernameError ? 'border-red-500 focus:border-red-500' : ''}`}
                maxLength={20}
              />
            </div>
            {usernameError && (
              <div className="mt-2 text-red-400 text-sm text-left flex items-center">
                <Icons.X className="w-4 h-4 mr-1" />
                {usernameError}
              </div>
            )}
          </div>

          {/* Opción de Bots */}
          {!showJoinForm && (
            <div className="flex items-center justify-between p-4 bg-white bg-opacity-10 rounded-lg border border-white border-opacity-20">
              <div className="flex items-center space-x-3">
                <Icons.Robot className="w-5 h-5 text-primary-400" />
                <div>
                  <p className="font-medium">Modo de Práctica con Bots</p>
                  <p className="text-sm text-gray-300">Juega solo con jugadores controlados por IA</p>
                </div>
              </div>
              <button
                onClick={() => setEnableBots(!enableBots)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enableBots ? 'bg-primary-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enableBots ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {!showJoinForm ? (
            <>
              <button 
                onClick={handleCreateGame}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                <Icons.Stadium className="w-5 h-5" />
                <span>Crear Nueva Sala</span>
              </button>
              
              <button 
                onClick={() => {
                  setShowJoinForm(true);
                  setUsernameError(''); // Limpiar error al cambiar de vista
                }}
                className="btn-warning w-full flex items-center justify-center space-x-2"
              >
                <Icons.Door className="w-5 h-5" />
                <span>Unirse a Sala Existente</span>
              </button>
            </>
          ) : (
            <div className="space-y-4 animate-slide-in">
              <div>
                <div className="relative">
                  <Icons.Cards className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-300 z-10" />
                  <input
                    type="text"
                    placeholder="Ingresa el código de la sala"
                    value={joinGameId}
                    onChange={(e) => {
                      setJoinGameId(e.target.value);
                      setGameIdError(''); // Limpiar error cuando el usuario escriba
                    }}
                    className={`input pl-12 ${gameIdError ? 'border-red-500 focus:border-red-500' : ''}`}
                    maxLength={6}
                  />
                </div>
                {gameIdError && (
                  <div className="mt-2 text-red-400 text-sm text-left flex items-center">
                    <Icons.X className="w-4 h-4 mr-1" />
                    {gameIdError}
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={handleJoinGame}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Icons.Door className="w-4 h-4" />
                  <span>Unirse</span>
                </button>
                
                <button 
                  onClick={() => {
                    setShowJoinForm(false);
                    setGameIdError(''); // Limpiar error al volver atrás
                  }}
                  className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                >
                  <Icons.ArrowLeft className="w-4 h-4" />
                  <span>Atrás</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-400 space-y-2">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <Icons.Users className="w-4 h-4" />
              <span>3-6 jugadores</span>
            </div>
            <div className="flex items-center space-x-1">
              <Icons.Soccer className="w-4 h-4" />
              <span>Tiempo real</span>
            </div>
          </div>
          <p>¡Encuentra al impostor antes de que elimine a todos!</p>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;