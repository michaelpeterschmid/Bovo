const socket = io("https://bovo.onrender.com/");
const gameSize = 14;

let gamefield = new Map();
let currentPlayer = [`<img src="./img/cross.png">`, "cross"];
let counter = 0;
let cells;
let yourTurn = true;
let room;
let gameOver = false;
let enoughPlayers = false




const joinRoomBtn = document.getElementById("joinRoomBtn");

joinRoomBtn.addEventListener("click", joinRoom);

function joinRoom(){
    room = document.getElementById("roomid").value
    if(room.trim()===""){
        alert("You must enter a valid room to join!")
        return
    }


    socket.emit("join-room", room, ({ok, message}) => {
        alert(message);
        if(ok){
            let room_h3 = `roomid: ${room}`;
            document.getElementById("roomcontainer").innerHTML = room_h3;
            document.getElementById("roomid").remove();
            document.getElementById("joinRoomBtn").remove();
            document.getElementById("joinQueueBtn").remove();
            drawGame();
        }
    })
}



const joinQueueBtn = document.getElementById("joinQueueBtn");

joinQueueBtn.addEventListener("click", joinQueue);

function joinQueue(){
    socket.emit("join-queue", ({ok, message}) => {
        alert(message);

    })
    document.getElementById("roomid").remove();
    document.getElementById("joinRoomBtn").remove();
    document.getElementById("joinQueueBtn").remove();
    drawGame();
}

socket.on("connect", () => {
    console.log(`Your socket ID: ${socket.id}`)
})

socket.on("leave", () => {
    if(!gameOver){
        alert("your opponent left the game you win.");
        gameOver = true;
    }

})

socket.on("ready-to-start", () => {
    alert("Two players are in this room. You may start playing!");
    enoughPlayers = true;
})


socket.on("queue-success", queueRoom => {
    alert("Two players are in this room. You may start playing!");
    enoughPlayers = true;
    room = queueRoom;
    let room_h3 = `roomid: ${queueRoom}`;
    document.getElementById("roomcontainer").innerHTML = room_h3;

})



socket.on("receive-data", (cellId, repliatePlayer) => {
    replicate(cellId, repliatePlayer)

})


function drawGame() {


    let gamediv = document.getElementById("gamediv");
    gamediv.style.gridTemplateColumns  = `repeat(${gameSize}, 1fr)`;
    for(let row = 0; row<gameSize; row++){
        for(let col = 0; col<gameSize; col++){

            gamediv.innerHTML += `<div id="${row}.${col}" class="cell"></div>`;
            
        }
    }
    

    cells = document.getElementsByClassName("cell");
    cells = Array.from(cells);

     /* Event Listener for each cell */
    cells.forEach(cell => {
        cell.addEventListener("click", () => play(cell, true));
     });  /*Need to write like this so that it is not executet right away but only after click*/
   

    /* Event delegation */
/*     document.querySelector("#gamediv").addEventListener("click", (event) => {
        if(event.target.matches(".cell")){
            play(event.target.closest(".cell"));
        }
    }) */

    /*
    💡 Extra tips

            If .cell elements are nested (e.g. a <span> inside the cell gets clicked), you may want to use closest instead of matches:

            document.querySelector("#gamediv").addEventListener("click", (event) => {
            const cell = event.target.closest(".cell");
            if (cell) {
                play(cell);
            }
            });


            This way, clicks on any child inside .cell still count as a click on the cell itself
    */
    
    
}



async function play(cell){


    if(!enoughPlayers){
        alert("Wait for another user to join!");
        return;
    }
    
    if(gameOver){
        alert("The game is over, reload the page to play again.");
        return;
    }

    if(!yourTurn){
        alert("Wait for other user to play!")
        return;
    }
    if(cell.innerHTML !== ""){
        alert("cell already played!"); 
        return;
    }



    if(counter%2==0){

        document.getElementById("currentPlayer").src = "./img/circle.png";
        cell.innerHTML = currentPlayer[0];
        gamefield.set(cell.id, currentPlayer[1])
        /* Draw first before  checking win*/
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // alternative: await new Promise(r => setTimeout(r, 0)); It pauses your async function until the next macrotask, giving the browser a chance to render.
        
        counter++;
        socket.emit("send-data", room, cell.id, currentPlayer, counter)
        console.log(gamefield.entries());

        if(checkWin(currentPlayer[1], cell)){
            gameOver = true
        }





    
    }else{
        document.getElementById("currentPlayer").src = "./img/cross.png";
        cell.innerHTML = currentPlayer[0];
        gamefield.set(cell.id, currentPlayer[1])
        /* Draw first before  checking win*/

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        counter++;
        socket.emit("send-data", room, cell.id, currentPlayer, counter)
        console.log(gamefield.entries());

        if(checkWin(currentPlayer[1], cell)){
            gameOver = true
        }


    }
    yourTurn = false;
   
    

}



async function replicate(cellId, repliatePlayer){
    currentPlayer = repliatePlayer;
    let cell = document.getElementById(cellId);

    if(cell.innerHTML !== ""){
        alert("cell already played!"); 
        return;
    }



    if(counter%2==0){

        document.getElementById("currentPlayer").src = "./img/circle.png";
        cell.innerHTML = currentPlayer[0];
        gamefield.set(cell.id, currentPlayer[1])
        /* Draw first before  checking win*/
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        // alternative: await new Promise(r => setTimeout(r, 0)); It pauses your async function until the next macrotask, giving the browser a chance to render.
        if(checkWin(currentPlayer[1], cell)){
            gameOver = true
        }

        currentPlayer = [`<img src="./img/circle.png">`, "circle"];

    
    }else{
        document.getElementById("currentPlayer").src = "./img/cross.png";
        cell.innerHTML = currentPlayer[0];
        gamefield.set(cell.id, currentPlayer[1])
        /* Draw first before  checking win*/

        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));


        if(checkWin(currentPlayer[1], cell)){
            gameOver = true
        }
        currentPlayer = [`<img src="./img/cross.png">`, "cross"];

    }
    yourTurn = true;
    counter++
}

function checkWin(player, cell) {
    if(checkHorizontal(player, cell)){
        return true;
    }if(checkVertical(player, cell)){
        return true;
    }if(checkDiagonal(player, cell)){
        return true;
    }
}
function checkHorizontal(player, cell) {
    let stepsBackwards = 0;
    let stepsForwards = 0;

    let id_y = Number(cell.id.split(".")[0]); // row
    let id_x = Number(cell.id.split(".")[1]); // col

    // forward (right)
    let x = id_x + 1;
    let y = id_y;
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsForwards++;
        x++;
    }

    // backward (left)
    x = id_x - 1;
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsBackwards++;
        x--;
    }

    return checkLength(player, stepsBackwards, stepsForwards);
}

function checkVertical(player, cell) {
    let stepsBackwards = 0;
    let stepsForwards = 0;

    let id_y = Number(cell.id.split(".")[0]); // row
    let id_x = Number(cell.id.split(".")[1]); // col

    // forward (right)
    let x = id_x;
    let y = id_y + 1;
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsForwards++;
        y++;
    }

    // backward (left)
    y = id_y - 1;
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsBackwards++;
        y--;
    }

    return checkLength(player, stepsBackwards, stepsForwards);
}

function checkDiagonal(player, cell) {
    //check from top left to corner right and vice versa
    let stepsBackwards = 0;
    let stepsForwards = 0;

    let id_y = Number(cell.id.split(".")[0]); // row
    let id_x = Number(cell.id.split(".")[1]); // col

    // forward (right)
    let x = id_x + 1
    let y = id_y + 1;
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsForwards++;
        y++;
        x++;
    }

    // backward (left)
    y = id_y - 1;
    x = id_x - 1
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsBackwards++;
        y--;
        x--;
    }
    if(checkLength(player, stepsBackwards, stepsForwards)){
        return true;
    }
    //check from top right to corner right and vice versa
    stepsBackwards = 0;
    stepsForwards = 0;

    // forward (right)
    x = id_x - 1
    y = id_y + 1;
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsForwards++;
        y++;
        x--;
    }

    // backward (left)
    y = id_y - 1;
    x = id_x + 1
    while (gamefield.get(`${y}.${x}`) === player) {
        stepsBackwards++;
        y--;
        x++;
    }
    return checkLength(player, stepsBackwards, stepsForwards);
}

function checkLength(player, stepsBackwards, stepsForwards){
    if (stepsBackwards+stepsForwards>=4){
        const winner = player;
        alert(winner + " has won the game!");
        return true;
    }else{
        return false;
    }
}
