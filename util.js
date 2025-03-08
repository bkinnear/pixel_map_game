// Contains helper functions

"use strict";

// 2d vector representing position at (x, y)
class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

// returns random integer in range [0, x)
function randInt(x) {
    return Math.floor(Math.random()*x);
}

// 2d array 
class Array2D {
    constructor(width, height, initializer = ()=>undefined) {
        this.width = width;
        this.height = height;
        this.array = new Array(this.width * this.height);

        // initialize array
        for (let i = 0; i < this.array.length; i++) {
            this.array[i] = initializer();
        }
    }

    inBounds(x, y) {
        return (x >= 0 && y >= 0 && x < this.width & y < this.height);
    }
    
    get(x, y) {
        return this.array[this._posToIndex(x, y)];
    }

    // returns position from internal array index
    _indexToPos(i) {
        return new Point(i % this.width, Math.floor(i / this.width));
    }

    // returns index in internal array from position
    _posToIndex(x, y) {
        return y * this.width + x;
    }
}