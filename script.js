//GLOBALS
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let blocks = []
 let colorEnum = {
     TARGET: "#f50000",
     OBSTACLE: "#ffffff"
 }
 let canvasHeight = 750;
 let canvasWidth = 750;
 let cNumRow = 75;
 let cNumCol = 75;
 let cWidth = canvasWidth/cNumRow;
 let cHeight = canvasHeight/cNumCol;

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

DNA = () => {
    //
}

Population = () => {
    //
}

Rocket = () => {
    //
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
    targetBlock1 = new Block(2, 20, true)
    targetBlock2 = new Block(2, 21, true)
    targetBlock3 = new Block(3, 20, true)
    targetBlock4 = new Block(3, 21, true)
    blocks.push(targetBlock1, targetBlock2, targetBlock3, targetBlock4)
}

draw = () => {
    clearGrid();
    drawGrid();
    drawBlocks();
}

init();

window.setTimeout(draw, 1000)