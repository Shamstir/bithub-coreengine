// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize the game
        let game = null;
        try {
            game = new MultiplayerGame('gameContainer');
            if (!game || !Array.isArray(game.mapData) || game.mapData.length === 0) {
                console.error('Map data not properly initialized');
                return;
            }
        } catch (error) {
            console.error('Error initializing game:', error);
            return;
        }
        
        // Wait for assets to load with error handling
        let assetsLoaded = false;
        try {
            assetsLoaded = await game.waitForAssets();
        } catch (error) {
            console.error('Error loading assets:', error);
            assetsLoaded = false;
        }

        if (assetsLoaded) {
            console.log('Assets loaded successfully');
            
            // Set background image from assets if available
            try {
                const backgroundImage = Assets.get('background', 'office');
                game.backgroundImage = backgroundImage || null;
                
                if (backgroundImage) {
                    game.assetsReady = true; // Ensure assets are marked as ready if office image loads
                    console.log('Office background image loaded');
                } else {
                    console.warn('Office background image not found in assets');
                }
            } catch (error) {
                console.error('Error setting background image:', error);
                game.backgroundImage = null;
            }
        } else {
            console.warn('Failed to load assets. Proceeding with default settings.');
            game.assetsReady = false;
        }

        // Create test controller with error handling
        let testController = null;
        try {
            testController = new MultiplayerTestController(game);
            
            // Start simulation with 2 test players (fewer to avoid crowding in office)
            testController.seed.startSimulation(2);
            console.log('Test controller initialized with 2 players');
        } catch (error) {
            console.error('Error creating test controller:', error);
            console.warn('Continuing without test controller');
        }

        // Office-specific setup logging
        console.log('=== OFFICE IMAGE SETUP COMPLETE ===');
        console.log('The collision system has been configured for your office image.');
        console.log('');
        console.log('TIPS FOR BEST RESULTS:');
        console.log('1. Upload your office image using the file input');
        console.log('2. Click around the image to see RGB values');
        console.log('3. Press C to toggle collision overlay (green=walkable, red=blocked)');
        console.log('4. If some areas are wrong, use these commands:');
        console.log('   - game.addWalkableColor(r, g, b, "name") for floor areas');
        console.log('   - game.addUnwalkableColor(r, g, b, "name") for furniture');
        console.log('');
        console.log('EXAMPLE: If you click on a floor area and see RGB(225, 195, 135),');
        console.log('and it shows as red (blocked), run:');
        console.log('game.addWalkableColor(225, 195, 135, "custom_floor")');

        // Global access for debugging
        window.game = game;
        if (testController) {
            window.testController = testController;
        }

        // Add helpful console commands
        console.log('');
        console.log('Available commands:');
        console.log('- game.toggleCollisionOverlay() - Toggle collision overlay');
        
        if (testController) {
            console.log('- testController.addSingleTestPlayer() - Add a test player');
            console.log('- testController.removeAllTestPlayers() - Remove all test players');
        }
        
        console.log('- game.addWalkableColor(r, g, b, name) - Add walkable color');
        console.log('- game.addUnwalkableColor(r, g, b, name) - Add unwalkable color');
        console.log('- game.connectToServer(url) - Connect to WebSocket server');

    } catch (error) {
        console.error('Critical error during game initialization:', error);
        
        // Attempt to create a minimal fallback
        try {
            const game = new MultiplayerGame('gameCanvas');
            window.game = game;
            console.log('Fallback game instance created');
        } catch (fallbackError) {
            console.error('Failed to create fallback game instance:', fallbackError);
        }
    }
});