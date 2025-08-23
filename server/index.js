const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Ping Endpoint
app.get("/ping", (req, res) => {
  res.status(200).send("pong 🏓");
});

// Game state management
const games = new Map();
const playerSockets = new Map();

// -----------------------------------------------------------------------------
// Helpers para normalizar nombres y generar variantes de búsqueda (TheSportsDB)
// -----------------------------------------------------------------------------
function removeDiacritics(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function buildSearchVariants(name) {
  const variants = new Set();
  const raw = (name || '').trim();
  if (!raw) return [];

  const noDiacritics = removeDiacritics(raw);

  // variantes con y sin underscores, con y sin diacríticos
  variants.add(raw.replace(/\s+/g, '_')); // "Danny_Welbeck"
  variants.add(raw);                       // "Danny Welbeck"
  variants.add(noDiacritics.replace(/\s+/g, '_')); // "Danny_Welbeck" sin acentos
  variants.add(noDiacritics);                     // "Danny Welbeck" sin acentos

  // safe: quitar caracteres no alfanum y usar _
  const safe = raw.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  variants.add(safe);
  const safeNoDia = noDiacritics.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
  variants.add(safeNoDia);

  // También una versión sin guiones/espacios concatenada (por si acaso)
  variants.add(raw.replace(/\s+/g, ''));
  variants.add(noDiacritics.replace(/\s+/g, ''));

  return Array.from(variants);
}

// -----------------------------------------------------------------------------
// Soccer player data: solo nombres (photo: null) para usar exclusivamente TheSportsDB
// -----------------------------------------------------------------------------
// Importar datos de jugadores desde archivos JSON
const fallbackPlayers = require('./data/fallbackPlayers.json');

const playerAliases = require('./data/playerAliases.json');

// Información adicional para mejorar la selección de jugadores
const playerExpectedData = require('./data/playerExpectedData.json');

// Función para seleccionar el mejor jugador de múltiples resultados
function selectBestPlayer(players, expectedName) {
  if (!players || players.length === 0) return null;
  if (players.length === 1) return players[0];

  console.log(`Multiple players found for "${expectedName}", selecting best match from ${players.length} results`);
  
  const expectedData = playerExpectedData[expectedName];
  let bestPlayer = players[0];
  let bestScore = 0;

  for (const player of players) {
    let score = 0;
    
    // Bonus por tener imagen de cutout (mejor calidad)
    if (player.strCutout) score += 50;
    
    // Bonus por tener imagen en general
    if (player.strThumb) score += 20;
    
    // Bonus por relevancia (si está disponible en el campo)
    if (player.relevance && typeof player.relevance === 'number') {
      score += Math.floor(player.relevance / 2); // Convertir relevancia a puntos
    }
    
    // Bonus por posición específica (para distinguir jugadores)
    if (player.strPosition) {
      const position = player.strPosition.toLowerCase();
      if (['goalkeeper', 'defender', 'midfielder', 'forward'].some(pos => position.includes(pos))) {
        score += 10;
      }
    }
    
    // Si tenemos datos esperados del jugador
    if (expectedData) {
      // Bonus fuerte por nacionalidad correcta
      if (player.strNationality === expectedData.nationality) score += 100;
      
      // Bonus por año de nacimiento cercano (±5 años)
      if (player.dateBorn) {
        const birthYear = new Date(player.dateBorn).getFullYear();
        const yearDiff = Math.abs(birthYear - expectedData.birthYear);
        if (yearDiff <= 5) score += 80;
        else if (yearDiff <= 10) score += 40;
      }
      
      // Bonus por status apropiado
      if (expectedData.status === 'legend') {
        if (player.strStatus === 'Retired' || player.strStatus === 'Deceased') score += 60;
      } else if (expectedData.status === 'current') {
        if (player.strStatus === 'Active') score += 60;
      }
    }
    
    // Bonus por equipos famosos y penalización por equipos poco conocidos según el tipo de jugador
    if (player.strTeam) {
      const team = player.strTeam.toLowerCase();
      
      // Equipos top mundiales
      const topEuropeanTeams = ['real madrid', 'barcelona', 'manchester', 'liverpool', 'chelsea', 
                               'arsenal', 'manchester city', 'bayern', 'psg', 'juventus', 'milan', 
                               'inter', 'napoli', 'atletico madrid', 'ajax', 'benfica', 'porto'];
      
      // Equipos sudamericanos famosos
      const topSouthAmericanTeams = ['boca juniors', 'river plate', 'santos', 'palmeiras', 'flamengo',
                                   'corinthians', 'grêmio', 'internacional', 'são paulo', 'nacional',
                                   'peñarol', 'millonarios', 'independiente', 'racing', 'estudiantes',
                                   'san lorenzo', 'américa', 'deportivo cali', 'atlético nacional',
                                   'emelec', 'barcelona sc', 'liga de quito'];
      
      // Selecciones nacionales
      const nationalTeams = ['brazil', 'argentina', 'colombia', 'uruguay', 'ecuador', 'chile', 'peru',
                            'spain', 'france', 'germany', 'italy', 'england', 'portugal', 'netherlands'];
      
      const hasTopTeam = topEuropeanTeams.some(famousTeam => team.includes(famousTeam));
      const hasSouthAmericanTeam = topSouthAmericanTeams.some(saTeam => team.includes(saTeam));
      const hasNationalTeam = nationalTeams.some(natTeam => team.includes(natTeam));
      
      // Bonus por equipos famosos
      if (hasTopTeam) score += 30;
      if (hasSouthAmericanTeam) score += 25;
      if (hasNationalTeam) score += 35;
      
      // Estados especiales
      if (team.includes('deceased') || team.includes('retired')) {
        if (expectedData?.status === 'legend') {
          score += 20; // Bonus para leyendas en estados especiales
        } else {
          score -= 30; // Penalización para actuales
        }
      }
      
      // Penalización fuerte por equipos muy genéricos o poco conocidos para jugadores famosos
      const isWellKnownPlayer = expectedData && (expectedData.status === 'legend' || expectedData.status === 'current');
      if (isWellKnownPlayer && !hasTopTeam && !hasSouthAmericanTeam && !hasNationalTeam && 
          !team.includes('deceased') && !team.includes('retired')) {
        score -= 50; // Penalización fuerte por equipos desconocidos para jugadores famosos
      }
    }

    // Bonus por ID menor (jugadores más importantes suelen tener ID menores)
    if (player.idPlayer) {
      const playerId = parseInt(player.idPlayer);
      if (playerId < 1000000) score += 30; // IDs muy bajos = jugadores muy importantes
      else if (playerId < 10000000) score += 15; // IDs medios = jugadores conocidos
    }
    
    // Si no tenemos datos específicos, usar heurísticas generales
    if (!expectedData) {
      // Priorizar jugadores con status que sugiera importancia
      if (player.strStatus === 'Active' && player.strSport === 'Soccer') score += 25;
      if (player.strStatus === 'Retired' && player.strSport === 'Soccer') score += 20;
      
      // Priorizar nacionalidades de fútbol prominente
      const footballNations = ['Brazil', 'Argentina', 'Spain', 'France', 'Germany', 'Italy', 
                              'Portugal', 'Netherlands', 'England', 'Colombia', 'Uruguay', 'Ecuador'];
      if (footballNations.includes(player.strNationality)) {
        score += 20;
      }
    }

    console.log(`  Player: ${player.strPlayer} (${player.strNationality}, ${player.strTeam}, ID: ${player.idPlayer}) - Score: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestPlayer = player;
    }
  }

  console.log(`  Selected: ${bestPlayer.strPlayer} (${bestPlayer.strNationality}, ${bestPlayer.strTeam}) with score ${bestScore}`);
  return bestPlayer;
}

class Game {
  constructor(gameId) {
    this.id = gameId;
    this.players = [];
    this.status = 'waiting'; // waiting, playing, finished
    this.currentPlayer = null;
    this.impostorId = null;
    this.votes = new Map();
    this.votingTurn = 1; // Turno de votación dentro de la ronda actual
    this.totalRounds = 3;
    this.currentRound = 1;
    this.scores = new Map(); // playerId -> score
    this.consecutiveTies = 0; // Track consecutive ties for better tie-breaking
    this.usedPlayers = new Set(); // Tracking de jugadores usados
    this.enableBots = false;
    this.usedBotNames = new Set();
    this.MAX_VOTING_TURNS = 3;

    // Lock para evitar reentradas en processVotes()
    this._processingVotes = false;
  }

  addPlayer(playerId, username, socketId, isBot = false) {
    if (this.players.length >= 6) return false;
    const player = {
      id: playerId,
      username,
      socketId,
      isAlive: true,
      isImpostor: false,
      isBot,
      playerOrder: null // Se asignará cuando inicie el juego
    };
    this.players.push(player);
    return true;
  }

  addBot(botName) {
    const botId = uuidv4();
    return this.addPlayer(botId, botName, null, true);
  }

  getRandomBotName() {
    const available = fallbackPlayers.filter(p => !this.usedBotNames.has(p.name));
    if (available.length === 0) {
      this.usedBotNames.clear(); // reset si se acaban
      return this.getRandomBotName();
    }
    const random = available[Math.floor(Math.random() * available.length)];
    this.usedBotNames.add(random.name);
    return `🤖 ${random.name}`;
  }

  addBotsToFill() {
    let botsAdded = 0;
    while (this.players.length < 3) {
      const botName = this.getRandomBotName();
      if (this.addBot(botName)) {
        botsAdded++;
      } else {
        break;
      }
    }
    return botsAdded;
  }

  // Asignar órdenes aleatorios del 1 al N a todos los jugadores
  assignRandomPlayerOrders() {
    const playerCount = this.players.length;
    const availableOrders = Array.from({length: playerCount}, (_, i) => i + 1);
    
    // Shuffle de Fisher-Yates para obtener orden aleatorio
    for (let i = availableOrders.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableOrders[i], availableOrders[j]] = [availableOrders[j], availableOrders[i]];
    }
    
    // Asignar cada orden a un jugador
    this.players.forEach((player, index) => {
      player.playerOrder = availableOrders[index];
    });

    console.log(`Player orders assigned for Round ${this.currentRound}:`);
    this.players.forEach(player => {
      console.log(`  ${player.username}: Orden ${player.playerOrder}`);
    });
  }

  removePlayer(playerId) {
    this.players = this.players.filter(p => p.id !== playerId);
    if (this.players.length < 3 && this.status === 'playing') {
      this.status = 'finished';
    }
  }

  canStart() {
    return this.players.length >= 3 && this.status === 'waiting';
  }

  async startGame(totalRounds = 3) {
    if (!this.canStart()) return false;

    this.status = 'playing';
    this.votingTurn = 1;
    this.totalRounds = totalRounds;
    this.currentRound = 1;

    // Initialize scores for all players
    this.players.forEach(player => {
      this.scores.set(player.id, 0);
    });

    return this.startRound();
  }

  async startRound() {
    console.log(`=== STARTING ROUND ${this.currentRound} ===`);

    // Reset round state
    this.votes.clear();
    this.votingTurn = 1;
    this.consecutiveTies = 0;

    // Reset ALL players to alive for new round
    this.players.forEach(player => {
      player.isAlive = true;
      player.isImpostor = false;
    });

    // Asignar nuevos órdenes aleatorios para esta ronda
    this.assignRandomPlayerOrders();

    // Shuffle players (Fisher–Yates) to remove bias from insertion order
    const shuffled = this.players.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Choose impostor from shuffled array
    const chosenImpostor = shuffled[Math.floor(Math.random() * shuffled.length)];
    this.impostorId = chosenImpostor.id;

    // Mark impostor in the original players array
    const originalImpostor = this.players.find(p => p.id === this.impostorId);
    if (originalImpostor) originalImpostor.isImpostor = true;

    console.log(`Impostor assigned: ${originalImpostor ? originalImpostor.username : this.impostorId}`);

    // Get random soccer player for this round
    this.currentPlayer = await this.getRandomSoccerPlayer();
    console.log(`Soccer player for this round: ${this.currentPlayer?.name ?? 'N/A'}`);

    // Fixed number of voting turns
    this.MAX_VOTING_TURNS = 3;
    console.log(`MAX_VOTING_TURNS set to ${this.MAX_VOTING_TURNS}`);

    // ❌ Quitado: immediateWin con 2 jugadores al iniciar la ronda (causaba ganador auto inesperado)
    return true;
  }  

  // ======================================================================================
  // getRandomSoccerPlayer: intenta variantes y usa SOLO imágenes de TheSportsDB o placeholder
  // ======================================================================================
  async getRandomSoccerPlayer() {
    let randomPlayer = null;
    try {
      // Filtrar jugadores que aún no se han usado
      const availablePlayers = fallbackPlayers.filter(p => !this.usedPlayers.has(p.name));

      // Si ya usaste todos, resetea la lista
      if (availablePlayers.length === 0) {
        console.log("All fallback players used, resetting list");
        this.usedPlayers.clear();
        randomPlayer = fallbackPlayers[Math.floor(Math.random() * fallbackPlayers.length)];
      } else {
        randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
      }

      // Marcar como usado
      this.usedPlayers.add(randomPlayer.name);
      console.log(`Selected: ${randomPlayer.name} (${this.usedPlayers.size}/${fallbackPlayers.length})`);

      const PLACEHOLDER = "https://www.thesportsdb.com/images/media/player/thumb/default.png";

      // Construir variantes
      let variants = buildSearchVariants(randomPlayer.name);

      // Agregar alias manuales
      if (playerAliases[randomPlayer.name]) {
        playerAliases[randomPlayer.name].forEach(alias => {
          variants = variants.concat(buildSearchVariants(alias));
        });
      }

      let apiPlayer = null;
      let usedVariant = null;

      for (const v of variants) {
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(v)}`;
        console.log(`Trying TheSportsDB search for "${randomPlayer.name}" with variant "${v}" -> ${url}`);
        try {
          const response = await axios.get(url, { timeout: 7000 });
          if (response.data && response.data.player && response.data.player.length > 0) {
            // Usar la función de selección inteligente en lugar de tomar el primer resultado
            apiPlayer = selectBestPlayer(response.data.player, randomPlayer.name);
            usedVariant = v;
            console.log(`Found ${response.data.player.length} player(s) using variant "${v}", selected best match`);
            break;
          } else {
            console.log(`No player returned for variant "${v}"`);
          }
        } catch (err) {
          console.warn(`Request failed for variant "${v}": ${err.message}`);
        }
      }

      // Prioriza campos de imagen
      let candidateUrl = null;
      if (apiPlayer) {
        candidateUrl = apiPlayer.strCutout || apiPlayer.strRender || apiPlayer.strThumb || null;
      }

      // HEAD para validar imagen
      if (candidateUrl) {
        try {
          const head = await axios.head(candidateUrl, { timeout: 5000 });
          const contentType = (head.headers['content-type'] || '').toLowerCase();
          if (head.status >= 400 || !contentType.startsWith('image')) {
            console.warn(`API image not valid or not image: ${candidateUrl} (status ${head.status})`);
            candidateUrl = null;
          }
        } catch (err) {
          console.warn(`Failed HEAD check for API image: ${candidateUrl} -> ${err.message}`);
          candidateUrl = null;
        }
      }

      const finalPhoto = candidateUrl || PLACEHOLDER;
      console.log(`Resolved photo for ${randomPlayer.name}: ${finalPhoto} (variant used: ${usedVariant})`);

      return {
        name: randomPlayer.name,
        photo: finalPhoto
      };

    } catch (error) {
      console.error("Error fetching from TheSportsDB:", error.message);
      return {
        name: randomPlayer ? randomPlayer.name : 'Unknown Player',
        photo: "https://www.thesportsdb.com/images/media/player/thumb/default.png"
      };
    }
  }

  vote(playerId, targetId) {
    if (this.status !== 'playing') return false;

    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) {
      console.log(`Vote rejected: Player ${player?.username || playerId} is not alive`);
      return false;
    }

    // Evitar que un jugador vote por sí mismo
    if (targetId !== 'skip' && playerId === targetId) {
      console.log(`Rejected self-vote from ${player.username}`);
      return false;
    }

    // Validar target vivo
    if (targetId !== 'skip') {
      const target = this.players.find(p => p.id === targetId);
      if (!target || !target.isAlive) {
        console.log(`Rejected vote for invalid/dead target: ${targetId}`);
        return false;
      }
    }

    this.votes.set(playerId, targetId);
    return true;
  }  

  processVotes() {
    if (this._processingVotes) {
      console.log('processVotes called while already processing — skipping.');
      return { error: 'already processing' };
    }
    this._processingVotes = true;
  
    try {
      const voteCounts = new Map();
      const alivePlayers = this.players.filter(p => p.isAlive);
  
      console.log(`=== PROCESSING VOTES - Round ${this.currentRound}, Voting Turn ${this.votingTurn} ===`);
  
      // Contar votos (excepto skip)
      this.votes.forEach((targetId) => {
        if (targetId === 'skip') return;
        voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
      });
  
      // Encontrar máximo de votos y candidatos
      let maxVotes = 0;
      let eliminatedPlayerId = null;
      voteCounts.forEach((count) => {
        if (count > maxVotes) maxVotes = count;
      });
  
      const tiedIds = [];
      voteCounts.forEach((count, id) => {
        if (count === maxVotes) tiedIds.push(id);
      });
  
      // Flags de audio
      let playInnocentAudio = false;
      let playInnocentsWinAudio = false;
      let playImpostorWinAudio = false;
  
      // Empate o nadie votó
      if (maxVotes === 0 || this.isTie(voteCounts, maxVotes)) {
        this.consecutiveTies++;
        console.log(`TIE or NO VOTES! Consecutive ties: ${this.consecutiveTies}`);
  
        if (this.votingTurn >= this.MAX_VOTING_TURNS) {
          console.log('Max voting turns reached — forcing elimination.');
  
          if (tiedIds.length > 0) {
            eliminatedPlayerId = tiedIds[Math.floor(Math.random() * tiedIds.length)];
          } else {
            const candidates = alivePlayers.map(p => p.id);
            if (candidates.length > 0) {
              eliminatedPlayerId = candidates[Math.floor(Math.random() * candidates.length)];
            } else {
              // No hay nadie para eliminar
              this.votes.clear();
              this.votingTurn++;
              return {
                eliminated: null,
                tie: true,
                roundFinished: false,
                tournamentFinished: false,
                continueVoting: true,
                currentRound: this.currentRound,
                totalRounds: this.totalRounds,
                scores: this.getScoresArray(),
                isImpostorEliminated: false,
                playInnocentAudio,
                playInnocentsWinAudio,
                playImpostorWinAudio
              };
            }
          }
          this.consecutiveTies = 0;
        } else {
          // continuar votación
          this.votes.clear();
          this.votingTurn++;
          return {
            eliminated: null,
            tie: true,
            roundFinished: false,
            tournamentFinished: false,
            continueVoting: true,
            currentRound: this.currentRound,
            totalRounds: this.totalRounds,
            scores: this.getScoresArray(),
            isImpostorEliminated: false,
            playInnocentAudio,
            playInnocentsWinAudio,
            playImpostorWinAudio
          };
        }
      } else {
        // no hubo empate: elegir quien tiene maxVotes
        eliminatedPlayerId = tiedIds[0];
        this.consecutiveTies = 0;
      }
  
      // Eliminar jugador (si hay uno)
      const eliminatedPlayer = this.players.find(p => p.id === eliminatedPlayerId);
  
      if (eliminatedPlayer) {
        eliminatedPlayer.isAlive = false;
        console.log(`ELIMINATED: ${eliminatedPlayer.username} (Impostor: ${eliminatedPlayer.isImpostor})`);
  
        // 🔊 sonido de eliminar inocente (solo si NO hay victoria luego y hay 4+ jugadores)
        if (!eliminatedPlayer.isImpostor && alivePlayers.length >= 4) {
          playInnocentAudio = true;
        }
      }
  
      // Verificar condiciones de victoria tras la eliminación
      const roundWinner = this.checkWinCondition();
      console.log(`Round winner check: ${roundWinner}`);
  
      let roundFinished = false;
      let tournamentFinished = false;
      const completedRound = this.currentRound;
  
      if (roundWinner) {
        roundFinished = true;
        this.awardPoints(roundWinner);
  
        if (roundWinner === "innocents") {
          playInnocentsWinAudio = true;
        } else if (roundWinner === "impostors") {
          playImpostorWinAudio = true;
        }
  
        // Si hay victoria, cancelar audio de eliminación de inocente
        if (playInnocentsWinAudio || playImpostorWinAudio) {
          playInnocentAudio = false;
        }
  
        if (this.currentRound >= this.totalRounds) {
          tournamentFinished = true;
          this.status = 'finished';
        } else {
          this.currentRound++;
        }
      } else {
        const alivePlayersAfterElimination = this.players.filter(p => p.isAlive);
        if (alivePlayersAfterElimination.length === 2) {
          // ✅ Caso 1v1 → gana inocente
          const impostors = alivePlayersAfterElimination.filter(p => p.isImpostor);
          const innocents = alivePlayersAfterElimination.filter(p => !p.isImpostor);
  
          if (impostors.length === 1 && innocents.length === 1) {
            roundFinished = true;
            this.awardPoints('innocents');
            playInnocentsWinAudio = true;
            playInnocentAudio = false;
  
            if (this.currentRound >= this.totalRounds) {
              tournamentFinished = true;
              this.status = 'finished';
            } else {
              this.currentRound++;
            }
  
            const impostorPlayer = this.players.find(p => p.isImpostor) || null;
  
            return {
              eliminated: eliminatedPlayer,
              tie: false,
              winner: 'innocents',
              roundFinished,
              tournamentFinished,
              currentRound: completedRound,
              totalRounds: this.totalRounds,
              scores: this.getScoresArray(),
              isImpostorEliminated: eliminatedPlayer?.isImpostor || false,
              playInnocentAudio,
              playInnocentsWinAudio,
              playImpostorWinAudio,
              automaticWin: true,
              revealedImpostor: impostorPlayer
                ? {
                    id: impostorPlayer.id,
                    username: impostorPlayer.username,
                    isBot: impostorPlayer.isBot || false,
                    soccerPlayer: this.currentPlayer
                  }
                : null
            };
          }
        }
      }
  
      // Preparar siguiente turno
      this.votes.clear();
      this.votingTurn++;
  
      const impostorPlayer = this.players.find(p => p.isImpostor) || null;
  
      return {
        eliminated: eliminatedPlayer,
        tie: false,
        winner: roundWinner,
        roundFinished,
        tournamentFinished,
        currentRound: completedRound,
        totalRounds: this.totalRounds,
        scores: this.getScoresArray(),
        isImpostorEliminated: eliminatedPlayer?.isImpostor || false,
        playInnocentAudio,
        playInnocentsWinAudio,
        playImpostorWinAudio,
        continueVoting: !roundFinished,
        ...(roundFinished && {
          revealedImpostor: impostorPlayer
            ? {
                id: impostorPlayer.id,
                username: impostorPlayer.username,
                isBot: impostorPlayer.isBot || false,
                soccerPlayer: this.currentPlayer
              }
            : null
        })
      };
    } finally {
      this._processingVotes = false;
    }
  }

  // Consolidated continueToNextRound
  async continueToNextRound() {
    if (this.currentRound > this.totalRounds) {
      return false; // Tournament already finished
    }

    this.status = 'playing';
    const roundResult = await this.startRound();

    // Ya no esperamos immediateWin aquí (lo removimos en startRound)
    if (roundResult && roundResult.immediateWin) {
      const completedRound = this.currentRound;
      this.awardPoints(roundResult.immediateWin);

      if (this.currentRound >= this.totalRounds) {
        this.status = 'finished';
        return { 
          success: true, 
          immediateWin: roundResult.immediateWin,
          tournamentFinished: true,
          currentRound: completedRound,
          totalRounds: this.totalRounds,
          scores: this.getScoresArray()
        };
      } else {
        this.currentRound++;
        return { 
          success: true, 
          immediateWin: roundResult.immediateWin,
          roundFinished: true,
          tournamentFinished: false,
          currentRound: completedRound,
          totalRounds: this.totalRounds,
          scores: this.getScoresArray()
        };
      }
    }

    return { success: true };
  }

  awardPoints(winner) {
    console.log(`Awarding points for winner: ${winner}`);
    if (winner === 'innocents') {
      this.players.filter(p => !p.isImpostor).forEach(player => {
        const currentScore = this.scores.get(player.id) || 0;
        this.scores.set(player.id, currentScore + 1);
        console.log(`${player.username} (innocent) gets 1 point, total: ${currentScore + 1}`);
      });
    } else if (winner === 'impostors') {
      this.players.filter(p => p.isImpostor).forEach(player => {
        const currentScore = this.scores.get(player.id) || 0;
        this.scores.set(player.id, currentScore + 2);
        console.log(`${player.username} (impostor) gets 2 points, total: ${currentScore + 2}`);
      });
    }
  }

  getScoresArray() {
    return this.players.map(player => ({
      id: player.id,
      username: player.username,
      score: this.scores.get(player.id) || 0,
      isBot: player.isBot
    })).sort((a, b) => b.score - a.score);
  }

  isTie(voteCounts, maxVotes) {
    let playersWithMaxVotes = 0;
    voteCounts.forEach((count) => { if (count === maxVotes) playersWithMaxVotes++; });
    return playersWithMaxVotes > 1;
  }

  checkWinCondition() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveImpostors = alivePlayers.filter(p => p.isImpostor);
    const aliveInnocents = alivePlayers.filter(p => !p.isImpostor);
  
    console.log(
      `Win condition check: ${aliveInnocents.length} innocents, ${aliveImpostors.length} impostors alive`
    );
  
    // ✅ Innocents win if no impostors remain
    if (aliveImpostors.length === 0 && aliveInnocents.length > 0) {
      return "innocents";
    }
  
    // ✅ Impostors win if equal or more impostors than innocents
    if (aliveImpostors.length >= aliveInnocents.length && aliveImpostors.length > 0) {
      return "impostors";
    }
  
    return null; // Game continues
  }  

  getAllVoted() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    // Requiere que cada jugador vivo tenga una entrada en this.votes (incluye 'skip')
    return alivePlayers.every(p => this.votes.has(p.id));
  }

  // Improved bot voting logic
  makeBotVotes() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveBots = alivePlayers.filter(p => p.isBot);

    console.log(`Making votes for ${aliveBots.length} bots`);

    aliveBots.forEach(bot => {
      if (!this.votes.has(bot.id)) {
        const possibleTargets = alivePlayers.filter(p => p.id !== bot.id);
        const skipChance = this.consecutiveTies > 0 ? 0.05 : 0.15;

        if (Math.random() > skipChance && possibleTargets.length > 0) {
          if (bot.isImpostor) {
            const nonImpostors = possibleTargets.filter(p => !p.isImpostor);
            if (nonImpostors.length > 0) {
              const target = nonImpostors[Math.floor(Math.random() * nonImpostors.length)];
              this.votes.set(bot.id, target.id);
              console.log(`Impostor bot ${bot.username} votes for innocent ${target.username}`);
            } else {
              this.votes.set(bot.id, 'skip');
              console.log(`Impostor bot ${bot.username} skips (no innocents available)`);
            }
          } else {
            const target = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];
            this.votes.set(bot.id, target.id);
            console.log(`Innocent bot ${bot.username} votes for ${target.username}`);
          }
        } else {
          this.votes.set(bot.id, 'skip');
          console.log(`Bot ${bot.username} skips voting`);
        }
      }
    });
  }

  getGameState(playerId, isSpectator = false) {
    const player = this.players.find(p => p.id === playerId);
    const alivePlayers = this.players.filter(p => p.isAlive);

    // Estado base para espectadores
    if (isSpectator) {
      return {
        gameId: this.id,
        status: this.status,
        round: this.votingTurn,
        currentRound: this.currentRound,
        totalRounds: this.totalRounds,
        scores: this.getScoresArray(),
        players: this.players.map(p => ({
          id: p.id,
          username: p.username,
          isAlive: p.isAlive,
          isBot: p.isBot || false,
          playerOrder: p.playerOrder
        })),
        currentPlayer: null, // Los espectadores no ven identidades
        isImpostor: false,
        hasVoted: true, // Para deshabilitar votación
        allVoted: this.getAllVoted(),
        voteCounts: this.votes.size,
        totalAlivePlayers: alivePlayers.length,
        isSpectator: true
      };
    }

    // Estado normal para jugadores
    return {
      gameId: this.id,
      status: this.status,
      round: this.votingTurn,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      scores: this.getScoresArray(),
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        isAlive: p.isAlive,
        isBot: p.isBot || false,
        playerOrder: p.playerOrder
      })),
      currentPlayer: player?.isImpostor ? null : this.currentPlayer,
      isImpostor: player?.isImpostor || false,
      hasVoted: this.votes.has(playerId),
      allVoted: this.getAllVoted(),
      voteCounts: this.votes.size,
      totalAlivePlayers: alivePlayers.length,
      isSpectator: false
    };
  }

  resetGame() {
    // Resetear el estado del juego pero mantener los jugadores
    this.status = 'waiting';
    this.currentPlayer = null;
    this.impostorId = null;
    this.votes.clear();
    this.votingTurn = 1;
    this.currentRound = 1;
    this.totalRounds = 3;
    this.consecutiveTies = 0;
    this.usedPlayers.clear();

    // Resetear scores
    this.scores.clear();
    this.players.forEach(player => { this.scores.set(player.id, 0); });

    // Resetear estado de jugadores
    this.players.forEach(player => {
      player.isAlive = true;
      player.isImpostor = false;
      player.playerOrder = null;
    });

    console.log(`Game ${this.id} reset. Players: ${this.players.map(p => p.username).join(', ')}`);
  }
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-game', ({ enableBots = false }, callback) => {
    const gameId = uuidv4().substring(0, 6).toUpperCase();
    const game = new Game(gameId);
    game.enableBots = enableBots;
    games.set(gameId, game);

    console.log(`Game created: ${gameId}, bots enabled: ${enableBots}`);
    callback({ success: true, gameId });
  });

  // join-game ahora acepta playerId opcional para reconexión
  socket.on('join-game', ({ gameId, username, playerId }, callback) => {
    const game = games.get(gameId);

    if (!game) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // 1) Reconexion por playerId (si viene del cliente)
    if (playerId) {
      const existingById = game.players.find(p => p.id === playerId);
      if (existingById) {
        // limpiar mapeos previos de ese playerId
        for (const [sockId, info] of playerSockets.entries()) {
          if (info.playerId === playerId) playerSockets.delete(sockId);
        }
        existingById.socketId = socket.id;
        playerSockets.set(socket.id, { playerId: existingById.id, gameId });
        socket.join(gameId);

        // Broadcast estado
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.emit('game-state', game.getGameState(player.id));
            }
          }
        });

        callback({ success: true, playerId: existingById.id, gameState: game.getGameState(existingById.id) });
        return;
      }
    }

    // 2) Reconexion por username (si coincide)
    const existingByName = game.players.find(p => p.username === username);
    if (existingByName) {
      for (const [sockId, info] of playerSockets.entries()) {
        if (info.playerId === existingByName.id) playerSockets.delete(sockId);
      }
      existingByName.socketId = socket.id;
      playerSockets.set(socket.id, { playerId: existingByName.id, gameId });
      socket.join(gameId);

      game.players.forEach(player => {
        if (player.socketId) {
          const playerSocket = io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit('game-state', game.getGameState(player.id));
          }
        }
      });

      callback({ success: true, playerId: existingByName.id, gameState: game.getGameState(existingByName.id) });
      return;
    }

    // 3) Si el juego ya empezó, admitir como espectador
    if (game.status !== 'waiting') {
      // Unirse como espectador
      const spectatorId = uuidv4();
      playerSockets.set(socket.id, { playerId: spectatorId, gameId, isSpectator: true });
      socket.join(gameId);

      console.log(`Player ${username} joined game ${gameId} as spectator`);

      callback({ 
        success: true, 
        playerId: spectatorId, 
        gameState: game.getGameState(spectatorId, true),
        isSpectator: true
      });
      return;
    }

    // 4) Alta de jugador nuevo
    const newPlayerId = uuidv4();
    const success = game.addPlayer(newPlayerId, username, socket.id);

    if (!success) {
      callback({ success: false, error: 'Game is full' });
      return;
    }

    playerSockets.set(socket.id, { playerId: newPlayerId, gameId });
    socket.join(gameId);

    if (game.enableBots && game.players.length === 1) {
      game.addBotsToFill();
      console.log(`Added bots to game ${gameId}. Total players: ${game.players.length}`);
    }

    // Broadcast updated game state
    game.players.forEach(player => {
      if (player.socketId) {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          playerSocket.emit('game-state', game.getGameState(player.id));
        }
      }
    });

    callback({ success: true, playerId: newPlayerId, gameState: game.getGameState(newPlayerId) });
  });

  socket.on('start-game', async ({ totalRounds = 3 }, callback) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    console.log(`Starting game ${playerInfo.gameId} with ${totalRounds} rounds`);

    const result = await game.startGame(totalRounds);
    if (result === true) {
      console.log(`Game ${playerInfo.gameId} started successfully`);
      game.players.forEach(player => {
        if (player.socketId) {
          const playerSocket = io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit('game-state', game.getGameState(player.id));
          }
        }
      });
      callback({ success: true });
    } else if (result && result.immediateWin) {
      // (ya no debería ocurrir)
      console.log(`Immediate win in game ${playerInfo.gameId}: ${result.immediateWin}`);
      game.players.forEach(player => {
        if (player.socketId) {
          const playerSocket = io.sockets.sockets.get(player.socketId);
          if (playerSocket) {
            playerSocket.emit('vote-result', {
              winner: result.immediateWin,
              eliminated: null,
              tie: false,
              roundFinished: true,
              tournamentFinished: game.currentRound >= game.totalRounds,
              currentRound: game.currentRound,
              totalRounds: game.totalRounds,
              scores: game.getScoresArray(),
              isImpostorEliminated: false,
              immediateWin: true
            });
          }
        }
      });
      callback({ success: true });
    } else {
      callback({ success: false, error: 'Cannot start game' });
    }
  });

  socket.on('continue-round', async (callback) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    console.log(`Continuing to next round in game ${playerInfo.gameId}`);

    const result = await game.continueToNextRound();
    if (result && result.success) {
      if (result.immediateWin) {
        // (ya no debería ocurrir)
        console.log(`Immediate win in next round: ${result.immediateWin}`);
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.emit('vote-result', {
                winner: result.immediateWin,
                eliminated: null,
                tie: false,
                roundFinished: result.roundFinished,
                tournamentFinished: result.tournamentFinished,
                currentRound: result.currentRound,
                totalRounds: result.totalRounds,
                scores: result.scores,
                isImpostorEliminated: false,
                immediateWin: true
              });
            }
          }
        });
      } else {
        console.log(`Next round started normally in game ${playerInfo.gameId}`);
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.emit('game-state', game.getGameState(player.id));
            }
          }
        });
      }
      callback({ success: true });
    } else {
      callback({ success: false, error: 'No se pudo continuar a la siguiente ronda' });
    }
  });

  socket.on('vote', ({ targetId }, callback) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    // Bloquear votación para espectadores
    if (playerInfo.isSpectator) {
      callback({ success: false, error: 'Spectators cannot vote' });
      return;
    }

    const game = games.get(playerInfo.gameId);
    if (!game) return;

    const voter = game.players.find(p => p.id === playerInfo.playerId);
    const target = targetId === 'skip' ? 'SKIP' : (game.players.find(p => p.id === targetId)?.username || 'Unknown');
    console.log(`Player ${voter?.username} votes for ${target}`);

    const success = game.vote(playerInfo.playerId, targetId);
    if (success) {
      // Bots vote after a delay
      setTimeout(() => {
        game.makeBotVotes();

        // Broadcast updated game state
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.emit('game-state', game.getGameState(player.id));
            }
          }
        });

        // Check if all players have voted
        if (game.getAllVoted()) {
          console.log(`All players have voted in game ${playerInfo.gameId}, processing votes...`);
          setTimeout(() => {
            const result = game.processVotes();

            console.log('Vote processing result:', {
              eliminated: result.eliminated?.username,
              winner: result.winner,
              roundFinished: result.roundFinished,
              continueVoting: result.continueVoting
            });

            // Send vote results to all players
            game.players.forEach(player => {
              if (player.socketId) {
                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) {
                  playerSocket.emit('vote-result', result);

                  // Si la ronda continúa, reenviar estado
                  if (result.continueVoting) {
                    setTimeout(() => {
                      playerSocket.emit('game-state', game.getGameState(player.id));
                    }, 3000);
                  }
                }
              }
            });
          }, 1000);
        }
      }, 500);

      callback({ success: true });
    } else {
      callback({ success: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    const playerInfo = playerSockets.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.gameId);
      if (game) {
        // Verificar si el jugador desconectado es el host (primer jugador)
        const isHost = game.players[0]?.id === playerInfo.playerId;
        
        if (isHost) {
          console.log(`Host disconnected from game ${playerInfo.gameId}`);
          // Notificar a todos los otros jugadores que el host se desconectó
          game.players.forEach(player => {
            if (player.id !== playerInfo.playerId && player.socketId) {
              const playerSocket = io.sockets.sockets.get(player.socketId);
              if (playerSocket) {
                playerSocket.emit('host-disconnected', {
                  message: 'El anfitrión ha abandonado el juego. Serás devuelto al menú principal.',
                  reason: 'host_left'
                });
              }
            }
          });
          
          // Eliminar el juego después de un breve delay para asegurar que el mensaje llegue
          setTimeout(() => {
            games.delete(playerInfo.gameId);
            console.log(`Game ${playerInfo.gameId} deleted due to host disconnect`);
          }, 1000);
        } else {
          // Si no es el host, implementar lógica de desconexión según rol
          const disconnectedPlayer = game.players.find(p => p.id === playerInfo.playerId);
          
          if (disconnectedPlayer && game.status === 'playing') {
            console.log(`Player ${disconnectedPlayer.username} disconnected during game. Role: ${disconnectedPlayer.isImpostor ? 'Impostor' : 'Innocent'}`);
            
            // Marcar como eliminado en el juego
            disconnectedPlayer.isAlive = false;
            
            // Verificar condiciones según el rol
            if (disconnectedPlayer.isImpostor) {
              // Si el impostor se desconecta, los inocentes ganan
              console.log(`Impostor ${disconnectedPlayer.username} disconnected - Innocents win!`);
              
              const result = {
                eliminated: disconnectedPlayer,
                tie: false,
                winner: 'innocents',
                roundFinished: true,
                tournamentFinished: game.currentRound >= game.totalRounds,
                currentRound: game.currentRound,
                totalRounds: game.totalRounds,
                scores: game.getScoresArray(),
                isImpostorEliminated: true,
                playInnocentAudio: false,
                playInnocentsWinAudio: true,
                playImpostorWinAudio: false,
                disconnectionWin: true,
                revealedImpostor: {
                  id: disconnectedPlayer.id,
                  username: disconnectedPlayer.username,
                  isBot: disconnectedPlayer.isBot || false,
                  soccerPlayer: game.currentPlayer
                }
              };
              
              game.awardPoints('innocents');
              
              if (game.currentRound >= game.totalRounds) {
                game.status = 'finished';
              } else {
                game.currentRound++;
              }
              
              // Notificar a todos los jugadores del resultado
              game.players.forEach(player => {
                if (player.socketId) {
                  const playerSocket = io.sockets.sockets.get(player.socketId);
                  if (playerSocket) {
                    playerSocket.emit('vote-result', result);
                  }
                }
              });
              
            } else {
              // Si un inocente se desconecta
              const alivePlayersAfterDisconnect = game.players.filter(p => p.isAlive);
              console.log(`Innocent ${disconnectedPlayer.username} disconnected. Alive players remaining: ${alivePlayersAfterDisconnect.length}`);
              
              if (alivePlayersAfterDisconnect.length <= 2) {
                // Si quedan 2 o menos jugadores, terminar la ronda (ganan inocentes para evitar 1v1)
                console.log(`Too few players remaining (${alivePlayersAfterDisconnect.length}) - Innocents win to avoid 1v1!`);
                
                const result = {
                  eliminated: disconnectedPlayer,
                  tie: false,
                  winner: 'innocents',
                  roundFinished: true,
                  tournamentFinished: game.currentRound >= game.totalRounds,
                  currentRound: game.currentRound,
                  totalRounds: game.totalRounds,
                  scores: game.getScoresArray(),
                  isImpostorEliminated: false,
                  playInnocentAudio: false,
                  playInnocentsWinAudio: true,
                  playImpostorWinAudio: false,
                  disconnectionWin: true,
                  revealedImpostor: game.players.find(p => p.isImpostor) ? {
                    id: game.players.find(p => p.isImpostor).id,
                    username: game.players.find(p => p.isImpostor).username,
                    isBot: game.players.find(p => p.isImpostor).isBot || false,
                    soccerPlayer: game.currentPlayer
                  } : null
                };
                
                game.awardPoints('innocents');
                
                if (game.currentRound >= game.totalRounds) {
                  game.status = 'finished';
                } else {
                  game.currentRound++;
                }
                
                // Notificar a todos los jugadores del resultado
                game.players.forEach(player => {
                  if (player.socketId) {
                    const playerSocket = io.sockets.sockets.get(player.socketId);
                    if (playerSocket) {
                      playerSocket.emit('vote-result', result);
                    }
                  }
                });
                
              } else {
                // Si quedan más de 2 jugadores, continuar el juego
                console.log(`Game continues with ${alivePlayersAfterDisconnect.length} players`);
                
                // Solo notificar estado actualizado
                game.players.forEach(player => {
                  if (player.socketId) {
                    const playerSocket = io.sockets.sockets.get(player.socketId);
                    if (playerSocket) {
                      playerSocket.emit('game-state', game.getGameState(player.id));
                    }
                  }
                });
              }
            }
            
          } else {
            // Si no es el host y el juego no está en progreso, mantener la lógica existente
            // No removemos al jugador de la lista para permitir reconexión por username/playerId
            // Solo limpiamos el mapeo de socket actual
            
            // Notificar a otros jugadores del estado (sin patear al jugador)
            game.players.forEach(player => {
              if (player.socketId) {
                const playerSocket = io.sockets.sockets.get(player.socketId);
                if (playerSocket) {
                  playerSocket.emit('game-state', game.getGameState(player.id));
                }
              }
            });

            // Si el juego se queda realmente vacío (todos se fueron y limpiamos sockets), podríamos borrar la sala
            if (game.players.length === 0) {
              games.delete(playerInfo.gameId);
            }
          }
        }
      }

      playerSockets.delete(socket.id);
    }
  });

  socket.on('reset-game', (callback) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) {
      callback({ success: false, error: 'Player not found' });
      return;
    }

    const game = games.get(playerInfo.gameId);
    if (!game) {
      callback({ success: false, error: 'Game not found' });
      return;
    }

    // Solo el primer jugador (host) puede resetear el juego
    const isHost = game.players[0]?.id === playerInfo.playerId;
    if (!isHost) {
      callback({ success: false, error: 'Only the host can reset the game' });
      return;
    }

    console.log(`Resetting game ${playerInfo.gameId} by host ${game.players[0].username}`);

    // Resetear el juego
    game.resetGame();

    // Notificar a todos los jugadores el nuevo estado
    game.players.forEach(player => {
      if (player.socketId) {
        const playerSocket = io.sockets.sockets.get(player.socketId);
        if (playerSocket) {
          playerSocket.emit('game-state', game.getGameState(player.id));
        }
      }
    });

    callback({ success: true, gameState: game.getGameState(playerInfo.playerId) });
  });

  // Nuevo evento: un solo botón "Nueva partida" que resetea o crea
  socket.on('new-game', (callback) => {
    const playerInfo = playerSockets.get(socket.id);

    if (playerInfo) {
      // El jugador ya está en una sala → resetear esa sala
      const game = games.get(playerInfo.gameId);
      if (game) {
        console.log(`Resetting game ${playerInfo.gameId}`);
        game.resetGame();

        // Notificar a todos los jugadores de la sala
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = io.sockets.sockets.get(player.socketId);
            if (playerSocket) {
              playerSocket.emit('game-state', game.getGameState(player.id));
            }
          }
        });

        if (callback) callback({ success: true, gameId: playerInfo.gameId, mode: 'reset' });
        return;
      }
    }

    // Si no estaba en sala → crear una nueva
    const gameId = uuidv4().substring(0, 6).toUpperCase();
    const game = new Game(gameId);
    games.set(gameId, game);

    console.log(`New game created: ${gameId}`);
    if (callback) callback({ success: true, gameId, mode: 'new' });
  });
});

const path = require("path");

// Servir React build
app.use(express.static(path.join(__dirname, "../client/build")));

// Cualquier ruta que no sea API/socket -> React
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});