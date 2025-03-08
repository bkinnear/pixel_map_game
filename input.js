// contains player input 

// key pressed
window.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            game.camera.moving_left = true;
            break; 
        case "ArrowUp":
        case 'w':
        case 'W':
            game.camera.moving_up = true;
            break; 
        case "ArrowRight":
        case 'd':
        case 'D':
            game.camera.moving_right = true;
            break; 
        case "ArrowDown":
        case 's':
        case 'S':
            game.camera.moving_down = true;
            break;
        case ' ':
            game.setPaused(!game.isPaused());
            break;
        case '+':
            game.increaseGameSpeed();
            break;
        case '-':
            game.decreaseGameSpeed();
            break;
        case '3':
            game.debug = !game.debug;
            break;
    }
}, false);

// key released
window.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            game.camera.moving_left = false;
            break; 
        case 'ArrowUp':
        case 'w':
        case 'W':
            game.camera.moving_up = false;
            break; 
        case 'ArrowRight':
        case 'd':
        case 'D':
            game.camera.moving_right = false;
            break; 
        case 'ArrowDown':
        case 's':
        case 'S':
            game.camera.moving_down = false;
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
        game.camera.is_panning = true;
        game.camera.prev_mouse_x = e.offsetX;
        game.camera.prev_mouse_y = e.offsetY;
        break;
    }
});

// mouse released
canvas.addEventListener('mouseup', (e) => {
    switch (e.button) {
    case 0:
        // Left button released

        // select square where user clicked or set to null if on previously selected tile
        let point = pixelToWorld(e.offsetX, e.offsetY);
        if (game.selectedSquare != null && game.selectedSquare.x == point.x && game.selectedSquare.y == point.y)
            game.selectedSquare = null;
        else
            game.selectedSquare = point;
        break;
    case 1:
        // Middle button released
        break;
    case 2:
        // Right button released
        game.camera.is_panning = false;
        break;
    }
});

// mouse movement
canvas.addEventListener('mousemove', (e) => {
    // pan view
    if (game.camera.is_panning) {
        let mouse_x = e.offsetX;
        let mouse_y = e.offsetY;

        game.camera.x += 1/game.camera.scale*(game.camera.prev_mouse_x - mouse_x);
        game.camera.y += 1/game.camera.scale*(game.camera.prev_mouse_y - mouse_y);

        game.camera.prev_mouse_x = e.offsetX;
        game.camera.prev_mouse_y = e.offsetY;
    }
});

// mouse wheel
canvas.addEventListener('wheel', (e) => {
    // zoom view
    if (e.wheelDelta < 0) {
        game.camera.zoom(.5);
    } else if (e.wheelDelta > 0) {
        game.camera.zoom(2);
    }
});