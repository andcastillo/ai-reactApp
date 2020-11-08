const Agent = require('ai-agents').Agent;
const { max, min } = require('lodash');
const Graph = require('node-dijkstra');

class HexAgent extends Agent {
    constructor(value) {
        super(value);
    }

    /**
     * return a new move. The move is an array of two integers, representing the
     * row and column number of the hex to play. If the given movement is not valid,
     * the Hex controller will perform a random valid movement for the player
     * Example: [1, 1]
     */
    send() {
        let board = this.perception;
        let size = board.length;
        let available = getEmptyHex(board);
        let nTurn = size * size - available.length;

        console.log(this.getShortestPath(board))
        console.log("El mejor valor para max", this.minmax(board, true, 3, -999999, 999999, "1"))

        if (nTurn == 0) { // First move
            console.log([Math.floor(size / 2), Math.floor(size / 2) - 1])
            return [Math.floor(size / 2), Math.floor(size / 2) - 1];
        } else if (nTurn == 1) {
            console.log([Math.floor(size / 2), Math.floor(size / 2)])
            return [Math.floor(size / 2), Math.floor(size / 2)];
        }

        let move = available[Math.round(Math.random() * (available.length - 1))];
        return [Math.floor(move / board.length), move % board.length];
    }


    getNeighbors(position, board){

        let neighbors = [];

        let neighborUp = new Hex(position.row - 1, position.col)
        let neighborDown = new Hex(position.row + 1, position.col)
        let neighborLeft = new Hex(position.row, position.col - 1)
        let neighborRight = new Hex(position.row, position.col + 1)
        let neighborUpRight = new Hex(position.row - 1, position.col + 1)
        let neighborDownLeft = new Hex(position.row + 1, position.col - 1)

        

        if(position.isStartLeft){
            for(let i = 0; i < board.length; i++){
                let hexNeighbor = new Hex(i, 0);
                hexNeighbor.setMark(board[i][0]);
                neighbors.push(hexNeighbor)
            }
            return neighbors
        }else if(position.isFinishRight){
            for(let i = 0; i < board.length; i++){
                let hexNeighbor = new Hex(i, board.length - 1);
                hexNeighbor.setMark(board[i][board.length - 1]);
                neighbors.push(hexNeighbor)
            }
            return neighbors
        }

        neighbors = [neighborUp, neighborDown, neighborLeft, neighborRight, neighborUpRight, neighborDownLeft]  


        let neighborsFilter = neighbors.filter(hex => ((hex.row >= 0 && hex.col >=0 && hex.row < 7 && hex.col < 7))).map(hex => { 
            hex.setMark(board[hex.row][hex.col])
            return hex
         })


         if(position.col === 0){
             let startHex = new Hex(-1, -1, true, false);
             neighborsFilter.push(startHex);
         }else if(position.col === 6){
            let finalHex = new Hex(-2, -2, false, true);
            neighborsFilter.push(finalHex);
         }

         return neighborsFilter
    }

    createMap(neighborsNode){
        let mapNeighbors = {}

        for(let i = 0; i < neighborsNode.length; i++){
            let arrayName = [neighborsNode[i].row, neighborsNode[i].col]
            let weight;

            if(neighborsNode[i].mark === "1"){
                weight = 1;
            }else if(neighborsNode[i].mark === "2"){
                weight = 100;
            }else if(neighborsNode[i].isStartLeft || neighborsNode[i].isFinishRight){
                weight = 1;
            }
            else {
                weight = 2
            }

            mapNeighbors[arrayName.toString()] = weight;
        }

        return mapNeighbors;
    }

    getShortestPath(board){

        const graph = new Graph();

        //Se agregan los nodos terminales
        let startHex = new Hex(-1, -1, true, false);
        graph.addNode([startHex.row,startHex.col].toString(),this.createMap(this.getNeighbors(startHex, board)))
        let finalHex = new Hex(-2, -2, false, true);
        graph.addNode([finalHex.row,finalHex.col].toString(),this.createMap(this.getNeighbors(finalHex, board)))


        for(let i = 0; i < board.length; i++){
            for(let j = 0; j < board.length; j++){
                let hexNode = new Hex(i, j);
                hexNode.setMark(board[i][j])
                let mapNeighbors = this.createMap(this.getNeighbors(hexNode, board))
                graph.addNode([hexNode.row,hexNode.col].toString(),mapNeighbors)
            }
        }

        return graph.path('-1,-1', '-2,-2', { cost: true })
    }

    minmax(board, isMax, deep, alpha, beta, player){

        if(deep === 0){
            return this.transformHeuristicValue(this.getShortestPath(board).cost);
        }

        if(isMax){
            let maxValue = -999999999
            let possiblePlays = getEmptyHex(board)
            for(let move of possiblePlays){
                let node = {
                    value: 0,
                    move: move
                }
                let updatedBoard = JSON.parse(JSON.stringify(board));
                updatedBoard[move[0]][move[1]] = player ? "1" : "2"
                let value = this.minmax(updatedBoard, false, deep - 1, alpha, beta, !player)
                maxValue = max([value, maxValue])
                //console.log( "alpha",max([alpha, value]))
                //console.log("beta",beta)
                //console.log("valor",value)
                alpha = max([alpha, value])
                
                if(alpha >= beta){
                    console.log("Se podó max")
                    break;
                }
                
                
            }
            return maxValue
        }else{
            let minValue = 999999999
            let possiblePlays = getEmptyHex(board)
            for(let move of possiblePlays){
                let updatedBoard = JSON.parse(JSON.stringify(board))
                updatedBoard[move[0]][move[1]] = player ? "1" : "2"
                let value = this.minmax(updatedBoard, true, deep - 1, alpha, beta, !player)
                minValue = min([value, minValue])
                beta = min([beta, value])
                
                if(alpha >= beta){
                    console.log("Se podó min")
                    break;
                }
            }
            return minValue
        }

    }

    transformHeuristicValue(value){
        return value * -1
    }

}


module.exports = HexAgent;

/**
 * Return an array containing the id of the empty hex in the board
 * id = row * size + col;
 * @param {Matrix} board 
 */
function getEmptyHex(board) {
    let result = [];
    let size = board.length;
    for (let k = 0; k < size; k++) {
        for (let j = 0; j < size; j++) {
            if (board[k][j] === 0) {
                result.push([k,j]);
            }
        }
    }
    return result;
}

class Hex {
    constructor(row, col, isStartLeft = false, isFinishRight = false){
        this.isStartLeft = isStartLeft;
        this.isFinishRight = isFinishRight;
        this.row = row;
        this.col = col;
        this.mark = "";
    }

    setMark(value){
        this.mark = value;
    }

}

class MinMaxNode {
    constructor(path){
        this.path = path
        this.cost = cost
    }
}