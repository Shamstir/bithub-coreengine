class Player {
    constructor(id, x, y, color = '#3498db', name = 'Player', isLocal = false, gameContainer = null) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.color = color;
        this.name = name;
        this.direction = 'down';
        this.isMoving = false;
        this.animFrame = 0;
        this.isLocalPlayer = isLocal;
        this.gameContainer = gameContainer;
        
        // Create HTML element for this player
        this.createPlayerElement();
    }
    
    createPlayerElement() {
        if (!this.gameContainer) {
            console.warn('No game container provided for player', this.id);
            return;
        }
        
        // Create player element
        this.element = document.createElement('div');
        this.element.id = `player-${this.id}`;
        this.element.style.cssText = `
            position: absolute;
            width: 32px;
            height: 32px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            z-index: 10;
            transition: left 0.1s ease, top 0.1s ease;
        `;
        
        // Create name label
        this.nameLabel = document.createElement('div');
        this.nameLabel.style.cssText = `
            position: absolute;
            top: -20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-family: Arial, sans-serif;
            white-space: nowrap;
        `;
        this.nameLabel.textContent = this.name;
        
        this.element.appendChild(this.nameLabel);
        this.gameContainer.appendChild(this.element);
        
        // Set initial position and appearance
        this.updateElementPosition();
        this.updateElementAppearance();
    }
    
    updateElementPosition() {
        if (this.element) {
            this.element.style.left = this.x + 'px';
            this.element.style.top = this.y + 'px';
        }
    }
    
    updateElementAppearance() {
        if (!this.element) return;
        
        // Try to use character images first
        let playerImg = null;
        if (typeof Assets !== 'undefined') {
            playerImg = this.isMoving ? Assets.get('character', 'walk') : Assets.get('character', 'stand');
        }
        
        if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
            this.element.style.backgroundImage = `url(${playerImg.src})`;
        } else {
            // Fallback to colored rectangle
            this.element.style.backgroundImage = 'none';
            this.element.style.backgroundColor = this.color;
            this.element.style.borderRadius = '4px';
            this.element.style.border = '2px solid #fff';
        }
    }
    
    update() {
        if (this.isLocalPlayer) {
            // For local player, just update the visual position
            this.updateElementPosition();
            this.updateElementAppearance();
            return;
        }

        // Smooth movement towards target position for other players
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) { // Only move if distance is greater than 1 pixel
            const speed = 2; // Slower, more natural movement
            this.x += (dx / distance) * speed;
            this.y += (dy / distance) * speed;
            this.isMoving = true;
            this.animFrame += 0.2;
        } else {
            // Snap to exact target when close enough
            this.x = this.targetX;
            this.y = this.targetY;
            this.isMoving = false;
            this.animFrame = 0;
        }
        
        // Update HTML element position and appearance
        this.updateElementPosition();
        this.updateElementAppearance();
    }
    
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }
    
    draw(ctx, tileSize) {
        const screenX = this.x;
        const screenY = this.y;

        // Draw shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(screenX + 2, screenY + tileSize - 4, tileSize - 4, 4);

        // Use images for player rendering if available
        let playerImg = null;
        if (typeof Assets !== 'undefined') {
            // Use walk animation image if moving, else standing image
            playerImg = this.isMoving ? Assets.get('character', 'walk') : Assets.get('character', 'stand');
        }
        if (playerImg && playerImg.complete && playerImg.naturalWidth > 0) {
            ctx.drawImage(playerImg, screenX, screenY, tileSize, tileSize);
        } else {
            // Fallback: Draw simple block player as before.
            ctx.fillStyle = this.color;
            ctx.fillRect(screenX + 4, screenY + 8, tileSize - 8, tileSize - 12);
            ctx.fillStyle = '#fdbcb4';
            ctx.fillRect(screenX + 8, screenY + 4, tileSize - 16, tileSize - 20);
            if (this.isMoving) {
                const offset = Math.sin(this.animFrame) * 2;
                ctx.fillStyle = '#2c3e50';
                ctx.fillRect(screenX + 6, screenY + 16 + offset, 4, 8);
                ctx.fillRect(screenX + 22, screenY + 16 - offset, 4, 8);
            }
        }

        // Draw name above player
        ctx.fillStyle = 'black';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, screenX + tileSize/2, screenY - 2);
    }
    
    // Check collision with another player
    collidesWith(otherPlayer, tileSize) {
        const dx = this.x - otherPlayer.x;
        const dy = this.y - otherPlayer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < tileSize;
    }
    
    // Get player data for networking
    getNetworkData() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            direction: this.direction,
            color: this.color,
            name: this.name
        };
    }
    
    // Update from network data
    updateFromNetwork(data) {
        this.setTarget(data.x, data.y);
        if (data.direction) {
            this.direction = data.direction;
        }
        if (data.color) {
            this.color = data.color;
        }
        if (data.name) {
            this.name = data.name;
        }
    }
}