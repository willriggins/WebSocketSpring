/* global Phaser RemotePlayer io */

var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {
    preload: preload,
    create: create,
    update: update,
    render: render
})

function preload() {
    game.load.image('earth', 'assets/light_sand.png')
    game.load.spritesheet('dude', 'assets/dude.png', 64, 64)
    game.load.spritesheet('enemy', 'assets/dude.png', 64, 64)
}

var socket // Socket connection

var land

var player
var playerId

var enemies

var currentSpeed = 0
var cursors

var isConnected = false

function create() {
    /* initialize socket */
var ws = new SockJS("/socket");
socket = Stomp.over(ws);

    // Resize our game world to be a 2000 x 2000 square
    game.world.setBounds(-500, -500, 1000, 1000)

    // Our tiled scrolling background
    land = game.add.tileSprite(0, 0, 800, 600, 'earth')
    land.fixedToCamera = true

    // The base of our player
    var startX = Math.round(Math.random() * (1000) - 500)
    var startY = Math.round(Math.random() * (1000) - 500)
    player = game.add.sprite(startX, startY, 'dude')
    player.anchor.setTo(0.5, 0.5)
    player.animations.add('move', [0, 1, 2, 3, 4, 5, 6, 7], 20, true)
    player.animations.add('stop', [3], 20, true)

    // This will force it to decelerate and limit its speed
    // player.body.drag.setTo(200, 200)
    player.body.maxVelocity.setTo(400, 400)
    player.body.collideWorldBounds = true

    // Create some baddies to waste :)
    enemies = []

    player.bringToTop()

    game.camera.follow(player)
    game.camera.deadzone = new Phaser.Rectangle(150, 150, 500, 300)
    game.camera.focusOnXY(0, 0)

    cursors = game.input.keyboard.createCursorKeys()

    /* connect socket */
    socket.connect({}, onSocketConnected);
}

// Socket connected
function onSocketConnected() {
    var url = socket.ws._transport.url.split("/")
    playerId = url[url.length - 2]

    console.log('Connected to socket server')
    isConnected = true

    // Reset enemies on reconnect
    enemies.forEach(function(enemy) {
        enemy.player.kill()
    })
    enemies = []

    console.log(socket)

    /* subscribe to /move */
    socket.subscribe("/move", onMovePlayer)

    /* subscribe to /remove-player */
    socket.subscribe("/remove-player", onRemovePlayer)
}

// Move player
function onMovePlayer(message) {
    data = JSON.parse(message.body)
    if (playerId === undefined || data.id === undefined || data.id === playerId) {
        return
    }

    var movePlayer = playerById(data.id)

    // Player not found
    if (!movePlayer) {
        enemies.push(new RemotePlayer(data.id, game, player, data.x, data.y))
        return
    }

    // Update player position
    movePlayer.player.x = data.x
    movePlayer.player.y = data.y
}

// Remove player
function onRemovePlayer(message) {
    data = JSON.parse(message.body)
    if (playerId === undefined || data.id === undefined || data.id === playerId) {
        return
    }

    var removePlayer = playerById(data.id)

    // Player not found
    if (!removePlayer) {
        console.log('Player not found: ', data.id)
        return
    }

    removePlayer.player.kill()

    // Remove player from array
    enemies.splice(enemies.indexOf(removePlayer), 1)
}

function update() {
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].alive) {
            enemies[i].update()
            game.physics.collide(player, enemies[i].player)
        }
    }

    if (cursors.left.isDown) {
        player.angle -= 4
    } else if (cursors.right.isDown) {
        player.angle += 4
    }

    if (cursors.up.isDown) {
        // The speed we'll travel at
        currentSpeed = 300
    } else {
        if (currentSpeed > 0) {
            currentSpeed -= 4
        }
    }

    game.physics.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity)

    if (currentSpeed > 0) {
        player.animations.play('move')
    } else {
        player.animations.play('stop')
    }

    land.tilePosition.x = -game.camera.x
    land.tilePosition.y = -game.camera.y

    if (game.input.activePointer.isDown) {
        if (game.physics.distanceToPointer(player) >= 10) {
            currentSpeed = 300

            player.rotation = game.physics.angleToPointer(player)
        }
    }

    if (isConnected) {
        /* send to /move */
        socket.send("/move", {}, JSON.stringify({id: playerId, x: player.x, y: player.y}))
    }
}

function render() {

}

// Find player by ID
function playerById(id) {
    for (var i = 0; i < enemies.length; i++) {
        if (enemies[i].player.name === id) {
            return enemies[i]
        }
    }

    return false
}
