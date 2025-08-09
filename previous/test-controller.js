class MultiplayerTestController {
    constructor(gameInstance) {
        this.game = gameInstance;
        this.testPlayers = [];
        this.playerIdCounter = 1;
        
        this.seed = {
            startSimulation: (playerCount) => {
                console.log(`Starting simulation with ${playerCount} players`);
                
                // Add test players
                for (let i = 0; i < playerCount; i++) {
                    setTimeout(() => {
                        this.addTestPlayer();
                    }, i * 1000);
                }
            }
        };
    }
    
    addTestPlayer() {
        const colors = ['#3498db', '#2ecc71', '#9b59b6', '#f39c12', '#e67e22'];
        const names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        
        const playerId = 'test_' + this.playerIdCounter++;
        const playerData = {
            id: playerId,
            x: Math.floor(Math.random() * 15 + 2) * this.game.TILE_SIZE,
            y: Math.floor(Math.random() * 10 + 2) * this.game.TILE_SIZE,
            color: colors[Math.floor(Math.random() * colors.length)],
            name: names[Math.floor(Math.random() * names.length)],
            direction: 'down'
        };
        
        this.game.receiveFromBackend('player_joined', playerData);
        this.testPlayers.push(playerId);
        
        // Start random movement for this test player
        this.startRandomMovement(playerId);
    }
    
    startRandomMovement(playerId) {
        const movePlayer = () => {
            if (this.game.otherPlayers[playerId]) {
                const player = this.game.otherPlayers[playerId];
                const directions = [
                    { x: -32, y: 0, dir: 'left' },
                    { x: 32, y: 0, dir: 'right' },
                    { x: 0, y: -32, dir: 'up' },
                    { x: 0, y: 32, dir: 'down' }
                ];
                
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const newX = player.x + direction.x;
                const newY = player.y + direction.y;
                
                // Simple bounds checking
                if (newX >= 32 && newX < 24 * 32 && newY >= 32 && newY < 18 * 32) {
                    this.game.receiveFromBackend('player_moved', {
                        id: playerId,
                        x: newX,
                        y: newY,
                        direction: direction.dir
                    });
                }
            }
            
            // Schedule next movement
            setTimeout(movePlayer, Math.random() * 2000 + 1000);
        };
        
        // Start movement after a delay
        setTimeout(movePlayer, 1000);
    }
    
    removeAllTestPlayers() {
        this.testPlayers.forEach(playerId => {
            this.game.receiveFromBackend('player_left', { id: playerId });
        });
        this.testPlayers = [];
    }
    
    addSingleTestPlayer() {
        this.addTestPlayer();
    }
}