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

// Game state management
const games = new Map();
const playerSockets = new Map();

// Soccer player data: Leyendas, jóvenes promesas y jugadores actuales
const fallbackPlayers = [
    // 🔥 LEYENDAS
    { name: "Pelé", photo: "https://img.a.transfermarkt.technology/portrait/big/171919-1464619083.jpg?lm=1" },
    { name: "Diego Maradona", photo: "https://img.a.transfermarkt.technology/portrait/big/8029-1581411739.jpg?lm=1" },
    { name: "Zinedine Zidane", photo: "https://img.a.transfermarkt.technology/portrait/big/3114-1578476881.jpg?lm=1" },
    { name: "Ronaldinho", photo: "https://img.a.transfermarkt.technology/portrait/big/3373-1665062826.jpg?lm=1" },
    { name: "Ronaldo Nazário", photo: "https://img.a.transfermarkt.technology/portrait/big/3140-1464618825.jpg?lm=1" },
    { name: "Paolo Maldini", photo: "https://img.a.transfermarkt.technology/portrait/big/5805-1464618826.jpg?lm=1" },
    { name: "Franz Beckenbauer", photo: "https://img.a.transfermarkt.technology/portrait/big/3373-1689339202.jpg?lm=1" },
    { name: "Alfredo Di Stéfano", photo: "https://img.a.transfermarkt.technology/portrait/big/35624-1691599486.jpg?lm=1" },
    { name: "George Best", photo: "https://img.a.transfermarkt.technology/portrait/big/8025-1581411802.jpg?lm=1" },
    { name: "Johan Cruyff", photo: "https://img.a.transfermarkt.technology/portrait/big/8027-1581411902.jpg?lm=1" },
    { name: "Thierry Henry", photo: "https://img.a.transfermarkt.technology/portrait/big/3220-1665063040.jpg?lm=1" },
    { name: "Iker Casillas", photo: "https://img.a.transfermarkt.technology/portrait/big/28515-1665063319.jpg?lm=1" },
    { name: "Andrea Pirlo", photo: "https://img.a.transfermarkt.technology/portrait/big/5815-1665063244.jpg?lm=1" },
  
    // ⚽ ACTUALES
    { name: "Lionel Messi", photo: "https://img.a.transfermarkt.technology/portrait/big/28003-1671435885.jpg?lm=1" },
    { name: "Cristiano Ronaldo", photo: "https://img.a.transfermarkt.technology/portrait/big/8198-1694609670.jpg?lm=1" },
    { name: "Neymar Jr", photo: "https://img.a.transfermarkt.technology/portrait/big/68290-1665063303.jpg?lm=1" },
    { name: "Kylian Mbappé", photo: "https://img.a.transfermarkt.technology/portrait/big/342229-1675775034.jpg?lm=1" },
    { name: "Kevin De Bruyne", photo: "https://img.a.transfermarkt.technology/portrait/big/88755-1664870768.jpg?lm=1" },
    { name: "Erling Haaland", photo: "https://img.a.transfermarkt.technology/portrait/big/418560-1665063607.jpg?lm=1" },
    { name: "Vinicius Jr", photo: "https://img.a.transfermarkt.technology/portrait/big/371998-1664870911.jpg?lm=1" },
    { name: "Robert Lewandowski", photo: "https://img.a.transfermarkt.technology/portrait/big/38253-1665063142.jpg?lm=1" },
    { name: "Mohamed Salah", photo: "https://img.a.transfermarkt.technology/portrait/big/148455-1664785716.jpg?lm=1" },
    { name: "Luka Modric", photo: "https://img.a.transfermarkt.technology/portrait/big/27992-1664870894.jpg?lm=1" },
    { name: "Karim Benzema", photo: "https://img.a.transfermarkt.technology/portrait/big/18922-1665063109.jpg?lm=1" },
    { name: "Antoine Griezmann", photo: "https://img.a.transfermarkt.technology/portrait/big/125781-1665063331.jpg?lm=1" },
    { name: "Virgil van Dijk", photo: "https://img.a.transfermarkt.technology/portrait/big/139208-1664870809.jpg?lm=1" },
  
    // 🌟 JÓVENES PROMESAS
    { name: "Jude Bellingham", photo: "https://img.a.transfermarkt.technology/portrait/big/581678-1665063339.jpg?lm=1" },
    { name: "Pedri", photo: "https://img.a.transfermarkt.technology/portrait/big/683840-1665063256.jpg?lm=1" },
    { name: "Gavi", photo: "https://img.a.transfermarkt.technology/portrait/big/646740-1665063298.jpg?lm=1" },
    { name: "Jamal Musiala", photo: "https://img.a.transfermarkt.technology/portrait/big/580195-1665063630.jpg?lm=1" },
    { name: "Youssoufa Moukoko", photo: "https://img.a.transfermarkt.technology/portrait/big/503687-1665063687.jpg?lm=1" },
    { name: "Endrick", photo: "https://img.a.transfermarkt.technology/portrait/big/1065122-1672337465.jpg?lm=1" },
    { name: "Lamine Yamal", photo: "https://img.a.transfermarkt.technology/portrait/big/987161-1665063242.jpg?lm=1" },
    { name: "Désiré Doué", photo: "https://img.a.transfermarkt.technology/portrait/big/1020823-1665063260.jpg?lm=1" },
    { name: "Alejandro Garnacho", photo: "https://img.a.transfermarkt.technology/portrait/big/827725-1665063264.jpg?lm=1" },
    { name: "Arda Güler", photo: "https://img.a.transfermarkt.technology/portrait/big/826696-1665063250.jpg?lm=1" },
    { name: "Xavi Simons", photo: "https://img.a.transfermarkt.technology/portrait/big/462697-1665063257.jpg?lm=1" }
];  
  
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
    this.usedPlayers = new Set(); // Nuevo: Tracking de jugadores usados
  }

  addPlayer(playerId, username, socketId, isBot = false) {
    if (this.players.length >= 6) {
      return false;
    }
    
    const player = {
      id: playerId,
      username,
      socketId,
      isAlive: true,
      isImpostor: false,
      isBot: isBot
    };
    
    this.players.push(player);
    return true;
  }

  addBot(botName) {
    const botId = uuidv4();
    return this.addPlayer(botId, botName, null, true);
  }

  addBotsToFill() {
    const botNames = [
      'Bot_PelÃ©', 'Bot_Maradona', 'Bot_Messi', 
      'Bot_Cristiano', 'Bot_Neymar', 'Bot_MbappÃ©'
    ];
    
    let botsAdded = 0;
    while (this.players.length < 3 && botsAdded < botNames.length) {
      const botName = botNames[botsAdded];
      if (this.addBot(botName)) {
        botsAdded++;
      } else {
        break;
      }
    }
    
    return botsAdded;
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
    
    // Assign impostor randomly from ALL players
    const allPlayers = this.players;
    const impostorIndex = Math.floor(Math.random() * allPlayers.length);
    this.impostorId = allPlayers[impostorIndex].id;
    allPlayers[impostorIndex].isImpostor = true;
    
    console.log(`Impostor assigned: ${allPlayers[impostorIndex].username}`);
    
    // Get random soccer player for this round
    this.currentPlayer = await this.getRandomSoccerPlayer();
    console.log(`Soccer player for this round: ${this.currentPlayer.name}`);
    
    // Check immediate win condition (only 2 players total in game)
    if (allPlayers.length === 2) {
      console.log('Only 2 players - Impostor wins immediately');
      return { immediateWin: 'impostors' };
    }
    
    return true;
  }

  async getRandomSoccerPlayer() {
    try {
      // Filtrar jugadores que aún no se han usado
      const availablePlayers = fallbackPlayers.filter(p => !this.usedPlayers.has(p.name));
  
      // Si ya usaste todos, resetea la lista
      let randomPlayer;
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
  
      // Intentar obtener datos de la API
      const response = await axios.get(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(randomPlayer.name)}`
      );
  
      if (response.data && response.data.player && response.data.player.length > 0) {
        const player = response.data.player[0];
        return {
          // Mantener el nombre de tu lista, no el que devuelva la API
          name: randomPlayer.name,
          photo: player.strThumb || randomPlayer.photo
        };
      }      
  
      // Si la API no devuelve nada, usa el fallback
      return randomPlayer;
  
    } catch (error) {
      console.error("Error fetching from TheSportsDB:", error.message);
  
      // En caso de error, buscar un fallback no repetido
      const availableFallback = fallbackPlayers.filter(p => !this.usedPlayers.has(p.name));
  
      if (availableFallback.length === 0) {
        this.usedPlayers.clear();
        return fallbackPlayers[Math.floor(Math.random() * fallbackPlayers.length)];
      }
  
      return availableFallback[Math.floor(Math.random() * availableFallback.length)];
    }
  }  

  vote(playerId, targetId) {
    if (this.status !== 'playing') return false;
    
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) return false;
    
    this.votes.set(playerId, targetId);
    return true;
  }

  processVotes() {
    const voteCounts = new Map();
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    console.log(`=== PROCESSING VOTES - Round ${this.currentRound}, Voting Turn ${this.votingTurn} ===`);
    console.log(`Alive players: ${alivePlayers.map(p => p.username).join(', ')}`);
    console.log('Votes:', Array.from(this.votes.entries()).map(([pId, tId]) => {
      const voter = this.players.find(p => p.id === pId)?.username || 'Unknown';
      const target = tId === 'skip' ? 'SKIP' : (this.players.find(p => p.id === tId)?.username || 'Unknown');
      return `${voter} -> ${target}`;
    }).join(', '));
    
    // Count votes (excluding skips)
    this.votes.forEach((targetId) => {
      if (targetId === 'skip') return;
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1);
    });
    
    console.log('Vote counts:', Array.from(voteCounts.entries()).map(([pId, count]) => {
      const playerName = this.players.find(p => p.id === pId)?.username || 'Unknown';
      return `${playerName}: ${count}`;
    }).join(', '));
    
    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayerId = null;
    
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedPlayerId = playerId;
      }
    });
    
    // Check for ties
    if (maxVotes === 0 || this.isTie(voteCounts, maxVotes)) {
      this.consecutiveTies++;
      console.log(`TIE! Consecutive ties: ${this.consecutiveTies}`);
      
      // After 2 consecutive ties, force elimination to prevent infinite loops
      if (this.consecutiveTies >= 2 && this.enableBots) {
        console.log('Forcing elimination due to consecutive ties');
        const votableTargets = Array.from(voteCounts.keys());
        if (votableTargets.length > 0) {
          eliminatedPlayerId = votableTargets[Math.floor(Math.random() * votableTargets.length)];
          console.log(`Force eliminating: ${this.players.find(p => p.id === eliminatedPlayerId)?.username}`);
        } else {
          // No one got votes, continue to next voting turn
          this.votes.clear();
          this.votingTurn++;
          return { 
            eliminated: null, 
            tie: true, 
            roundFinished: false, 
            tournamentFinished: false,
            continueVoting: true,
            currentRound: this.currentRound, // Send current round, not incremented
            totalRounds: this.totalRounds,
            scores: this.getScoresArray()
          };
        }
      } else {
        // Continue to next voting turn within same round
        this.votes.clear();
        this.votingTurn++;
        return { 
          eliminated: null, 
          tie: true, 
          roundFinished: false, 
          tournamentFinished: false,
          continueVoting: true,
          currentRound: this.currentRound, // Send current round, not incremented
          totalRounds: this.totalRounds,
          scores: this.getScoresArray()
        };
      }
    } else {
      this.consecutiveTies = 0;
    }
    
    // Eliminate player
    const eliminatedPlayer = this.players.find(p => p.id === eliminatedPlayerId);
    if (eliminatedPlayer) {
      eliminatedPlayer.isAlive = false;
      console.log(`ELIMINATED: ${eliminatedPlayer.username} (Impostor: ${eliminatedPlayer.isImpostor})`);
    }
    
    // Check win conditions AFTER elimination
    const roundWinner = this.checkWinCondition();
    console.log(`Round winner check: ${roundWinner}`);
    
    let roundFinished = false;
    let tournamentFinished = false;
    const completedRound = this.currentRound; // Store the COMPLETED round number BEFORE incrementing
    
    if (roundWinner) {
      // Round is finished - someone won
      roundFinished = true;
      this.awardPoints(roundWinner);
      console.log(`ROUND ${this.currentRound} FINISHED! Winner: ${roundWinner}`);
      
      // Check if tournament is finished
      if (this.currentRound >= this.totalRounds) {
        tournamentFinished = true;
        this.status = 'finished';
        console.log('TOURNAMENT FINISHED!');
      } else {
        // Prepare for next round (increment AFTER storing completed round)
        this.currentRound++;
        console.log(`Moving to Round ${this.currentRound}`);
      }
    } else {
      // Round continues - check if we need to keep voting
      const alivePlayersAfterElimination = this.players.filter(p => p.isAlive);
      console.log(`Round continues. Alive players: ${alivePlayersAfterElimination.length}`);
      
      // If only 2 players left, impostor wins automatically
      if (alivePlayersAfterElimination.length === 2) {
        console.log('Only 2 players left - Impostor wins!');
        roundFinished = true;
        this.awardPoints('impostors');
        
        if (this.currentRound >= this.totalRounds) {
          tournamentFinished = true;
          this.status = 'finished';
        } else {
          this.currentRound++;
        }
        
        return {
          eliminated: eliminatedPlayer,
          tie: false,
          winner: 'impostors',
          roundFinished,
          tournamentFinished,
          currentRound: completedRound, // Use completed round number
          totalRounds: this.totalRounds,
          scores: this.getScoresArray(),
          isImpostorEliminated: eliminatedPlayer?.isImpostor || false,
          automaticWin: true
        };
      }
    }
    
    this.votes.clear();
    this.votingTurn++;
    
    return { 
      eliminated: eliminatedPlayer, 
      tie: false, 
      winner: roundWinner,
      roundFinished,
      tournamentFinished,
      currentRound: completedRound, // Use completed round number, not incremented
      totalRounds: this.totalRounds,
      scores: this.getScoresArray(),
      isImpostorEliminated: eliminatedPlayer?.isImpostor || false,
      continueVoting: !roundFinished
    };
  }
  
  async continueToNextRound() {
    if (this.currentRound > this.totalRounds) {
      return false; // Tournament already finished
    }
    
    this.status = 'playing';
    const roundResult = await this.startRound();
    
    // Handle immediate win condition
    if (roundResult && roundResult.immediateWin) {
      const completedRound = this.currentRound; // Store completed round before increment
      this.awardPoints(roundResult.immediateWin);
      
      // Check if tournament is finished
      if (this.currentRound >= this.totalRounds) {
        this.status = 'finished';
        return { 
          success: true, 
          immediateWin: roundResult.immediateWin,
          tournamentFinished: true,
          currentRound: completedRound, // Use completed round
          totalRounds: this.totalRounds,
          scores: this.getScoresArray()
        };
      } else {
        // Prepare for next round (increment AFTER storing completed round)
        this.currentRound++;
        return { 
          success: true, 
          immediateWin: roundResult.immediateWin,
          roundFinished: true,
          tournamentFinished: false,
          currentRound: completedRound, // Use completed round
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
      // Award 1 point to each innocent player
      this.players.filter(p => !p.isImpostor).forEach(player => {
        const currentScore = this.scores.get(player.id) || 0;
        this.scores.set(player.id, currentScore + 1);
        console.log(`${player.username} (innocent) gets 1 point, total: ${currentScore + 1}`);
      });
    } else if (winner === 'impostors') {
      // Award 2 points to impostor
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

  async continueToNextRound() {
    if (this.currentRound > this.totalRounds) {
      return false; // Tournament already finished
    }
    
    this.status = 'playing';
    const roundResult = await this.startRound();
    
    // Handle immediate win condition
    if (roundResult && roundResult.immediateWin) {
      this.awardPoints(roundResult.immediateWin);
      
      // Check if tournament is finished
      if (this.currentRound >= this.totalRounds) {
        this.status = 'finished';
        return { 
          success: true, 
          immediateWin: roundResult.immediateWin,
          tournamentFinished: true,
          currentRound: this.currentRound,
          totalRounds: this.totalRounds,
          scores: this.getScoresArray()
        };
      } else {
        // Prepare for next round
        this.currentRound++;
        return { 
          success: true, 
          immediateWin: roundResult.immediateWin,
          roundFinished: true,
          tournamentFinished: false,
          currentRound: this.currentRound,
          totalRounds: this.totalRounds,
          scores: this.getScoresArray()
        };
      }
    }
    
    return { success: true };
  }

  isTie(voteCounts, maxVotes) {
    let playersWithMaxVotes = 0;
    voteCounts.forEach((count) => {
      if (count === maxVotes) playersWithMaxVotes++;
    });
    return playersWithMaxVotes > 1;
  }

  checkWinCondition() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveImpostors = alivePlayers.filter(p => p.isImpostor);
    const aliveInnocents = alivePlayers.filter(p => !p.isImpostor);
    
    console.log(`Win condition check: ${aliveInnocents.length} innocents, ${aliveImpostors.length} impostors alive`);
    
    // Innocents win if impostor is eliminated
    if (aliveImpostors.length === 0) {
      return 'innocents';
    }
    
    // Impostor wins if equal or more impostors than innocents (shouldn't happen with 1 impostor, but safety check)
    // OR if only 2 players left total (handled in processVotes)
    if (aliveInnocents.length <= aliveImpostors.length) {
      return 'impostors';
    }
    
    return null; // Game continues
  }

  getAllVoted() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    return this.votes.size === alivePlayers.length;
  }

  // Improved bot voting logic
  makeBotVotes() {
    const alivePlayers = this.players.filter(p => p.isAlive);
    const aliveBots = alivePlayers.filter(p => p.isBot);
    
    console.log(`Making votes for ${aliveBots.length} bots`);
    
    aliveBots.forEach(bot => {
      if (!this.votes.has(bot.id)) {
        const possibleTargets = alivePlayers.filter(p => p.id !== bot.id);
        
        // Lower skip chance to reduce ties, even lower after consecutive ties
        const skipChance = this.consecutiveTies > 0 ? 0.05 : 0.15;
        
        if (Math.random() > skipChance && possibleTargets.length > 0) {
          if (bot.isImpostor) {
            // Impostor bot tries to vote out innocents
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
            // Innocent bot votes randomly (they don't know who's impostor)
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

  getGameState(playerId) {
    const player = this.players.find(p => p.id === playerId);
    const alivePlayers = this.players.filter(p => p.isAlive);
    
    return {
      gameId: this.id,
      status: this.status,
      round: this.votingTurn, // This is the voting turn, not the game round
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      scores: this.getScoresArray(),
      players: this.players.map(p => ({
        id: p.id,
        username: p.username,
        isAlive: p.isAlive,
        isBot: p.isBot || false
      })),
      currentPlayer: player?.isImpostor ? null : this.currentPlayer,
      isImpostor: player?.isImpostor || false,
      hasVoted: this.votes.has(playerId),
      allVoted: this.getAllVoted(),
      voteCounts: this.votes.size,
      totalAlivePlayers: alivePlayers.length
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
    this.players.forEach(player => {
      this.scores.set(player.id, 0);
    });
    
    // Resetear estado de jugadores
    this.players.forEach(player => {
      player.isAlive = true;
      player.isImpostor = false;
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

  socket.on('join-game', ({ gameId, username }, callback) => {
    const game = games.get(gameId);
    
    if (!game) {
      callback({ success: false, error: 'Game not found' });
      return;
    }
    
    if (game.status !== 'waiting') {
      callback({ success: false, error: 'Game already started' });
      return;
    }
    
    const playerId = uuidv4();
    const success = game.addPlayer(playerId, username, socket.id);
    
    if (!success) {
      callback({ success: false, error: 'Game is full' });
      return;
    }
    
    playerSockets.set(socket.id, { playerId, gameId });
    socket.join(gameId);
    
    if (game.enableBots && game.players.length === 1) {
      game.addBotsToFill();
      console.log(`Added bots to game ${gameId}. Total players: ${game.players.length}`);
    }
    
    // Broadcast updated game state to all players
    game.players.forEach(player => {
      if (player.socketId) {
        const playerSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.id === player.socketId);
        if (playerSocket) {
          playerSocket.emit('game-state', game.getGameState(player.id));
        }
      }
    });
    
    callback({ success: true, playerId, gameState: game.getGameState(playerId) });
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
          const playerSocket = Array.from(io.sockets.sockets.values())
            .find(s => s.id === player.socketId);
          if (playerSocket) {
            playerSocket.emit('game-state', game.getGameState(player.id));
          }
        }
      });
      callback({ success: true });
    } else if (result && result.immediateWin) {
      console.log(`Immediate win in game ${playerInfo.gameId}: ${result.immediateWin}`);
      game.players.forEach(player => {
        if (player.socketId) {
          const playerSocket = Array.from(io.sockets.sockets.values())
            .find(s => s.id === player.socketId);
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
        console.log(`Immediate win in next round: ${result.immediateWin}`);
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = Array.from(io.sockets.sockets.values())
              .find(s => s.id === player.socketId);
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
            const playerSocket = Array.from(io.sockets.sockets.values())
              .find(s => s.id === player.socketId);
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
            const playerSocket = Array.from(io.sockets.sockets.values())
              .find(s => s.id === player.socketId);
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
                const playerSocket = Array.from(io.sockets.sockets.values())
                  .find(s => s.id === player.socketId);
                if (playerSocket) {
                  playerSocket.emit('vote-result', result);
                  
                  // If round continues (no winner yet), send updated game state
                  if (result.continueVoting) {
                    setTimeout(() => {
                      playerSocket.emit('game-state', game.getGameState(player.id));
                    }, 3000); // Give time to see the voting result
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
        game.removePlayer(playerInfo.playerId);
        
        // Notify other players
        game.players.forEach(player => {
          if (player.socketId) {
            const playerSocket = Array.from(io.sockets.sockets.values())
              .find(s => s.id === player.socketId);
            if (playerSocket) {
              playerSocket.emit('game-state', game.getGameState(player.id));
            }
          }
        });
        
        // Clean up empty games
        if (game.players.length === 0) {
          games.delete(playerInfo.gameId);
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
        const playerSocket = Array.from(io.sockets.sockets.values())
          .find(s => s.id === player.socketId);
        if (playerSocket) {
          playerSocket.emit('game-state', game.getGameState(player.id));
        }
      }
    });
    
    callback({ success: true, gameState: game.getGameState(playerInfo.playerId) });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});