let game = new GameState();

// load game data
game.load();

// main loop
function update() {
    // update camera
    game.camera.update();

    // clear screen
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // draw gamestate
    game.draw();
    
    /*================================*/
    /*=========== draw gui ===========*/
    /*================================*/

    // save context before transforming
    ctx.save();

    // transform context to draw outside camera view
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    //===== draw selected item =====
    game.drawGUI();

    // done drawing GUI, restore context
    ctx.restore();
}

// start the main loop after letting it load for .25 secs
// TODO implement proper loading
setTimeout(() => {
    setInterval(update, 17); // 33ms => 30.3fps, 17ms => 58.8fps (ends up running around 59-60FPS)
}, 250);