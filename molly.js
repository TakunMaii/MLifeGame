const BLOCK_SIZE = 20
const blockMap = new Map()
const LIVE = 1
const DEAD = 0
const READYTODIE = 2
const READYTOBORN = 3

function positionToKey(x, y)
{
    return x + "," + y
}

function getPoint(x, y)
{
    var blockx = Math.floor(x / BLOCK_SIZE)
    var blocky = Math.floor(y / BLOCK_SIZE)
    var biosx = x % BLOCK_SIZE
    if(biosx < 0)biosx += BLOCK_SIZE
    var biosy = y % BLOCK_SIZE
    if(biosy < 0)biosy += BLOCK_SIZE
    var blockkey = positionToKey(blockx, blocky)
    if(!blockMap.has(blockkey))
    {
        return DEAD
    }
    var block = blockMap.get(blockkey)
    return block[biosx*BLOCK_SIZE + biosy]
}

function setPoint(x, y, value)
{
    var blockx = Math.floor(x / BLOCK_SIZE)
    var blocky = Math.floor(y / BLOCK_SIZE)
    var biosx = x % BLOCK_SIZE
    if(biosx < 0)biosx += BLOCK_SIZE
    var biosy = y % BLOCK_SIZE
    if(biosy < 0)biosy += BLOCK_SIZE
    var blockkey = positionToKey(blockx, blocky)
    if(!blockMap.has(blockkey))
    {
        blockMap.set(blockkey, new Array(BLOCK_SIZE*BLOCK_SIZE).fill(DEAD))
    }
    var block = blockMap.get(blockkey)
    block[biosx*BLOCK_SIZE + biosy] = value
}

function updateOneBlock(blockx, blocky)
{
    var blockkey = positionToKey(blockx, blocky)
    if(!blockMap.has(blockkey))
    {
        return false
    }
    var needEdgeProcess = false
    var block = blockMap.get(blockkey)
    for (let i = 0; i < block.length; i++)
    {
        var x = Math.floor(i / BLOCK_SIZE) + blockx * BLOCK_SIZE
        var y = i % BLOCK_SIZE + blocky * BLOCK_SIZE
        var state = block[i]
        //if the cell is at the edge of the block, need to process the edge
        if(x % BLOCK_SIZE == 0 || y % BLOCK_SIZE == 0 || x % BLOCK_SIZE == BLOCK_SIZE - 1 || y % BLOCK_SIZE == BLOCK_SIZE - 1)
        {
            if(state == LIVE)
                needEdgeProcess = true
        }
        //get the number of live neighbors
        var liveNeighbors = 0
        for (var dx = -1; dx <= 1; dx++)
        {
            for (var dy = -1; dy <= 1; dy++)
            {
                if (dx == 0 && dy == 0)
                {
                    continue
                }
                //* attention: ready to die also means live
                if (getPoint(x + dx, y + dy) == LIVE || getPoint(x + dx, y + dy) == READYTODIE)
                {
                    liveNeighbors++
                }
            }
        }
        //if the liveNeighbors is 0 or 1, the cell dies
        if (state == LIVE && liveNeighbors < 2)
        {
            setPoint(x, y, READYTODIE)
            continue
        }
        //if the liveNeighbors is 3 and the cell is dead, the cell becomes alive
        if (state == DEAD && liveNeighbors == 3)
        {
            setPoint(x, y, READYTOBORN)
            continue
        }
        //if the liveNeighbors is more than 4, the cell dies
        if (state == LIVE && liveNeighbors >= 4)
        {
            setPoint(x, y, READYTODIE)
            continue
        }
    }
    return needEdgeProcess;
}

function update()
{
    for (let [key, block] of blockMap)
    {
        var blockx = parseInt(key.split(",")[0])
        var blocky = parseInt(key.split(",")[1])
        var needEdgeProcess = updateOneBlock(blockx, blocky)
        //if the block need to process the edge, check if the neighbor exists, if not, create and update it
        if(needEdgeProcess)
        {
            for (var dx = -1; dx <= 1; dx++)
            {
                for (var dy = -1; dy <= 1; dy++)
                {
                    if (dx == 0 && dy == 0)
                    {
                        continue
                    }
                    var neighborBlockx = blockx + dx
                    var neighborBlocky = blocky + dy
                    var neighborBlockKey = positionToKey(neighborBlockx, neighborBlocky)
                    if(!blockMap.has(neighborBlockKey))
                    {
                        blockMap.set(neighborBlockKey, new Array(BLOCK_SIZE*BLOCK_SIZE).fill(DEAD))
                        updateOneBlock(neighborBlockx, neighborBlocky)
                    }
                }
            }
        }
    }

    for (let [key, block] of blockMap)
    {
        for (let i = 0; i < block.length; i++)
        {
            var blockx = parseInt(key.split(",")[0])
            var blocky = parseInt(key.split(",")[1])
            var x = Math.floor(i / BLOCK_SIZE) + blockx * BLOCK_SIZE
            var y = i % BLOCK_SIZE + blocky * BLOCK_SIZE
            var state = block[i]
            //if ready to die, die
            if (state == READYTODIE)
            {
                setPoint(x, y, DEAD)
            }
            //if ready to born, born
            if (state == READYTOBORN)
            {
                setPoint(x, y, LIVE)
            }
        }
    }
    
}

const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const canvasCellSize = 10
const canvasbios = {x : 0, y : 0}

//draw the map
function draw()
{
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (let [key, block] of blockMap)
    {
        for (let i = 0; i < block.length; i++)
        {
            var blockx = parseInt(key.split(",")[0])
            var blocky = parseInt(key.split(",")[1])
            var x = Math.floor(i / BLOCK_SIZE) + blockx * BLOCK_SIZE
            var y = i % BLOCK_SIZE + blocky * BLOCK_SIZE
            if (block[i] == LIVE)
            {
                ctx.fillRect(x * canvasCellSize + canvasbios.x, y * canvasCellSize + canvasbios.y, canvasCellSize, canvasCellSize)
            }
        }
    }
}

function next()
{
    update()
    draw()
}

//a function called autoLoop to start loop next() every 100ms, and a function called stopLoop to stop the loop
var loop
function autoLoop()
{
    loop = setInterval(next, 100)
}

function stopLoop()
{
    clearInterval(loop)
}

canvas.onmousedown = function(e){
    var ex = e.offsetX - canvasbios.x
    var ey = e.offsetY - canvasbios.y
    var x = Math.floor(ex / canvasCellSize)
    var y = Math.floor(ey / canvasCellSize)
    var state = getPoint(x, y)
    setPoint(x, y, state == LIVE ? DEAD : LIVE)
    draw()
}

canvas.onmousemove = function(e){
    //when drag, set the canvasbios to move the map
    if(e.buttons == 1)
    {
        canvasbios.x += e.movementX
        canvasbios.y += e.movementY
        draw()
    }
}