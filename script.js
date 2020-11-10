//GLOBALS
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let blocks = []
let population = []
 let colorEnum = {
     TARGET: "#f50000",
     OBSTACLE: "#ffffff",
     ROCKET: "rgba(232,232, 232, 0.5)"
 }
 let canvasHeight = 350;
 let canvasWidth = 350;
 let cNumRow = 35;
 let cNumCol = 35;
 let cWidth = canvasWidth/cNumRow;
 let cHeight = canvasHeight/cNumCol;
 let targetBlock;
 let lifespan = 400
 let count = 4
 let maxforce = 0.2
 let simulationStart = false

//HELPER METODS
getMousePos = (canvas, evt) => {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

translateRowColToPos = (row, col) => {
    return {
        x: col*cWidth,
        y: row*cHeight
    }
}

translatePosToRowCol = (x, y) => {
    return {
        col: Math.ceil(x/cWidth)-1,
        row: Math.ceil(y/cHeight)-1
    }
}

getRandomNumber = (min, max) => {
    return Math.random() * (max - min) + min;
}

function randomElementFromArray(array){
    return array[Math.floor(Math.random() * (array.length - 0) ) + 0];
}

//CLASSES

//row, col are position, target is boolean to specify if target
function Block(row, col, target) {
    this.target = target
    this.row = row
    this.col = col
    this.width=cWidth
    this.height=cHeight
    this.color = ""

    if(this.target){
        this.color = colorEnum.TARGET
    } else {
        this.color = colorEnum.OBSTACLE
    }

}

function Vector(x,y) {

    this.x;
    this.y;
    if (x){
        this.x = x
    } else {
        this.x = getRandomNumber(-1*canvasWidth, canvasWidth)
    }
    if(y) {
        this.y=y
    } else {
        this.y = getRandomNumber(-1*canvasHeight, canvasHeight)
    }

    this.mult = (scalar) => {
        this.x *= scalar
        this.y *= scalar
    }

    this.getMag = () => {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
    }

    this.limit = (limit) => {
        if (this.getMag() > limit) {
            this.normalize()
            this.x *= limit
            this.y *= limit
        }
    }

    this.setMag = (mag) => {
        this.normalize()
        this.x *= mag
        this.y *= mag
    }

    this.normalize = () => {
        let mag = this.getMag()
        this.x /= mag 
        this.y /= mag
    }

    this.add = (vector2) => {
        this.x += vector2.x
        this.y += vector2.y
    }

    this.sub = (vector2) => {
        this.x -= vector2.x
        this.y -= vector2.y
    }
}

function DNA(genes) {
    
    if (genes) {
        this.genes = genes;
    }
    
    else {
        this.genes = [];
        for (var i = 0; i < lifespan; i++) {
            this.genes[i] = new Vector();
            this.genes[i].setMag(maxforce);
        }
    }
    
    this.crossover = function(partner) {
        var newgenes = [];
        var mid = Math.floor(this.genes.length/2);
        for (var i = 0; i < this.genes.length; i++) {
            if (i > mid) {
                newgenes[i] = this.genes[i];
            }
            else {
                newgenes[i] = partner.genes[i];
            }
        }
        return new DNA(newgenes);
    }

    // Adds random mutation to the genes to add variance.
    this.mutation = function() {
        for (var i = 0; i < this.genes.length; i++) {
            if (getRandomNumber(0, 1) < 0.01) {
                this.genes[i] = new Vector();
                this.genes[i].setMag(maxforce);
            }
        } 
    }
}

function Population() {
    this.rockets = []
    this.popsize = 25

    //adds new rocket to the population
    for (var i = 0; i < this.popsize; i++) { 
        this.rockets[i] = new Rocket();
    }

    //updates and shows the rocket synchronously 
    this.run = function() {
        for (var i = 0; i < this.popsize; i++) {
          this.rockets[i].update();
          this.rockets[i].show();
        }
    }

    //evaluate fxn calls the fitness class, if greater than max, make max equal to current
    this.evaluate = function(){
        var maxfit = 0;
        for (var i = 0; i < this.popsize; i++){
            this.rockets[i].calcFitness();
        
            if(this.rockets[i].fitness > maxfit){
                maxfit = this.rockets[i].fitness;
            }
        }
        console.log(maxfit)

        //normalizes the rocket
        for (var i = 0; i < this.popsize; i++){
            this.rockets[i].fitness /= maxfit;
        }
        
        this.mating = [];
        //takes rocket fitness and makes in to scale of 1 to 100
        //rocket with high fitness = be in mating array, otherwise not
        for (var i = 0; i < this.popsize; i++) {
            var n = this.rockets[i].fitness * 100;
            for (var j = 0; j < n; j++) {
              this.mating.push(this.rockets[i]);
            }
          }
    };

    this.selection = function() {
        var newRockets = [];
        for (var i = 0; i < this.rockets.length; i++) {
          // Picks random dna
          var parentA = randomElementFromArray(this.mating).dna;
          var parentB = randomElementFromArray(this.mating).dna;
          // Creates child by using crossover function
          var child = parentA.crossover(parentB);
          child.mutation();
          // Creates new rockSet with child dna
          newRockets[i] = new Rocket(child);
        }
        // This instance of rockets are the new rockets
        this.rockets = newRockets;
      };
}

function Rocket(dna) {
    let startingPos = translateRowColToPos(34, 17)
    this.pos = new Vector(startingPos.x, startingPos.y)
    this.vel = new Vector(0, 0)
    this.vel.mult(0)
    //if (this.vel.y < 0) this.vel.y*=-1;
    this.acc = new Vector()
    this.acc.mult(0)
    this.fitness = 0

    this.completed = false
    this.crashed = false

    if (dna) {
        this.dna = dna
    } else {
        this.dna = new DNA()
    }

    this.applyForce = (force) => {
        this.acc.add(force)
    }

    //this gets distance to the target block
    this.getDistToBlock = (block) => {
        let targetPos = translateRowColToPos(block.row, block.col);
        let xDiff = this.pos.x - targetPos.x
        let yDiff = this.pos.y - targetPos.y
        let dist = Math.sqrt( xDiff*xDiff + yDiff*yDiff );
        //console.log(dist)
        return dist
    }

    this.calcFitness = () => {
        let dist = this.getDistToBlock(targetBlock);

        this.fitness = canvasWidth - dist;
        if (this.completed) {
            this.fitness *= 20
        }
        if (this.crashed) {
            this.fitness /= 10
        }
    }

    this.update = ()=>{
       let dist = this.getDistToBlock(targetBlock)
       if (dist < 10) {
           let targetPos = translateRowColToPos(targetBlock.row, targetBlock.col)
           this.completed = true
           this.pos.x = targetPos.x
           this.pos.y = targetPos.y
       }
       
        if (this.pos.x > canvasWidth || this.pos.x < 0) {
            this.crashed = true;
        }
        
        blocks.forEach(block => {
            if (this.getDistToBlock(block) <= 5 && block!= targetBlock) {
                this.crashed = true;
            }
        })

        if (this.pos.y > canvasHeight || this.pos.y < 0) {
            this.crashed = true;
        }

        this.applyForce(this.dna.genes[count])
        if (!this.completed && !this.crashed) {
            this.vel.add(this.acc); 
            this.pos.x += this.vel.x; 
            this.pos.y -= this.vel.y //substract because pos vel is acc decreasing y (a.k.a going up)
            this.acc.mult(0);
            this.vel.limit(4);
        }
    }

    this.show = () => {

        let headingAngleRad = Math.atan(this.vel.y/this.vel.x) * -1 //the -1 is because canvas renders angles backwards (i.e neg angle is up, pos angle is down)

        let rocketCenterX = this.pos.x + cWidth/2
        let rocketCenterY = this.pos.y + cHeight/2

        //Matrix transformation
        ctx.translate(rocketCenterX, rocketCenterY); //rotate around center of rocket
        ctx.rotate(headingAngleRad);
        ctx.translate(-1*rocketCenterX, -1*rocketCenterY);

        // Rotated rectangle
        ctx.fillStyle = colorEnum.OBSTACLE;
        ctx.fillRect(this.pos.x, this.pos.y, cHeight*2, cWidth);

        //Undo transformations
        ctx.translate(rocketCenterX, rocketCenterY);
        ctx.rotate(-1*headingAngleRad);
        ctx.translate(-1*rocketCenterX, -1*rocketCenterY);
    }
}

//DRAWING METHODS
drawGrid = () => {
    for(let i =0; i<cNumRow;i++){
        for(let j =0; j<cNumCol;j++){
            ctx.strokeStyle = "#383838"
            ctx.strokeRect(j*cWidth, i*cHeight, cWidth, cHeight);
        }
    }
}

clearGrid = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

drawBlocks = () => {
    blocks.forEach(block => {
        let pos = translateRowColToPos(block.row, block.col)
        ctx.fillStyle = block.color
        ctx.fillRect(pos.x, pos.y, block.width, block.height)
    })
}

init = () => {
    targetBlock = new Block(10,17,true)
    blocks.push(targetBlock)
    population = new Population()

    window.addEventListener('click', (event)=>{
        if (!simulationStart) {
            let mousePos = getMousePos(canvas, event)
            let rowColPos = translatePosToRowCol(mousePos.x, mousePos.y)

            //to remove an exisitng block bvy clcking on it
            for(let i =blocks.length-1; i>=0;i--){
                let block = blocks[i]
                if (block.row == rowColPos.row && block.col == rowColPos.col) {
                    blocks.splice(i, 1)
                    return
                }
            }
            blocks.push(new Block(rowColPos.row, rowColPos.col))
            console.log(rowColPos)
        }
    })

    document.querySelector("#startBtn").addEventListener('click', (event)=>{
        if (!simulationStart) {
            simulationStart = true
        }
    })

    document.querySelector("#resetBtn").addEventListener('click', (event)=>{
        if (simulationStart) {
            simulationStart = false
            population = new Population();
            count=0;
        }
    })

    window.setInterval(draw, 1)
}

draw = () => {
    clearGrid();
    drawGrid();
    drawBlocks();

    if (simulationStart) {
        population.run()

        count++
    
        if (count == lifespan) {
            population.evaluate();
            population.selection()
            count = 0;
        }
    }
}

init();