// select canvas
const cvs = document.getElementById("witch");
const ctx = cvs.getContext("2d");

// variables
let frames = 0;
const degree = Math.PI/180; //need to convert to radian because ctx.rotate(angle=radian)

// load pixel art
const pixelArt = new Image();
pixelArt.src = "img/witchgameart.png";

// game state
const state = {
    current: 0,
    getReady: 0,
    game: 1,
    over: 2
}
//start button
const startBtn = {
    x: 792,
    y: 861,
    w: 363,
    h: 159
}

// control states
cvs.addEventListener("click", (e) => {
    switch(state.current){
        case state.getReady:
            state.current = state.game; 
            break;
        case state.game:
            witch.fly();
            break;
        case state.over:
        let rect = cvs.getBoundingClientRect(); //keeps track of coordinate changes if the user scrolls and the canvas moves
        let clickX = e.clientX - rect.left; //rect takes off what's added when you scroll right or down the page
        let clickY = e.clientY - rect.top;

        //check if user actually clicks on start button
        if (clickX >= startBtn.x && clickX <= startBtn.x + startBtn.w && clickY >= startBtn.y && clickY <= startBtn.y + startBtn.h){
            witch.speedReset();
            pipes.reset();
            score.reset();
            state.current = state.getReady;
        }
            break;
    }
})

//background
const bg = {
    sX: 0,
    sY: 0,
    sW: 1315,
    sH: 2120,
    x: 0,
    y: 0,
    w: cvs.width,
    h: cvs.height,

    draw() {
        ctx.drawImage(pixelArt, this.sX, this.sY, this.sW, this.sH, this.x, this.y, this.w, this.h);
    }
}

//foreground
const fg = {
    sX: 0,
    sY: 1601,
    sW: 1315,
    sH: 511,
    x: 0,
    y: 665,
    w: cvs.width,
    h: 200,
    dx: 2,

    draw() {
        ctx.drawImage(pixelArt, this.sX, this.sY, this.sW, this.sH, this.x, this.y, this.w, this.h);
    },

    update(){
        if ( state.current === state.game) {
            this.x = (this.x - this.dx) % (this.w);
        }
    }
}

// witch
const witch = {
    animation : [
        {sX: 1804, sY: 0},
        {sX: 1804, sY: 226},
        {sX: 1804, sY: 451},
        {sX: 1804, sY: 226}
    ],
    sW: 332,
    sH: 210,
    x: 40,
    y: 150,
    w: 130,
    h: 90,

    radius: 151.5,

    frame: 0,

    gravity: 0.25,
    jump: 4.6,
    speed: 0,
    rotation: 0,

    draw(){

        let witch = this.animation[this.frame];

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        ctx.drawImage(pixelArt, witch.sX, witch.sY, this.sW, this.sH, this.x, this.y, this.w, this.h);

        ctx.restore();
    },

    fly(){
        this.speed =- this.jump
    },

    update(){
        this.frequency = state.current == state.getReady ? 10 : 5; //fly slowly if getReady state, otherwise fly faster in game state
        this.frame += frames % this.frequency == 0 ? 1 : 0; //increment the frame by 1 each period
        this.frame = this.frame % this.animation.length; // go back to frame 0

        if (state.current == state.getReady){
            this.y = 150; // keeps witch position in one spot
            this.rotation = 0 * degree;
        } else {
            this.speed += this.gravity;
            this.y += this.speed;

            if (this.y + this.h/2 >= cvs.height - fg.h){
                this.y = cvs.height - fg.h - this.h/2;

                if (state.current === state.game) {
                    state.current = state.over
                }
            }

            if(this.speed >= this.jump){  //if speed > jump, then witch = falling
                this.rotation = 90 * degree;
                this.frame = 1;
            } else {
                this.rotation = -25 * degree;
            }
        }
    },
    speedReset(){
        this.speed = 0
    }

}

// pipes
const pipes = {
    position: [], //x and y position

    top: {
        sX: 1587,
        sy: 0
    },

    bottom: {
        sX: 1356,
        sY: 0
    },

    sW: 195,
    sH: 1830,
    w: 65,
    h: 500, 
    gap: 300,
    maxYPos: -150,
    dx: 2,

    draw(){
        for(let i = 0; i < this.position.length; i++){
            let p = this.position[i];

            // ensures that pipes are always aligned
            let topYPos = p.y;
            let bottomYPos = p.y + this.h + this.gap

            //top pipe
            ctx.drawImage(pixelArt, this.top.sX, this.top.sY, this.sW, this.sH, p.x, topYPos, this.w, this.h);

            //bottom pipe
            ctx.drawImage(pixelArt, this.bottom.sX, this.bottom.sY, this.sW, this.sH, p.x, bottomYPos, this.w, this.h);

        }
        
    },

    update(){
        if ( state.current !== state.game) return;

        if (frames%100 == 0){ // initial position for pipes and creation of new pipes
            this.position.push({
                x: cvs.width,
                y: this.maxYPos * (Math.random() + 1)
            });
        }

        for (let i = 0; i < this.position.length; i++){ // moving pipes 
            let p = this.position[i];

            let bottomPipeYPos = p.y + this.h + this.gap;

            //collision detection
            //top pipe
            if (witch.x + witch.radius > p.x && witch.x - witch.radius < p.x + this.w && witch.y + witch.radius > p.y && witch.y - witch.radius < p.y + this.h){
                state.current = state.over;
            }
            //bottom pipe
            if (witch.x + witch.radius > p.x && witch.x - witch.radius < p.x + this.w && witch.y + witch.radius > bottomPipeYPos && witch.y - witch.radius < bottomPipeYPos + this.h){
                state.current = state.over;
            }

            //move pipes to left
            p.x -= this.dx;

            // when pipes go beyond canvas on the left, delete from array
            if (p.x + this.w <= 0){
                this.position.shift(); //delete
                score.value += 1;

                score.best = Math.max(score.value, score.best); // picks which score is higher and sets it to score.best
                localStorage.setItem("best", score.best);
            }
        }
    },

    reset(){
        this.position = []
    }

}
//get ready message
const getReady = {
    sX: 1359,
    sY: 1827,
    sW: 876,
    sH: 1266,
    x: 140,
    y: 70,
    w: 322,
    h: 452,

    draw(){
        if (state.current === state.getReady) {
            ctx.drawImage(pixelArt, this.sX, this.sY, this.sW, this.sH, this.x, this.y, this.w, this.h);
        }
    }
}

//game over message
const gameOver = {
    sX: 0,
    sY: 2121,
    sW: 1270,
    sH: 861,
    x: 80,
    y: 85,
    w: 453,
    h: 317,

    draw(){
        if (state.current === state.over) {
            ctx.drawImage(pixelArt, this.sX, this.sY, this.sW, this.sH, this.x, this.y, this.w, this.h);
        }
    }
 }

 //score
 const score = {
     best: parseInt(localStorage.getItem("best")) || 0,
     value: 0,

     draw(){
        ctx.fillStyle = "pink";
        ctx.strokeStyle = "#000"

        if(state.current == state.game){
            ctx.lineWidth = 1
            ctx.font = "40px 'Press Start 2P'"
            ctx.fillText(this.value, cvs.width/2, 80); //(value of score, x, y)
            ctx.strokeText(this.value, cvs.width/2, 80);
        } else if (state.current == state.over){
            //score value
            ctx.font = "25px 'Press Start 2P'"
            ctx.fillText(this.value, 170, 270);
            //best score
            ctx.font = "25px 'Press Start 2P'"
            ctx.fillText(this.best, 270, 270);
        }
     },
     reset(){
         this.value = 0;
     }
 }

// draw
 draw =() => {
    bg.draw();
    fg.draw();
    witch.draw();
    pipes.draw();
    getReady.draw();
    gameOver.draw();
    score.draw();
}

// update
update = () => {
    witch.update();
    fg.update();
    pipes.update();
}

// loop
loop = () => {
    update();
    draw();
    frames++;

    requestAnimationFrame(loop);
}

loop();