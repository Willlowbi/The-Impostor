# The Impostor 🎭

**The Impostor** is an online multiplayer game where players try to identify the impostor among soccer players. One player is secretly assigned the role of impostor while everyone else sees the same soccer player. Vote wisely to eliminate the impostor before they eliminate you!

## 🎮 Game Features

- **3-6 Players**: Perfect for small groups of friends
- **Real-time Multiplayer**: Powered by Socket.IO
- **Soccer Player Integration**: High-quality player images with reliable fallback avatars
- **Bot Players**: Practice mode with AI-controlled players for single player testing
- **Responsive Design**: Works on both desktop and mobile devices
- **Round-based Voting**: Democratic elimination system with intelligent bot behavior
- **Modern UI**: Beautiful soccer-themed design with SVG outline icons
- **Spanish Language**: Complete Spanish translation for better accessibility
- **Game Control**: Host-only new game options with manual game flow control

## 🎯 How to Play

### 🏆 **Multi-Round Game Mode (Multiplayer)**
1. **Create Game**: Host creates room and selects 3, 5, or 10 rounds
2. **Join Players**: 3-6 players join using the 6-character game code
3. **Start Game**: Host clicks "Iniciar Juego" when ready
4. **Play Multiple Rounds**: Each round is like a new mini-game:
   - All players participate (including previously eliminated)
   - Random role assignment (innocent soccer player or impostor)
   - Vote to eliminate players or skip voting
   - Round ends when impostor is eliminated or survives to final 2
5. **Earn Points**: 
   - **Innocents**: 1 point per round won (teamwork victory)
   - **Impostors**: 2 points per round won (solo challenge victory)
6. **Live Leaderboard**: Track scores and rankings in real-time
7. **Host Control**: After each round, host chooses to continue to next round or end game
8. **Game Victory**: Player with most points after all rounds wins!
9. **New Game Option**: When game ends, host can start a completely new game

### 🤖 **Bot Game Mode**
1. **Enable Bots**: Toggle "Modo de Práctica con Bots" when creating game
2. **Select Rounds**: Choose 3, 5, or 10 rounds just like multiplayer
3. **Smart Competition**: Bots compete strategically for points
4. **Same Scoring**: Identical game rules and point system
5. **Solo Practice**: Perfect for learning strategies and testing skills

### 🎮 **Game Flow**
- **Host Authority**: Only game creator controls progression
- **Round-by-Round**: Decision to continue after each completed round
- **No Auto-Advance**: Manual control ensures strategic pacing
- **End Game**: Host can end game early if desired
- **New Game**: When all rounds finished, host can start completely new game

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd the-impostor
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - React frontend on `http://localhost:3000`

### Manual Setup

If you prefer to set up each part individually:

1. **Backend Setup**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Frontend Setup** (in a new terminal)
   ```bash
   cd client
   npm install
   npm start
   ```

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - Real-time communication
- **Axios** - HTTP requests for soccer API
- **UUID** - Unique identifier generation

### Frontend
- **React** - UI framework
- **Socket.IO Client** - Real-time communication
- **TailwindCSS** - Utility-first CSS framework
- **Modern CSS** - Gradients, animations, and responsive design

## 🎨 Features Breakdown

### Real-time Communication
- Instant game state updates
- Live player join/leave notifications
- Real-time voting and results

### Game Logic
- Random impostor assignment
- Vote counting and tie handling
- Win condition checking
- Player elimination system

### User Interface
- Modern glassmorphism design
- Smooth animations and transitions
- Mobile-responsive layout
- Intuitive game flow

### Soccer Player Integration
- Fallback player database included
- Player photos and names
- Error handling for failed API requests

## 🔧 Configuration

### Server Configuration
The server runs on port 5000 by default. You can change this by setting the `PORT` environment variable:
```bash
PORT=8000 npm run server
```

### CORS Configuration
The backend is configured to accept connections from `http://localhost:3000`. If you deploy the frontend to a different URL, update the CORS settings in `server/index.js`.

## 📱 Mobile Support

The game is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Responsive grid layouts
- Mobile-optimized text sizes
- Gesture-friendly interactions

## 🚀 Deployment

### Frontend Deployment
Build the React app for production:
```bash
cd client
npm run build
```

### Backend Deployment
The backend can be deployed to any Node.js hosting service:
- Heroku
- Railway
- DigitalOcean
- AWS EC2

Update the Socket.IO CORS configuration with your deployed frontend URL.

## 🎲 Game Strategy Tips

### For Innocents
- Pay attention to voting patterns
- Look for inconsistent behavior
- Coordinate with other players
- Don't be afraid to skip if unsure

### For the Impostor
- Blend in with the group
- Vote strategically to avoid suspicion
- Create confusion in discussions
- Target the most observant players

## 🐛 Troubleshooting

### Common Issues

1. **Connection Issues**: Make sure both backend (port 5000) and frontend (port 3000) are running
2. **Game Not Starting**: Ensure you have at least 3 players in the lobby
3. **Images Not Loading**: Soccer player images have fallback placeholders if URLs fail

### Development Tips

- Check browser console for error messages
- Monitor server logs for backend issues
- Use React Developer Tools for component debugging

## 📄 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 🆕 Recent Updates

### v3.2 - Multi-Round Game System with Correct Terminology
- **🏆 Multi-Round Mode**: Play 3, 5, or 10 rounds with cumulative scoring
- **📊 Live Leaderboard**: Real-time scores and rankings throughout the game
- **🎯 Strategic Gameplay**: Points system rewards both innocents (1pt) and impostors (2pts)
- **🎮 Enhanced Flow Control**: Host controls round progression and game completion
- **⚡ Smart Victory Detection**: Automatic impostor wins in 1v1 situations
- **🔄 Round Reset System**: All players participate in each new round
- **🆕 New Game Option**: Host can start completely new game when current one ends
- **🤖 Balanced Bot Integration**: Bots respect round selection and game flow
- **💾 Username Persistence**: Auto-saves and loads usernames using localStorage

### Game Features
- **Multi-Round Battles**: Choose between 3, 5, or 10-round games
- **Dynamic Scoring**: Innocents earn 1 point per win, Impostors earn 2 points
- **Progressive Competition**: Roles randomize each round for fair gameplay  
- **Host Control**: Game creator decides when to continue or end
- **Victory Conditions**: Player with most points after all rounds wins game
- **Live Updates**: Real-time leaderboard shows current standings

### Critical Fixes & Updates (v3.2)
- **🎛️ Bot Round Selection**: Bot games now allow hosts to choose round count (3/5/10) before starting
- **⚡ Automatic Impostor Victory**: Game automatically ends when 1 impostor vs 1 innocent (impostor wins)
- **🔄 Fresh Round Participation**: All players (including previously eliminated) participate in each new round
- **👑 Host Game Control**: Host options properly appear to continue or end game after each round
- **🆕 New Game Flow**: When all rounds complete, host can start completely new game
- **📝 Correct Terminology**: Clear distinction between "rounds" (individual matches) and "games" (series of rounds)

---

**Have fun playing El Impostor!** 🎭⚽
