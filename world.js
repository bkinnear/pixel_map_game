// Contains in-world game logic and data

"use strict";

// individual tile of terrain type
class Tile {
    constructor(terrain) {
        this.terrain = terrain;
    }
}

// City object
// exists on a tile and holds a population
// grows every year
// produces taxes for its state every month
class City {
    constructor(x, y, state) {
        this.x = x;
        this.y = y;
        this.state = state;
    }
}

// A collection of cities and units under the same banner
class State {
    constructor(name, civilization) {
        // name of the country
        this.name = name;

        // color of state
        this.color = `rgba(${randInt(256)},${randInt(256)},${randInt(256)})`;

        // civilization of the state
        this.civilization = civilization;

        // list of city references
        this.cities = new Array();

        // gold in state coffers
        this.gold = 0;
    }
}

// World object holds all world data and game logic
class World {
    constructor(game, width, height) {
        // rerefence to gamestate
        this.game = game;

        // map dimensions in tiles
        this.width = width;
        this.height = height;

        // holds all of the base terrain tiles
        this.tiles = Array(this.width * this.height).fill();

        // represents days passed in-world
        this.turn = 0;

        // number of states to spawn
        this.numStates = 6;

        // holds all states
        this.states = new Array();

        // hashmap that holds all cities
        // uses pointToIndex(x, y) as key
        this.cityMap = new Map();

        // persistent 2D array to keep track of which tiles are already "occupied" by a state spawn
        this.occupiedSpawn = null;
    }
    
    // transposes 2D point (x, y) to 1D index using x, y
    pointToIndex(x, y) {
        return x + y*this.width;
    }

    // transposes 1D index to 2D point
    indexToPoint(i) {
        return new Point(i%this.width, Math.floor(i/this.width));
    }

    // returns terrain at point (x, y)
    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height)
            return null;
        return this.tiles[this.pointToIndex(x, y)];
    }

    // procedurally generates world using Perlin noise
    generateTerrain() {
        let freq = Math.pow(2, core.world_gen.scale);
        let elevationGrid = Array(this.width*this.height).fill(0); // elevation values
        let precipitationGrid = Array(this.width*this.height).fill(0); // precipitation values

        // seed perlin noise
        let seed = Math.random();

        // generate elevation values
        noise.seed(seed);
        elevationGrid = elevationGrid.map((v, i) => {
            let p = this.indexToPoint(i);
            let value = 0;
            value += 1 * Math.abs(noise.perlin2(p.x / freq, p.y / freq)) * (core.world_gen.max_elevation + .49);
            value += .5 * Math.abs(noise.perlin2(p.x / freq*2, p.y / freq*2)) * (core.world_gen.max_elevation + .49);
            value += .25 * Math.abs(noise.perlin2(p.x / freq*4, p.y / freq*4)) * (core.world_gen.max_elevation + .49);
            value += .125 * Math.abs(noise.perlin2(p.x / freq*8, p.y / freq*8)) * (core.world_gen.max_elevation + .49);
            value /= (1 + .5 + .25 + .125);
            return Math.round(value);
        })
        
        // generate precipitation values
        noise.seed(seed+.5 % 1);
        precipitationGrid = precipitationGrid.map((v, i) => {
            let p = this.indexToPoint(i);
            let value = 0;
            value += 1 * Math.abs(noise.perlin2(p.x / freq, p.y / freq)) * core.world_gen.max_precipitation;
            value += .5 * Math.abs(noise.perlin2(p.x / freq*2, p.y / freq*2)) * core.world_gen.max_precipitation;
            value += .25 * Math.abs(noise.perlin2(p.x / freq*4, p.y / freq*4)) * core.world_gen.max_precipitation;
            value += .125 * Math.abs(noise.perlin2(p.x / freq*8, p.y / freq*8)) * core.world_gen.max_precipitation;
            value /= (1 + .5 + .25 + .125);
            return Math.round(value);
        })
        
        // run through every point in world and assign terrain based on generated grid values
        this.tiles = this.tiles.map((v, i) => {
            let p = precipitationGrid[i];
            let e = elevationGrid[i]; 

            let tile = new Tile(core.terrain[core.world_gen.terrain_grid[e][p]]);
                        
            return tile;
        });

        // generate states
        this._generateStates();
    }

    // returns valid spawn location for a new state
    // returns null if no valid location found within timeout
    _findSpawn() {
        let x = 0;
        let y = 0;

        // initiliaze occupied spawn array if null
        if (this.occupiedSpawn === null) {
            this.occupiedSpawn = new Array();
            for (let i = 0; i < this.width; i++) {
                this.occupiedSpawn[i] = new Array();
                for (let j = 0; j < this.height; j++) {
                    this.occupiedSpawn[i][j] = false;
                }
            }
        }

        // looks for locations until spot is determined viable
        let timeoutTicks = 99999;
        for (;;) {
            x = randInt(this.width);
            y = randInt(this.height);

            let tile = this.getTile(x, y);
            if (!this.occupiedSpawn[x][y] && tile.terrain.is_land && tile.terrain != core.terrain.mountains) {
                this._floodFillSpawn(x, y);
                break;
            }
            
            // timeout search if it lasts too long
            if (timeoutTicks-- === 0)
                return null;
        }

        return new Point(x, y);
    }

    // marks nearby area as already having a state spawn
    _floodFillSpawn(x, y) {
        // flood fill to specified spawn distance
        // create frontier as priority queue with priority as 3rd element of array
        let frontier = new PriorityQueue((a, b) => a[2] > b[2]);

        // push (x, y) as first point
        frontier.push([x, y, core.world_gen.min_spawn_distance + 1]);

        // add adjacent tiles while frontier exists
        let i = 0;
        while (frontier.size() > 0) {
            // get top tile data from frontier
            let top = frontier.pop();

            // unpack data from top of frontier
            let x = top[0];
            let y = top[1];
            let distance = top[2] - 1;

            // ignore tile if:
            // * tile is out of bounds
            // * tile is already marked occupied
            // * distance reached 
            // * terrain is not land
            let tile = this.getTile(x, y);
            if (!tile || this.occupiedSpawn[x][y] || distance == 0 || !tile.terrain.is_land)
                continue;

            // set tile as occupied
            this.occupiedSpawn[x][y] = true;
            i++;

            // add all 8 adjacent tile data to frontier
            frontier.push([x-1, y-1, distance]);
            frontier.push([x-1, y, distance]);
            frontier.push([x-1, y+1, distance]);
            frontier.push([x, y-1, distance]);
            frontier.push([x, y+1, distance]);
            frontier.push([x+1, y-1, distance]);
            frontier.push([x+1, y, distance]);
            frontier.push([x+1, y+1, distance]);
        }
        console.log(`flood filled ${i} tiles`);
    }

    // generates and spawns states
    _generateStates() {
        for (let i = 0; i < this.numStates; i++) {
            // choose random civ
            let civilization = core.civilizations[randInt(core.civilizations.length)];
            
            // create new state
            let state = new State(`AI${i}`, civilization);

            // add state to list
            this.states.push(state);

            // find spawn location for capital city
            let p = this._findSpawn();

            // regenerate map if no viable spawn found
            if (!p) {
                this.generateTerrain();
                return;
            }

            // create capital at spawn
            this.createCity(p.x, p.y, state);
        }
    }
    
    /*
    takes 1 turn in the world
    represents 1 day in the world
    simulates all game logic for 1 day
    */
    takeTurn() {
        this.turn++;

        // yearly updates
        if (this.turn%365 == 0) {
            this.updateYear();
        }
    }

    // updates world - called once every 30 turns
    updateMonth() {
        // all cities pay taxes
        for (const city of this.cities) {
            let state = this.states[city.stateId];

            state.gold += city.collectTaxes();
        }
    }

    // updates world - called once every 364 turns
    updateYear() {
        // grow all cities
        for (let city of this.cities) {
            city.growPop();
        }
    }

    // creates city and adds to state
    createCity(x, y, state) {
        // create new city
        let city = new City(x, y, state);

        // add city to hash map
        this.cityMap.set(this.pointToIndex(x, y), city);

        // add sprite to gamestate
        this.game.addSprite(x, y, core.sprites.city, state.color);

        return city;
    }
}