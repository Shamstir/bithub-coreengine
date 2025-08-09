const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
canvas.width = 2048
canvas.height = 2048

const collision_map = []
for(let i = 0; i < collision.length; i += 64) {
    collision_map.push(collision.slice(i, 64 + i));
}

class Boundary {
    static width = 32;
    static height = 32.5;
    
    constructor({ position }) {
        this.position = position;
        this.width = 12;  
        this.height = 12; 
    }

    draw() {
        c.fillStyle = 'rgba(255, 0, 0, 0.5)';
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

class Teleport {
    static width = 32;
    static height = 32.5;
    
    constructor({ position, teleportId }) {
        this.position = position;
        this.width = 12;  
        this.height = 12;
        this.teleportId = teleportId;
    }

    draw() {
        c.fillStyle = 'rgba(0, 255, 0, 0.5)';
        c.fillRect(this.position.x, this.position.y, this.width, this.height);
    }
}

class Sprite {
    constructor({ position, velocity, image, frames = { max: 1 }, sprites = {} }) {
        this.position = position
        this.image = image
        this.frames = { ...frames, val: 0, elapsed: 0 }
        this.sprites = sprites
        this.animate = false
        this.rotation = 0
        
        if (this.image) {
            this.width = this.image.width / this.frames.max
            this.height = this.image.height
        }
    }
    
    draw() {
        c.save()
        c.translate(
            this.position.x + this.width / 2,
            this.position.y + this.height / 2
        )
        c.rotate(this.rotation)
        c.translate(
            -this.position.x - this.width / 2,
            -this.position.y - this.height / 2
        )
        
        c.drawImage(
            this.image,
            this.frames.val * this.width,
            0,
            this.image.width / this.frames.max,
            this.image.height,
            this.position.x,
            this.position.y,
            this.image.width / this.frames.max,
            this.image.height
        )
        c.restore()
        
        if (!this.animate) return
        
        if (this.frames.max > 1) {
            this.frames.elapsed++
        }
        
        if (this.frames.elapsed % 10 === 0) {
            if (this.frames.val < this.frames.max - 1) this.frames.val++
            else this.frames.val = 0
        }
    }
}

const boundaries = [];
const teleports = [];

collision_map.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if(symbol == 8193) {
            boundaries.push(
                new Boundary({
                    position: {
                        x: j * Boundary.width + 10, 
                        y: i * Boundary.height + 10  
                    }
                })
            );
        } else if(symbol == 44 || symbol == 55 || symbol == 66 || symbol == 77) {
            teleports.push(
                new Teleport({
                    position: {
                        x: j * Teleport.width + 10, 
                        y: i * Teleport.height + 10  
                    },
                    teleportId: symbol
                })
            );
        }
    });
});

let lastTeleportTime = 0;
const TELEPORT_COOLDOWN_MS = 0;
let teleportAnimating = false;
let teleportAnimation = {
    alpha: 1,
    scale: 1,
    particles: []
};

function createTeleportParticles(x, y) {
    teleportAnimation.particles = [];
    for(let i = 0; i < 20; i++) {
        teleportAnimation.particles.push({
            x: x + Math.random() * 60 - 30,
            y: y + Math.random() * 60 - 30,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            decay: Math.random() * 0.02 + 0.02
        });
    }
}

function drawTeleportAnimation() {
    if (!teleportAnimating) return;
    
    c.save();
    c.globalAlpha = teleportAnimation.alpha;
    
    teleportAnimation.particles.forEach(particle => {
        if (particle.life > 0) {
            c.fillStyle = `hsl(${Math.random() * 60 + 180}, 70%, 60%)`;
            c.beginPath();
            c.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            c.fill();
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= particle.decay;
        }
    });
    
    c.fillStyle = 'rgba(4, 4, 4, 0.8)';
    c.fillRect(0, 0, canvas.width, canvas.height);
    
    teleportAnimation.alpha -= 0.05;
    teleportAnimation.scale += 0.1;
    
    if (teleportAnimation.alpha <= 0) {
        teleportAnimating = false;
        teleportAnimation.alpha = 1;
        teleportAnimation.scale = 1;
    }
    
    c.restore();
}

function handleTeleportation() {
    if (!player || teleportAnimating) return;
    
    const currentTime = Date.now();
    if (currentTime - lastTeleportTime < TELEPORT_COOLDOWN_MS) {
        return;
    }
    
    for (let i = 0; i < teleports.length; i++) {
        const teleport = teleports[i];
        
        const collision = rectangularCollision({
            rectangle1: player,
            rectangle2: teleport
        });
        
        if (collision) {
            let destinationId;
            switch(teleport.teleportId) {
                case 44:
                    if(lastKey=='w')
                        destinationId = 55;
                    
                    break;
                case 55:
                    if(lastKey=='s')
                        destinationId = 44;
                    
                    break;
                case 66:
                    if(lastKey=='w')
                        destinationId = 77;
                    
                    break;
                case 77:
                    if(lastKey=='s')
                        destinationId = 66;
                    
                    break;
                default:
                    continue;
            }
            
            const destination = teleports.find(t => t.teleportId === destinationId);
            if (destination) {
                teleportAnimating = true;
                createTeleportParticles(player.position.x + player.width/2, player.position.y + player.height/2);
                
                setTimeout(() => {
                    const playerCenterX = player.position.x + player.width / 2;
                    const playerCenterY = player.position.y + player.height / 2;
                    
                    const destinationCenterX = destination.position.x + destination.width / 2;
                    const destinationCenterY = destination.position.y + destination.height / 2;
                    
                    const offsetX = playerCenterX - destinationCenterX;
                    const offsetY = playerCenterY - destinationCenterY;
                    
                    movables.forEach((movable) => {
                        if (movable) {
                            movable.position.x += offsetX;
                            movable.position.y += offsetY;
                        }
                    });
                    
                    createTeleportParticles(player.position.x + player.width/2, player.position.y + player.height/2);
                    lastTeleportTime = currentTime;
                }, 500);
                
                break;
            }
        }
    }
}

const image = new Image()
const playerUpImage = new Image()
const playerDownImage = new Image()
const playerLeftImage = new Image()
const playerRightImage = new Image()

playerUpImage.src = './images/Pink_Monster_Walk_6.png'
playerDownImage.src = './images/Pink_Monster_Walk_6.png'
playerLeftImage.src = './images/left.jpeg'
playerRightImage.src = './images/Pink_Monster_Walk_6.png'

let background
let player
let lastKey = ''

const keys = {
    w: { pressed: false },
    a: { pressed: false },
    s: { pressed: false },
    d: { pressed: false }
}

let movables = []

function rectangularCollision({ rectangle1, rectangle2 }) {
    return (
        rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
        rectangle1.position.x <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y <= rectangle2.position.y + rectangle2.height &&
        rectangle1.position.y + rectangle1.height >= rectangle2.position.y
    )
}

function animate() {
    window.requestAnimationFrame(animate)
    
    c.fillStyle = 'black'
    c.fillRect(0, 0, canvas.width, canvas.height)
    
    if (background) {
        background.draw()
    }
    
    teleports.forEach(teleport => {
        teleport.draw()
    })
    
    if (player) {
        player.draw()
    }
    
    handleTeleportation()
    drawTeleportAnimation()
    
    if (teleportAnimating) return;
    
    let moving = true
    if (player) {
        player.animate = false
    }
    
    if (player && keys.w.pressed && lastKey === 'w') {
        player.animate = true
        player.image = player.sprites.up
        
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x,
                            y: boundary.position.y + 3.25
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        
        if (moving) {
            movables.forEach(movable => {
                if (movable) movable.position.y += 3.25
            })
        }
    } else if (player && keys.s.pressed && lastKey === 's') {
        
        player.animate = true
        player.image = player.sprites.down
        
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x,
                            y: boundary.position.y - 3.25
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        
        if (moving) {
            movables.forEach(movable => {
                if (movable) movable.position.y -= 3.25
            })
        }
    } else if (player && keys.a.pressed && lastKey === 'a') {
        player.animate = true
        player.image = player.sprites.left
        
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x + 3.25,
                            y: boundary.position.y
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        
        if (moving) {
            movables.forEach(movable => {
                if (movable) movable.position.x += 3.25
            })
        }
    } else if (player && keys.d.pressed && lastKey === 'd') {
        player.animate = true
        player.image = player.sprites.right
        
        for (let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i]
            if (
                rectangularCollision({
                    rectangle1: player,
                    rectangle2: {
                        ...boundary,
                        position: {
                            x: boundary.position.x - 3.25,
                            y: boundary.position.y
                        }
                    }
                })
            ) {
                moving = false
                break
            }
        }
        
        if (moving) {
            movables.forEach(movable => {
                if (movable) movable.position.x -= 3.25
            })
        }
    }
}

Promise.all([
    new Promise(resolve => {
        image.onload = resolve
        image.src = './images/final_map.png'
    }),
    new Promise(resolve => {
        playerUpImage.onload = resolve
    }),
    new Promise(resolve => {
        playerDownImage.onload = resolve
    }),
    new Promise(resolve => {
        playerLeftImage.onload = resolve
    }),
    new Promise(resolve => {
        playerRightImage.onload = resolve
    })
]).then(() => {
    background = new Sprite({
        position: {
            x: 0,
            y: 0
        },
        image: image
    })
    
    player = new Sprite({
        position: {
            x: canvas.width / 2 - (playerUpImage.width / 6) / 2 - 30,
            y: canvas.height / 2 - playerUpImage.height / 2 + 200
        },
        image: playerUpImage,
        frames: {
            max: 6
        },
        sprites: {
            up: playerUpImage,
            down: playerDownImage,
            left: playerLeftImage,
            right: playerRightImage
        }
    })
    
    player.width = playerUpImage.width / 6
    player.height = playerUpImage.height
    
    movables = [background, ...boundaries, ...teleports]
    
    animate()
})

window.addEventListener('keydown', (e) => {
    if (teleportAnimating) return;
    
    switch(e.key) {
        case 'w':
            keys.w.pressed = true
            lastKey = 'w'
            break
        case 'a':
            keys.a.pressed = true
            lastKey = 'a'
            break
        case 's':
            keys.s.pressed = true
            lastKey = 's'
            break
        case 'd':
            keys.d.pressed = true
            lastKey = 'd'
            break
    }
})

window.addEventListener('keyup', (e) => {
    switch(e.key) {
        case 'w':
            keys.w.pressed = false
            break
        case 'a':
            keys.a.pressed = false
            break
        case 's':
            keys.s.pressed = false
            break
        case 'd':
            keys.d.pressed = false
            break
    }
})