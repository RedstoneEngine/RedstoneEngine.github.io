
var asteroids = [];

class projectile {
    div = null
    pos = [0, 0, 0]
    pos_offset = [0, 0]
    vel = [0, 0, 0]
    size = 10
}

document.addEventListener("DOMContentLoaded", () => {

    var asteroidCollection = document.getElementById("asteroidCollection");

    // Amount scales to screen size
    var amount = (window.innerWidth * window.innerHeight) / 100000;

    // Determine Sizes and z-order based on sizes
    var ast_size = []
    for (var i = 0; i < amount; i++)
        ast_size[i] = 20 + Math.random() * 40;
    ast_size.sort();

    // Spawn Asteroid Particles
    for (var i = 0; i < amount; i++) {
        var asteroid = new projectile()
        asteroid.div = document.createElement("div");
        asteroid.div.classList.add("particle");
        asteroid.div.classList.add("asteroid" + (Math.floor(Math.random() * 4)));

        // Color
        asteroid.div.style.filter = "brightness(25%) sepia(75%) saturate(125%) hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";

        // Position
        asteroid.pos = [Math.random() * window.innerWidth, Math.random() * window.innerHeight, 0];
        asteroid.div.style.transform = "translate(" + asteroid.pos[0] + "px, " + asteroid.pos[1] + "px) rotate(0deg)";

        // Size
        asteroid.size = ast_size[i];
        asteroid.div.style.width = ast_size[i] + "px";
        asteroid.div.style.height = ast_size[i] + "px";

        // Velocity
        asteroid.vel = [(Math.random() * 2 - 1) * .003, (Math.random() * 2 - 1) * .003, (Math.random() * 2 - 1) * .5];

        asteroids[i] = asteroid;
        asteroidCollection.appendChild(asteroid.div, i);
    }

    setTimeout(() => runParticles(), 1);
    setInterval(() => runParticles(), 1000);

    var starCollection = document.getElementById("starCollection");

    // Determine Sizes and z-order based on sizes
    var star_size = []
    for (var i = 0; i < amount * 1.5; i++)
        star_size[i] = 3 + Math.random() * 12;
    star_size.sort();

    // Spawn Star Particles
    for (var i = 0; i < amount * 1.5; i++) {
        var star = document.createElement("div");
        star.classList.add("particle");
        star.classList.add("star" + (Math.floor(Math.random() * 3)));

        // Color
        star.style.filter = "brightness(75%) sepia(75%) saturate(200%) hue-rotate(" + Math.floor(Math.random() * 360) + "deg)";

        // Position
        star.style.left = (Math.random() * window.innerWidth) + "px";
        star.style.top = (Math.random() * window.innerHeight) + "px";

        // Size
        star.style.width = star_size[i] + "px";
        star.style.height = star_size[i] + "px";

        // Animations
        star.style.animation = "starBlink " + (10 + Math.random() * 20) + "s infinite"

        starCollection.appendChild(star);
    }
});


// They have velocity!
function runParticles() {
    if (document.visibilityState == "visible") {
        for (var i = 0; i < asteroids.length; i++) {
            var asteroid = asteroids[i];
            // Math
            asteroid.pos[0] += asteroid.vel[0] * asteroid.size * 50;
            asteroid.pos[1] += asteroid.vel[1] * asteroid.size * 50;
            asteroid.pos[2] += asteroid.vel[2] * 50;

            // Update
            asteroid.div.style.transform = "translate(" + asteroid.pos[0] + "px, " + asteroid.pos[1] + "px) " +
                "rotate(" + asteroid.pos[2] + "deg)";

            // Check if left screen
            wrapAsteroid(asteroid);
        }
    }
}


// Asteroids move against scroll
var prevScroll = window.scrollY;

setInterval(() => scrollCheck(), 1)

// Fast Scroll Detection
function scrollCheck() {
    if (prevScroll != window.scrollY)
        for (var i = 0; i < asteroids.length; i++) {
            var asteroid = asteroids[i];
            // Move with page
            asteroid.pos_offset[1] -= (window.scrollY - prevScroll) * asteroid.size ** 3 * .000002;
            asteroid.div.style.top = asteroid.pos_offset[1] + "px";

            // Check if left page
            wrapAsteroid(asteroid);
        }
    prevScroll = window.scrollY;
}

function wrapAsteroid(asteroid) {
    // Check
    if (asteroid.pos[0] + asteroid.pos_offset[0] < -60) {
        asteroid.pos_offset[0] += window.innerWidth + 120;
        asteroid.div.style.left = asteroid.pos_offset[0] + "px";
    }
    else if (asteroid.pos[0] + asteroid.pos_offset[0] > window.innerWidth) {
        asteroid.pos_offset[0] -= window.innerWidth + 120;
        asteroid.div.style.left = asteroid.pos_offset[0] + "px";
    }
    if (asteroid.pos[1] + asteroid.pos_offset[1] < -60) {
        asteroid.pos_offset[1] += window.innerHeight + 120;
        asteroid.div.style.top = asteroid.pos_offset[1] + "px";
    }
    else if (asteroid.pos[1] + asteroid.pos_offset[1] > window.innerHeight) {
        asteroid.pos_offset[1] -= window.innerHeight + 120;
        asteroid.div.style.top = asteroid.pos_offset[1] + "px";
    }
}

// Slow Scroll Detection
/*window.addEventListener("wheel", (e) => {
    console.log(prevScroll + ", " + window.scrollY + ", " + e.deltaY)
    if (prevScroll != window.scrollY) {
        for (var i = 0; i < ast_vel.length; i++)
            if (asteroidCollection.children[i].style.display != "none") {
                ast_pos_offset[i] -= e.deltaY * ast_size[i] ** 2 * .0002;
                asteroidCollection.children[i].style.top = ast_pos_offset[i] + "px";
            }
        prevScroll = window.scrollY;
    }
});*/