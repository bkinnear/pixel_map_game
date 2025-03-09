// contains the engine game logic and data

"use strict";

// get global canvas and context
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext('2d');

// turn off image smothing for clear scaling
ctx.imageSmoothingEnabled = false;

// tile size should be consistent across all tile-wide sprites
const TILE_SIZE = 16;

// chunk size in tiles
const CHUNK_SIZE = Math.floor(canvas.width / TILE_SIZE) + 1;// Math.floor(canvas.height/TILE_SIZE/2) + 1;
// chunk size in pixels
const CHUNK_PIXEL_SIZE = CHUNK_SIZE * TILE_SIZE;

// disable right click
document.body.oncontextmenu = function(e) {
    e.preventDefault();
    e.stopPropagation();
}

// camera object
class Camera {
    constructor(x, y, scale) {
        this.x = x;
        this.y = y;
        this.scale = scale;
        ctx.scale(scale, scale);

        this.speed = 5; // px/frame

        this.is_panning = false;
        this.prev_mouse_x = 0;
        this.prev_mouse_y = 0;

        this.moving_right = false;
        this.moving_up = false;
        this.moving_left = false;
        this.moving_down = false;
    }

    // update the camera position based on speed
    update() {
        if (this.moving_right)
            this.x += this.speed;
        if (this.moving_up)
            this.y -= this.speed;
        if (this.moving_left)
            this.x -= this.speed;
        if (this.moving_down)
            this.y += this.speed;
    }

    // zooms in view by factor
    zoom(factor) {
        let oldScale = this.scale;
        
        // set camera scale
        game.camera.scale *= factor;
        ctx.scale(factor, factor);

        // move camera to recenter
        if (factor > 1) {
            this.x += 1 / this.scale * canvas.width / 2;
            this.y += 1 / this.scale * canvas.height / 2;
        } else {
            this.x -= 1 / oldScale * canvas.width / 2;
            this.y -= 1 / oldScale * canvas.height / 2;
        }
    }

    // returns tile size at given camera scale
    getScaledTileSize() {
        return TILE_SIZE * this.scale;
    }
}

// draws rectangle at position (x, y) with dimensions (w, h)
function drawRect(x, y, w, h, c, outline=false) {

    if (!outline) {
        ctx.fillStyle = c;
        ctx.fillRect(x-game.camera.x, y-game.camera.y, w, h);
        return;
    }
    
    // draw border
    ctx.strokeStyle = c;
    ctx.strokeRect(x-game.camera.x, y-game.camera.y, w, h);
}

// holds all chunks (canvases with sprites predrawn to them)
class ChunkHandler {
    constructor(world) {       
        // chunk map dimensions
        this.width = Math.ceil(world.width / CHUNK_SIZE);
        this.height = Math.ceil(world.height / CHUNK_SIZE);
        this.size = this.width * this.height;

        // initialize chunk data
        // chunk entries are in format Array2D[x,y] = canvas
        this.chunks = new Array2D(
            this.width,
            this.height,
            () => {
                let newCanvas = document.createElement('canvas');
                newCanvas.width = CHUNK_SIZE * TILE_SIZE;
                newCanvas.height = CHUNK_SIZE * TILE_SIZE;
                return newCanvas;
        });

        // sprite lists by chunk position
        // individual sprite entries are in format [x, y, sprite, color] where x, y are relative to chunk origin
        this.chunkSprites = new Array2D(
            this.width,
            this.height,
            () => {
                return new Array();
            }
        );
    }

    // prerenders all chunks
    prerenderAll(game, x, y) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this._prerenderChunk(game, x, y);
            }
        }
    }

    // prerenders terrain and sprites on a given chunk
    _prerenderChunk(game, x, y) {
        // render terrain in chunk
        this._prerenderTerrain(game, x, y);

        // render sprites in chunk
        for (let entry of this.chunkSprites.get(x, y)) {
            this._prerenderSprite(game, x, y, entry[0], entry[1], entry[2], entry[3]);
        }

        this.chunks[0]
    }

    // adds sprite at tile pos (x, y) to be drawn to chunks
    addSprite(game, x, y, sprite, color) {
        let chunkX = Math.floor(x / CHUNK_SIZE);
        let chunkY = Math.floor(y / CHUNK_SIZE);
        console.log(`Adding sprite to (${x}, ${y}) at chunk(${chunkX}, ${chunkY})`);
        this.chunkSprites.get(chunkX, chunkY).push([x % CHUNK_SIZE, y % CHUNK_SIZE, sprite, color]);
    }

    // draws chunks visible in rect formed from pixels (x, y, w, h)
    drawRange(game, x, y, w, h) {
        // get starting & ending tile pos
        let tileStartPos = game.pixelToWorld(x, y);
        let widthTiles = Math.floor(w / TILE_SIZE) * (1 / game.camera.scale);
        let heightTiles = Math.floor(h / TILE_SIZE) * (1 / game.camera.scale);

        for (let i = tileStartPos.x; i <= tileStartPos.x + widthTiles + CHUNK_SIZE; i += CHUNK_SIZE) {
            for (let j = tileStartPos.y; j <= tileStartPos.y + heightTiles + CHUNK_SIZE; j += CHUNK_SIZE) {
                // get chunk position
                let chunkX = Math.floor(i / CHUNK_SIZE);
                let chunkY = Math.floor(j / CHUNK_SIZE);

                // check for chunk out of bounds
                if (!this.chunks.inBounds(chunkX, chunkY))
                    continue;
                
                let chunkCanvas = this.chunks.get(chunkX, chunkY);
                
                ctx.drawImage(
                    chunkCanvas,
                    chunkX * CHUNK_PIXEL_SIZE - game.camera.x,
                    chunkY * CHUNK_PIXEL_SIZE - game.camera.y
                    );
            }
        }
    }

    // prerenders terrain for chunk
    _prerenderTerrain(game, x, y) {      
        // get chunk canvas context
        let offsetX = x * CHUNK_SIZE;
        let offsetY = y * CHUNK_SIZE;
        let newContext = this.chunks.get(x, y).getContext('2d');

        // loop through all tiles in chunk
        for (let x = 0; x < CHUNK_SIZE; x++) {
            for (let y = 0; y < CHUNK_SIZE; y++) {
                // every tile in chunk

                let tile = game.world.getTile(offsetX + x, offsetY + y);
                if (tile) {
                    let index = tile.terrain.sprite_index;

                    // draw tile to chunk
                    newContext.drawImage(
                        game.terrainSpriteSheet, 
                        TILE_SIZE*index[0], 
                        TILE_SIZE*index[1], 
                        TILE_SIZE, 
                        TILE_SIZE, 
                        x*TILE_SIZE, 
                        y*TILE_SIZE, 
                        TILE_SIZE, 
                        TILE_SIZE
                    );
                }
            }
        }
    }

    // draws sprite to appropriate chunk canvas at local tile (x, y) (relative to chunk origin)
    _prerenderSprite(game, chunkX, chunkY, x, y, sprite, color=null) {
        // check for chunk out of range
        if (!this.chunks.inBounds(chunkX, chunkY))
            throw Error(`Trying to add sprite ${sprite} at chunk position (${chunkX} ${chunkY}), which is OOB`);
    
        // get chunk canvas context
        let chunkCtx = this.chunks.get(chunkX, chunkY).getContext('2d');

        // get sprite index
        const index = sprite.sprite_index;

        if (!color) {
            // draw sprite to chunk context
            chunkCtx.drawImage(
                game.spriteSheet, 
                TILE_SIZE*index[0], 
                TILE_SIZE*index[1], 
                TILE_SIZE, 
                TILE_SIZE, 
                x*TILE_SIZE, 
                y*TILE_SIZE, 
                TILE_SIZE, 
                TILE_SIZE
            );
        } else {
            // create new canvas for recoloring sprite
            let newCanvas = document.createElement('canvas');
            newCanvas.width = TILE_SIZE;
            newCanvas.height = TILE_SIZE;
            let newCtx = newCanvas.getContext('2d');

            // draw sprite to new context
            newCtx.drawImage(
                game.spriteSheet, 
                TILE_SIZE*index[0], 
                TILE_SIZE*index[1], 
                TILE_SIZE, 
                TILE_SIZE, 
                0, 
                0, 
                TILE_SIZE, 
                TILE_SIZE
            );

            // draw color over white in sprite
            let rgb = color.replace(/[^\d,]/g, '').split(',');
            let imageData = newCtx.getImageData(0, 0, newCanvas.width, newCanvas.height);
            for (var i = 0; i < imageData.data.length; i += 4) {
                if (imageData.data[i] == 255 &&
                    imageData.data[i+1] == 255 &&
                    imageData.data[i+2] == 255
                ) {
                    imageData.data[i] = rgb[0];
                    imageData.data[i+1] = rgb[1];
                    imageData.data[i+2] = rgb[2];
                 }
            }
            newCtx.putImageData(imageData,0,0);

            // draw recolored sprite to chunk context
            chunkCtx.drawImage(
                newCanvas,
                x*TILE_SIZE, 
                y*TILE_SIZE
            );
        }
    }
}

// game state with all engine logic and data
class GameState {
    constructor() {
        this.world = new World(this, core.world_gen.width, core.world_gen.height);
        this.camera = new Camera(0, 0, 1.0);
        this.selectedSquare = null;
        
        // debug mode determines if debug stats are displayed
        this.debug = false;
        
        // speed at which game was before pausing (setting to game_speed 0)
        this.unpause_game_speed = 1;
        this.game_speed = 0;
        this.setGameSpeed(this.game_speed);

        // loading screen image
        this.loadingScreenImage = new Image();

        // terrain sprite sheet
        this.terrainSpriteSheet = new Image();

        // prerendered sprite chunks - stored as canvases
        this.chunks = new ChunkHandler(this.world);

        // main sprite sheet
        this.spriteSheet = new Image();

        // queue of callbacks to load resources
        this.resourceQueue = new Array(0);
        this.numResourcesLoaded = 0;
    }

    // queues resource for loading and sets onload callback
    _queueResource(res, callback) {
        this.resourceQueue.push(callback);
        res.onload = () => {
            this.numResourcesLoaded++;
        }
    }

    // loads all queued resources, then calls callback
    _loadResources(callback) {
        const numResources = this.resourceQueue.length;
        this.numResourcesLoaded = 0;

        while (this.resourceQueue.length > 0) {
            this.resourceQueue.pop()();
        }

        let checkLoading = setInterval(() => {
            if (this.numResourcesLoaded === numResources) {
                clearInterval(checkLoading);
                callback();
            }
        }, 100);
    }

    // changes loading text to specified message, renders screen, then calls callback
    updateLoadingText(message, callback) {
        drawRect(32, canvas.height-64, canvas.width-32, 64, 'black', false);
        ctx.font = `40px Verdana`;
        ctx.fillStyle = 'white';
        ctx.fillText(message, 32, canvas.height-32);
        requestAnimationFrame(callback);
    }

    // loads resources and inital game state then calls callback
    load(callback) {
        // first load loading screen
        this._queueResource( this.loadingScreenImage, ()=>{
            this.loadingScreenImage.src = 'sprites/loading_screen.png';
        });

        this._loadResources( () => {
            // draw loading screen
            ctx.drawImage(this.loadingScreenImage, 0, 0);
            this.updateLoadingText('Loading resources', ()=>{});

            this._queueResource( this.terrainSpriteSheet, ()=>{
                this.terrainSpriteSheet.src = 'sprites/terrain_sheet_16x16.png';
            });

            this._queueResource( this.spriteSheet, ()=>{
                this.spriteSheet.src = 'sprites/sprite_sheet_16x16.png';
            });

            this._loadResources( () => {
                this.updateLoadingText('Generating world', ()=>{
                    setTimeout(() => {
                        // generate world terrain
                        this.world.generateTerrain();
    
                        // prerender all terrain for quick drawing
                        this.chunks.prerenderAll(this);
    
                        // add event listeners for player input
                        this.addEventListeners();
    
                        // done loading, call callback
                        callback();
                    }, 1);
                });
            });
        });
    }

    // draws game
    draw() {
        // draw visible chunks to screen from rect starting at top left of screen
        this.chunks.drawRange(this, 0, 0, canvas.width, canvas.height);

        // draw selectedSquare
        if (this.selectedSquare != null) {
            drawRect(this.selectedSquare.x*TILE_SIZE, this.selectedSquare.y*TILE_SIZE, TILE_SIZE, TILE_SIZE, "rgba(255,255,255)", true);
        }
    }

    // draws GUI
    drawGUI() {
        //===== draw debug text =====
        if (this.debug) {
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, 300, 200);

            ctx.font = '24px arial';
            ctx.fillStyle = 'lime';

            // draw zoom level
            ctx.fillText('Zoom: ' + this.camera.scale, 4, 24);
            // draw game speed
            ctx.fillText('Speed: ' + this.game_speed, 4, 48);
            // draw turn
            ctx.fillText('Turn: ' + this.world.turn, 4, 72);
        }

        // draw bottom right GUI box
        ctx.fillStyle = 'rgba(190, 190, 190, 1)';
        ctx.fillRect(0, canvas.height-128, 320, 128);
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.strokeRect(0, canvas.height-128, 320, 128);

        // draw tile details
        ctx.font = 'bold 12pt arial';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        if (this.selectedSquare != null) {
            let selectedTile = this.world.getTile(this.selectedSquare.x, this.selectedSquare.y);
            if (selectedTile != null) {
                ctx.fillText(`(${this.selectedSquare.x}, ${this.selectedSquare.y})`, 4, canvas.height - 114);
                ctx.fillText('Terrain: ' + selectedTile.terrain.name, 4, canvas.height - 114 + 14);
                ctx.fillText('Fertility: ' + selectedTile.terrain.fertility, 4, canvas.height - 114 + 28);
            }
        }
    }

    // updates prerendered chunks by adding specified sprite to tile position
    addSprite(x, y, sprite, color=null) {
        this.chunks.addSprite(this, x, y, sprite, color);
    }

    // returns whether gamestate is paused
    isPaused() {
        return (this.game_speed == 0);
    }

    // sets gamestate pause
    setPaused(paused) {
        if (paused)
            this.setGameSpeed(0);
        else
            this.setGameSpeed(this.unpause_game_speed);
    }

    // increases game speed by one
    increaseGameSpeed() {
        this.setGameSpeed(this.game_speed + 1);
    }

    // decreases game speed by one
    decreaseGameSpeed() {
        this.setGameSpeed(this.game_speed - 1);
    }

    // sets game speed to specified speed within limits (0-4)
    setGameSpeed(speed) {
        // limit input from [0-4]
        speed = Math.min(4, Math.max(speed, 0));

        // return if game speed is already same as input
        if (speed == this.game_speed)
            return;

        // clear the current sub routine
        clearInterval(this.turn_interval);

        // if pausing, remember previous speed and return
        if (speed == 0) {
            this.unpause_game_speed = this.game_speed;
            this.game_speed = 0;
            return;
        }

        // set new speed
        this.game_speed = speed;

        // set new subroutine based on set game speed
        switch(this.game_speed) {
        case 1:
            // 500ms / 2 turns a second
            this.turn_interval = setInterval(this.world.takeTurn.bind(this.world), 500);
            break;
        case 2:
            // 250ms / 4 turns a second
            this.turn_interval = setInterval(this.world.takeTurn.bind(this.world), 250); 
            break;
        case 3:
            // 125ms / 8 turns a second
            this.turn_interval = setInterval(this.world.takeTurn.bind(this.world), 125); 
            break;
        case 4:
            // 50ms / 20 turns a second
            this.turn_interval = setInterval(this.world.takeTurn.bind(this.world), 50); 
            break;
        }
    }

    // returns Point in world at point (x, y) in camera
    pixelToWorld(x, y) {
        let x2 = Math.floor((x + (game.camera.x*game.camera.scale)) / game.camera.getScaledTileSize());
        let y2 = Math.floor((y + (game.camera.y*game.camera.scale)) / game.camera.getScaledTileSize());
    
        return new Point(x2, y2);
    }

    // returns Point in camera at point (x, y) in world
    worldToPixel(x, y) {
        let x2 = x * game.camera.getScaledTileSize() - (game.camera.x*game.camera.scale)
        let y2 = y * game.camera.getScaledTileSize() - (game.camera.y*game.camera.scale)
    
        return new Point(x2, y2);
    }

    addEventListeners() {
        // contains player input 

        // key pressed
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.camera.moving_left = true;
                    break; 
                case "ArrowUp":
                case 'w':
                case 'W':
                    this.camera.moving_up = true;
                    break; 
                case "ArrowRight":
                case 'd':
                case 'D':
                    this.camera.moving_right = true;
                    break; 
                case "ArrowDown":
                case 's':
                case 'S':
                    this.camera.moving_down = true;
                    break;
                case ' ':
                    this.setPaused(!this.isPaused());
                    break;
                case '+':
                    this.increaseGameSpeed();
                    break;
                case '-':
                    this.decreaseGameSpeed();
                    break;
                case '3':
                    game.debug = !this.debug;
                    break;
            }
        }, false);

        // key released
        window.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.camera.moving_left = false;
                    break; 
                case 'ArrowUp':
                case 'w':
                case 'W':
                    this.camera.moving_up = false;
                    break; 
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.camera.moving_right = false;
                    break; 
                case 'ArrowDown':
                case 's':
                case 'S':
                    this.camera.moving_down = false;
                    break; 
            }
        }, false);

        // mouse pressed
        canvas.addEventListener('mousedown', (e) => {
            switch (e.button) {
            case 0:
                break;
            case 1:
                // Middle button clicked
                break;
            case 2:
                // Right button clicked
                this.camera.is_panning = true;
                this.camera.prev_mouse_x = e.offsetX;
                this.camera.prev_mouse_y = e.offsetY;
                break;
            }
        });

        // mouse released
        canvas.addEventListener('mouseup', (e) => {
            switch (e.button) {
            case 0:
                // Left button released

                // select square where user clicked or set to null if on previously selected tile
                let point = this.pixelToWorld(e.offsetX, e.offsetY);
                if (this.selectedSquare != null && this.selectedSquare.x == point.x && this.selectedSquare.y == point.y)
                    this.selectedSquare = null;
                else
                    this.selectedSquare = point;
                break;
            case 1:
                // Middle button released
                break;
            case 2:
                // Right button released
                this.camera.is_panning = false;
                break;
            }
        });

        // mouse movement
        canvas.addEventListener('mousemove', (e) => {
            // pan view
            if (this.camera.is_panning) {
                let mouse_x = e.offsetX;
                let mouse_y = e.offsetY;

                this.camera.x += 1/this.camera.scale*(this.camera.prev_mouse_x - mouse_x);
                this.camera.y += 1/this.camera.scale*(this.camera.prev_mouse_y - mouse_y);

                this.camera.prev_mouse_x = e.offsetX;
                this.camera.prev_mouse_y = e.offsetY;
            }
        });

        // mouse wheel
        canvas.addEventListener('wheel', (e) => {
            // zoom view
            if (e.wheelDelta < 0) {
                this.camera.zoom(.5);
            } else if (e.wheelDelta > 0) {
                this.camera.zoom(2);
            }
        });
    }
}