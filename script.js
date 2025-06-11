// ===== Pipe Types and Utilities =====

const pipeTypes = {
  // Straight Pipes
  straight_horizontal: ['E', 'W'],
  straight_vertical: ['N', 'S'],

  // Elbow Pipes (corner pieces)
  elbow_NE: ['N', 'E'],
  elbow_NW: ['N', 'W'],
  elbow_SE: ['S', 'E'],
  elbow_SW: ['S', 'W'],

  // T-Junctions (3-way connections)
  t_up: ['N', 'E', 'W'],     // open top, left, right
  t_down: ['S', 'E', 'W'],   // open bottom, left, right
  t_left: ['N', 'S', 'W'],   // open top, bottom, left
  t_right: ['N', 'S', 'E'],  // open top, bottom, right

  // Cross (4-way)
  cross: ['N', 'E', 'S', 'W']
};

// Add pipe image paths
const pipeImages = {
  straight_horizontal: './images/horizontal_pipe_empty.png', // Path to your image
  straight_vertical: './images/vertical_pipe_empty.png', // Path to your image
  cross: './images/cross_pipe_empty.png',
  elbow_NE: './images/elbow_pipe_ne_empty.png',
  elbow_NW: './images/elbow_pipe_nw_empty.png',
  elbow_SE: './images/elbow_pipe_se_empty.png',
  elbow_SW: './images/elbow_pipe_sw_empty.png',
  t_up: './images/t_pipe_up_empty.png',
  t_down: './images/t_pipe_down_empty.png',
  t_left: './images/t_pipe_left_empty.png',
  t_right: './images/t_pipe_right_empty.png'
  // Add other pipe types as you create images for them
  // straight_vertical: 'images/straight_vertical.png',
  // elbow_NE: 'images/elbow_NE.png',
  // etc.
};

// Full versions of pipe images
const pipeFullImages = {
  straight_horizontal: './images/horizontal_pipe_full.png',
  straight_vertical: './images/vertical_pipe_full.png',
  cross: './images/cross_pipe_full.png',
  elbow_NE: './images/elbow_pipe_ne_full.png',
  elbow_NW: './images/elbow_pipe_nw_full.png',
  elbow_SE: './images/elbow_pipe_se_full.png',
  elbow_SW: './images/elbow_pipe_sw_full.png',
  t_up: './images/t_pipe_up_full.png',
  t_down: './images/t_pipe_down_full.png',
  t_left: './images/t_pipe_left_full.png',
  t_right: './images/t_pipe_right_full.png'
};

// Village with water image
const villageWithWater = './images/village_with_water.png';

// Game element types
const elementTypes = {
  EMPTY: 'empty',
  WATER_SOURCE: 'water_source',
  VILLAGE: 'village',
  ROCK: 'rock',
  TRASH: 'trash',
  PIPE: 'pipe'
};

// Game element images
const elementImages = {
  water_source: './images/water.png',
  village: './images/village_without_water.png',
  rock: './images/barrier_rock.png',
  trash: './images/barrier_trash.png',
  // Add any additional images
};

function getRandomPipeType() {
  // Define pipe type categories
  const pipeCategories = {
    straight: ['straight_horizontal', 'straight_vertical'],
    elbow: ['elbow_NE', 'elbow_NW', 'elbow_SE', 'elbow_SW'],
    t_junction: ['t_up', 't_down', 't_left', 't_right'],
    cross: ['cross']
  };
  
  // Assign weights to each category (elbow types have lower probability)
  const categoryWeights = {
    straight: 30,   // 30% chance
    elbow: 15,      // 15% chance (reduced)
    t_junction: 40, // 40% chance 
    cross: 15       // 15% chance
  };
  
  // Calculate total weight
  const totalWeight = Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0);
  
  // Generate a random value between 0 and total weight
  let random = Math.random() * totalWeight;
  
  // Determine which category to choose based on the random value
  let selectedCategory = null;
  for (const [category, weight] of Object.entries(categoryWeights)) {
    if (random < weight) {
      selectedCategory = category;
      break;
    }
    random -= weight;
  }
  
  // Default to straight if something went wrong
  if (!selectedCategory) {
    selectedCategory = 'straight';
  }
  
  // Select a random type from the chosen category
  const types = pipeCategories[selectedCategory];
  const randomIndex = Math.floor(Math.random() * types.length);
  
  return types[randomIndex];
}

// ===== Game State Variables =====
const gridSize = 10;
let pipeQueue = [];
let gameGrid = new Array(gridSize * gridSize).fill(elementTypes.EMPTY);
let waterSourcePos = -1;
let villagePositions = []; // Array to track multiple village positions
let timerInterval = null;
let timeRemaining = 90; // 90 seconds
let gameActive = false;
let firstPipePlaced = false;
let cumulativeScore = 0; // Track total score across rounds
let currentRound = 1; // Track which round we're on

// Initialize DOM element references as null - will be set when DOM is loaded
let gridElement = null;
let queueElement = null;

// ===== Timer Functions =====

function startTimer() {
  if (!firstPipePlaced) {
    firstPipePlaced = true;
    gameActive = true;
    
    // Initialize and display timer
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = formatTime(timeRemaining);
      
      // Start countdown
      timerInterval = setInterval(() => {
        timeRemaining--;
        timerElement.textContent = formatTime(timeRemaining);
        
        if (timeRemaining <= 0) {
          endGame();
        }
      }, 1000);
    }
  }
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function endGame() {
  clearInterval(timerInterval);
  gameActive = false;
  
  // Visual indicator that the game is over
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.classList.add('time-up');
  }
  
  // Disable the start water flow button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.disabled = true;
  }
  
  // Short delay before starting water flow to allow user to see time ran out
  setTimeout(() => {
    // Automatically start water flow when time is up
    startWaterFlow();
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeRemaining = 90;
  firstPipePlaced = false;
  gameActive = false;
  
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = formatTime(timeRemaining);
    timerElement.classList.remove('time-up');
  }
}

// ===== Game Initialization =====

function initializeDOM() {
  gridElement = document.getElementById('grid');
  queueElement = document.getElementById('queue');
  
  if (!gridElement || !queueElement) {
    console.error("Critical DOM elements missing. Game cannot initialize.");
    return false;
  }
  return true;
}

function initializeGame() {
  // First make sure we have all DOM elements
  if (!initializeDOM()) {
    console.error("Could not initialize game - missing DOM elements");
    return;
  }
  
  // Reset game state
  gameGrid = new Array(gridSize * gridSize).fill(elementTypes.EMPTY);
  villagePositions = [];
  resetTimer();
  
  // Reset scoring for a new game
  cumulativeScore = 0;
  currentRound = 1;
  
  // Place water source on a random edge
  waterSourcePos = placeRandomEdgeElement(elementTypes.WATER_SOURCE);
  
  // Place three villages with different distance requirements
  // First village - at least 8x6 squares away
  villagePositions.push(placeVillage(8, 6));
  
  // Second village - at least 6x4 squares away
  villagePositions.push(placeVillage(6, 4));
  
  // Third village - at least 7x5 squares away
  villagePositions.push(placeVillage(7, 5));
  
  // Place exactly 4 trash barriers
  for (let i = 0; i < 4; i++) {
    placeRandomNonEdgeElement(elementTypes.TRASH);
  }
  
  // Place exactly 8 rock barriers
  for (let i = 0; i < 8; i++) {
    placeRandomNonEdgeElement(elementTypes.ROCK);
  }
  
  createGrid();
  generatePipeQueue();
  
  // Update the village count in the UI with score
  document.getElementById('score').textContent = `0/${villagePositions.length} | Score: ${cumulativeScore}`;
  
  // Enable or disable the start button based on game state
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.disabled = !firstPipePlaced;
  }
}

function placeVillage(minDistX, minDistY) {
  const waterX = waterSourcePos % gridSize;
  const waterY = Math.floor(waterSourcePos / gridSize);
  let attempts = 0;
  let position;
  
  // Try to find a valid position for the village
  do {
    // Can be anywhere, including edges
    position = Math.floor(Math.random() * (gridSize * gridSize));
    const x = position % gridSize;
    const y = Math.floor(position / gridSize);
    
    // Calculate horizontal and vertical distance from water source
    const distX = Math.abs(x - waterX);
    const distY = Math.abs(y - waterY);
    
    // Check if position is empty and meets the distance requirement
    if (gameGrid[position] === elementTypes.EMPTY && 
        (distX >= minDistX || distY >= minDistY)) {
      gameGrid[position] = elementTypes.VILLAGE;
      return position;
    }
    
    attempts++;
  } while (attempts < 100); // Prevent infinite loop
  
  // If we can't find an ideal spot after many attempts, 
  // just place it as far as possible
  let maxDist = 0;
  let bestPos = -1;
  
  for (let i = 0; i < gridSize * gridSize; i++) {
    if (gameGrid[i] !== elementTypes.EMPTY) continue;
    
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    const distX = Math.abs(x - waterX);
    const distY = Math.abs(y - waterY);
    
    // Calculate a combined distance score
    const dist = distX * distX + distY * distY;
    
    if (dist > maxDist) {
      maxDist = dist;
      bestPos = i;
    }
  }
  
  if (bestPos !== -1) {
    gameGrid[bestPos] = elementTypes.VILLAGE;
    return bestPos;
  }
  
  // As a last resort, just find any empty spot
  for (let i = 0; i < gridSize * gridSize; i++) {
    if (gameGrid[i] === elementTypes.EMPTY) {
      gameGrid[i] = elementTypes.VILLAGE;
      return i;
    }
  }
  
  // If we still can't place a village (extremely unlikely), return -1
  console.error("Could not place village!");
  return -1;
}

function placeRandomEdgeElement(elementType) {
  const edges = [];
  
  // Top edge
  for (let i = 0; i < gridSize; i++) {
    edges.push(i);
  }
  
  // Right edge
  for (let i = 1; i < gridSize; i++) {
    edges.push(i * gridSize - 1);
  }
  
  // Bottom edge
  for (let i = 0; i < gridSize; i++) {
    edges.push(gridSize * (gridSize - 1) + i);
  }
  
  // Left edge
  for (let i = 1; i < gridSize - 1; i++) {
    edges.push(i * gridSize);
  }
  
  // Remove duplicates (corners)
  const uniqueEdges = [...new Set(edges)];
  
  // Select random edge position
  const randomIndex = Math.floor(Math.random() * uniqueEdges.length);
  const position = uniqueEdges[randomIndex];
  
  // Place element
  gameGrid[position] = elementType;
  return position;
}

function placeRandomNonEdgeElement(elementType) {
  let attempts = 0;
  let position;
  
  // Try to find an empty non-edge position
  do {
    position = Math.floor(Math.random() * (gridSize * gridSize));
    attempts++;
    
    // Check if position is not on edge and is empty
    const x = position % gridSize;
    const y = Math.floor(position / gridSize);
    const isEdge = x === 0 || y === 0 || x === gridSize - 1 || y === gridSize - 1;
    
    if (!isEdge && gameGrid[position] === elementTypes.EMPTY) {
      gameGrid[position] = elementType;
      return position;
    }
  } while (attempts < 100); // Prevent infinite loop
  
  // If all non-edge positions are taken, just find any empty spot
  do {
    position = Math.floor(Math.random() * (gridSize * gridSize));
    if (gameGrid[position] === elementTypes.EMPTY) {
      gameGrid[position] = elementType;
      return position;
    }
  } while (true);
}

function isPositionValid(index) {
  return gameGrid[index] === elementTypes.EMPTY;
}

function createGrid() {
  if (!gridElement) {
    console.error("Grid element not found! Trying to re-initialize DOM...");
    if (!initializeDOM()) return;
  }
  
  gridElement.innerHTML = ''; // Clear existing grid
  
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('grid-tile');
    tile.dataset.index = i;
    
    // Add appropriate content based on game grid
    if (gameGrid[i] !== elementTypes.EMPTY) {
      const elementType = gameGrid[i];
      tile.classList.add(elementType);
      
      if (elementImages[elementType]) {
        const img = document.createElement('img');
        img.src = elementImages[elementType];
        img.alt = elementType;
        img.className = 'element-image';
        tile.appendChild(img);
      }
      
      // Only add click listener if the tile is empty
      if (elementType === elementTypes.PIPE) {
        tile.addEventListener('click', () => placePipe(i));
      }
    } else {
      // Empty tile - can place pipe
      tile.addEventListener('click', () => placePipe(i));
    }
    
    gridElement.appendChild(tile);
  }
}

function generatePipeQueue() {
  pipeQueue = Array.from({ length: 5 }, () => getRandomPipeType());
  renderPipeQueue();
}

function renderPipeQueue() {
  if (!queueElement) {
    console.error("Queue element not found! Trying to re-initialize DOM...");
    if (!initializeDOM()) return;
  }
  
  queueElement.innerHTML = '';
  pipeQueue.forEach((type, index) => {
    const tile = document.createElement('div');
    tile.className = 'grid-tile';
    tile.dataset.queueIndex = index;
    
    // Add image if available, otherwise use text
    if (pipeImages[type]) {
      const img = document.createElement('img');
      img.src = pipeImages[type];
      img.alt = type;
      img.className = 'pipe-image';
      tile.appendChild(img);
    } else {
      tile.textContent = type;
    }
    
    queueElement.appendChild(tile);
  });
}

// ===== Pipe Placement =====

function placePipe(index) {
  // Don't allow placement after time runs out
  if (!gameActive && firstPipePlaced) return;
  
  // Check if we're trying to place on a non-empty tile that isn't a pipe
  if (gameGrid[index] !== elementTypes.EMPTY && gameGrid[index] !== elementTypes.PIPE) return;
  
  const tile = gridElement.children[index];
  if (!pipeQueue.length) return;
  
  // Start timer on first pipe placement
  if (!firstPipePlaced) {
    startTimer();
    // Enable the start water flow button once first pipe is placed
    document.getElementById('start-btn').disabled = false;
  }
  
  // Apply time penalty if replacing an existing pipe
  if (gameGrid[index] === elementTypes.PIPE) {
    // Subtract 2 seconds, but don't go below 0
    timeRemaining = Math.max(0, timeRemaining - 2);
    
    // Update timer display
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = formatTime(timeRemaining);
      
      // Flash the timer to indicate penalty
      timerElement.classList.add('time-penalty');
      setTimeout(() => {
        timerElement.classList.remove('time-penalty');
      }, 500);
    }
    
    // End game if time runs out due to penalty
    if (timeRemaining <= 0) {
      endGame();
      return;
    }
  }
  
  const pipeType = pipeQueue[0];
  tile.innerHTML = ''; // Clear any existing content
  tile.className = 'grid-tile pipe'; // Reset classes and add pipe class
  
  // Add image if available, otherwise use text
  if (pipeImages[pipeType]) {
    const img = document.createElement('img');
    img.src = pipeImages[pipeType];
    img.alt = pipeType;
    img.className = 'pipe-image';
    tile.appendChild(img);
  } else {
    tile.textContent = pipeType;
  }
  
  // Store pipe type in dataset for later use AND add a data attribute for the pipe connections
  tile.dataset.pipeType = pipeType;
  tile.dataset.connections = pipeTypes[pipeType].join(',');
  
  // Debug verification of pipe type and connections
  console.log(`Placed pipe at position ${index}: type=${pipeType}, connections=${pipeTypes[pipeType].join(',')}`);
  
  // Mark the grid position as having a pipe
  gameGrid[index] = elementTypes.PIPE;
  
  pipeQueue.shift();
  pipeQueue.push(getRandomPipeType());
  renderPipeQueue();
}

// Add a function to verify pipe types during water flow
function verifyPipeType(position) {
  const tile = gridElement.children[position];
  if (!tile) return false;
  
  const pipeType = tile.dataset.pipeType;
  const pipeConnections = pipeTypes[pipeType];
  
  // Check if the image matches the expected pipe type
  const img = tile.querySelector('img');
  if (img) {
    const expectedSrc = pipeImages[pipeType];
    if (img.src !== new URL(expectedSrc, window.location.href).href) {
      console.error(`Pipe image mismatch at position ${position}: 
        Expected: ${expectedSrc}, 
        Actual: ${img.src}`);
      
      // Correct the image
      img.src = expectedSrc;
      return false;
    }
  }
  
  return true;
}

// ===== Water Flow Logic =====

function startWaterFlow() {
  // Disable the button during simulation
  document.getElementById('start-btn').disabled = true;
  
  // Stop the timer when water flow starts
  clearInterval(timerInterval);
  gameActive = false;
  
  // Track which tiles have water
  const waterFlowGrid = new Array(gridSize * gridSize).fill(false);
  
  // Track which villages have been reached
  const villagesReached = new Set();
  
  // Mark the water source as having water
  waterFlowGrid[waterSourcePos] = true;
  
  // Queue for processing water flow - stores [position, direction water came from]
  const flowQueue = [];
  
  // Start at water source position
  const x = waterSourcePos % gridSize;
  const y = Math.floor(waterSourcePos / gridSize);
  
  // Initialize the flow from water source in all directions
  // We need to check if adjacent cells exist before adding them to the queue
  if (x > 0) flowQueue.push([waterSourcePos - 1, 'E']); // To the West
  if (x < gridSize - 1) flowQueue.push([waterSourcePos + 1, 'W']); // To the East
  if (y > 0) flowQueue.push([waterSourcePos - gridSize, 'S']); // To the North
  if (y < gridSize - 1) flowQueue.push([waterSourcePos + gridSize, 'N']); // To the South
  
  console.log('Water flow starting from position:', waterSourcePos);
  console.log('Initial flow queue:', flowQueue);
  
  // Process flow sequentially with visual delay
  processWaterFlow(flowQueue, waterFlowGrid, villagesReached);
}

function processWaterFlow(flowQueue, waterFlowGrid, villagesReached, index = 0) {
  if (index >= flowQueue.length) {
    // Water flow completed
    console.log('Water flow completed. Villages reached:', villagesReached.size);
    endWaterFlow(villagesReached);
    return;
  }
  
  const [position, fromDirection] = flowQueue[index];
  
  console.log(`Processing position ${position} with water from ${fromDirection}`);
  
  // Skip if out of bounds or already has water
  if (position < 0 || position >= gridSize * gridSize || waterFlowGrid[position]) {
    console.log(`Position ${position} is out of bounds or already has water. Skipping.`);
    processWaterFlow(flowQueue, waterFlowGrid, villagesReached, index + 1);
    return;
  }
  
  const elementType = gameGrid[position];
  console.log(`Element at position ${position} is: ${elementType}`);
  
  // Add visual highlight to the current position being processed
  const currentTile = gridElement.children[position];
  if (currentTile) {
    currentTile.classList.add('processing');
    setTimeout(() => {
      currentTile.classList.remove('processing');
    }, 500);
  }
  
  // Handle different element types
  if (elementType === elementTypes.VILLAGE) {
    // Village receives water
    waterFlowGrid[position] = true;
    villagesReached.add(position);
    
    // Change village image
    const tile = gridElement.children[position];
    const img = tile.querySelector('img');
    if (img) {
      console.log(`Updating village image at position ${position}`);
      img.src = villageWithWater;
    }
    
    // Add visual indicator class
    tile.classList.add('has-water');
    
    // Villages don't continue flow
    processWaterFlow(flowQueue, waterFlowGrid, villagesReached, index + 1);
    
  } else if (elementType === elementTypes.PIPE) {
    const tile = gridElement.children[position];
    const pipeType = tile.dataset.pipeType;
    
    // Verify pipe type is correct
    verifyPipeType(position);
    
    if (!pipeType) {
      console.error(`No pipe type found at position ${position}`);
      processWaterFlow(flowQueue, waterFlowGrid, villagesReached, index + 1);
      return;
    }
    
    console.log(`Pipe type at position ${position} is: ${pipeType} with openings: ${pipeTypes[pipeType]}`);
    console.log(`Water coming from direction: ${fromDirection}`);
    
    // Clear debug info if exists and add new debug info
    if (tile.querySelector('.debug-info')) {
      tile.removeChild(tile.querySelector('.debug-info'));
    }
    
    // Add debug info element to show pipe type and connections
    const debugInfo = document.createElement('div');
    debugInfo.className = 'debug-info';
    debugInfo.textContent = `${pipeType}: ${pipeTypes[pipeType].join(',')}`;
    debugInfo.style.position = 'absolute';
    debugInfo.style.top = '0';
    debugInfo.style.left = '0';
    debugInfo.style.fontSize = '8px';
    debugInfo.style.backgroundColor = 'rgba(255,255,255,0.7)';
    debugInfo.style.color = 'black';
    debugInfo.style.zIndex = '100';
    debugInfo.style.padding = '1px';
    
    // Uncomment to enable visual debugging
    // tile.style.position = 'relative';
    // tile.appendChild(debugInfo);
    
    // Check if pipe can receive water from the incoming direction
    if (pipeTypes[pipeType] && pipeTypes[pipeType].includes(fromDirection)) {
      console.log(`Pipe at ${position} can receive water from ${fromDirection}`);
      
      // Mark as having water
      waterFlowGrid[position] = true;
      
      // Add visual indicator class
      tile.classList.add('has-water');
      
      // Change pipe image to full
      const img = tile.querySelector('img');
      if (img && pipeFullImages[pipeType]) {
        console.log(`Updating pipe image at position ${position} to ${pipeFullImages[pipeType]}`);
        img.src = pipeFullImages[pipeType];
      }
      
      // Add next positions to flow queue
      const x = position % gridSize;
      const y = Math.floor(position / gridSize);
      
      // Create a more robust direction checking
      const connections = [];
      
      // For each open end of the pipe, check if there's a connecting pipe
      if (pipeTypes[pipeType].includes('N') && y > 0) {
        connections.push({direction: 'N', position: position - gridSize, from: 'S'});
      }
      if (pipeTypes[pipeType].includes('S') && y < gridSize - 1) {
        connections.push({direction: 'S', position: position + gridSize, from: 'N'});
      }
      if (pipeTypes[pipeType].includes('W') && x > 0) {
        connections.push({direction: 'W', position: position - 1, from: 'E'});
      }
      if (pipeTypes[pipeType].includes('E') && x < gridSize - 1) {
        connections.push({direction: 'E', position: position + 1, from: 'W'});
      }
      
      // Filter out the direction we came from to avoid backflow
      const outgoingConnections = connections.filter(conn => conn.direction !== fromDirection);
      
      // Add all valid connections to the queue
      for (const conn of outgoingConnections) {
        console.log(`Adding ${conn.direction} connection at position ${conn.position} to flow queue`);
        flowQueue.push([conn.position, conn.from]);
      }
    } else {
      console.log(`Pipe at ${position} cannot receive water from ${fromDirection}`);
    }
    
    // Continue water flow with a delay for visual effect
    setTimeout(() => {
      processWaterFlow(flowQueue, waterFlowGrid, villagesReached, index + 1);
    }, 200); // Increased delay for better visibility
  } else {
    // For other elements (rocks, trash, empty) - water doesn't flow through
    console.log(`Element at ${position} blocks water flow`);
    processWaterFlow(flowQueue, waterFlowGrid, villagesReached, index + 1);
  }
}

function endWaterFlow(villagesReached) {
  // Calculate score for this round
  let roundScore = 0;
  let pipeCount = 0;
  let pipesWithWater = 0;
  
  // Count pipes with and without water
  for (let i = 0; i < gridSize * gridSize; i++) {
    if (gameGrid[i] === elementTypes.PIPE) {
      pipeCount++;
      const tile = gridElement.children[i];
      if (tile.classList.contains('has-water')) {
        // +3 for each pipe with water
        roundScore += 3;
        pipesWithWater++;
      } else {
        // -1 for each unused pipe
        roundScore -= 1;
      }
    }
  }
  
  // Add points for villages reached
  roundScore += villagesReached.size * 15;
  
  // Subtract points for villages not reached
  roundScore -= (villagePositions.length - villagesReached.size) * 7;
  
  // Update cumulative score
  cumulativeScore += roundScore;
  
  // Update score display
  const scoreElement = document.getElementById('score');
  scoreElement.textContent = `${villagesReached.size}/${villagePositions.length} | Score: ${cumulativeScore}`;
  
  // Add class to show final score
  scoreElement.classList.add('final-score');
  
  // Generate the round summary
  let summary = `Round ${currentRound} Summary:\n`;
  summary += `- Villages reached: ${villagesReached.size}/${villagePositions.length}\n`;
  summary += `- Pipes with water: ${pipesWithWater}/${pipeCount}\n`;
  summary += `- Round score: ${roundScore}\n`;
  summary += `- Total score: ${cumulativeScore}`;
  
  // Show results message after a short delay
  setTimeout(() => {
    let message;
    if (villagesReached.size === 0) {
      message = "No villages reached! Your pipeline needs more work.\n\n";
    } else if (villagesReached.size === villagePositions.length) {
      message = "Great job! All villages now have clean water!\n\n";
    } else {
      message = `You've brought water to ${villagesReached.size} out of ${villagePositions.length} villages.\n\n`;
    }
    
    message += summary;
    alert(message);
    
    // Enable the next round button
    document.getElementById('next-round-btn').disabled = false;
    
    // Re-enable the reset button
    document.getElementById('reset-btn').disabled = false;
  }, 1000);
}

// Add function to start next round
function startNextRound() {
  // Increment round counter
  currentRound++;
  
  // Display the water fact modal before starting the round
  showWaterFactModal();
  
  // The rest of the round setup would continue after the modal is closed
  // For now, we'll just reset the game grid but keep the cumulative score
  
  // Reset the game grid but keep the cumulative score
  gameGrid = new Array(gridSize * gridSize).fill(elementTypes.EMPTY);
  villagePositions = [];
  resetTimer();
  
  // Place new elements
  waterSourcePos = placeRandomEdgeElement(elementTypes.WATER_SOURCE);
  
  // Place three villages with different distance requirements
  villagePositions.push(placeVillage(8, 6));
  villagePositions.push(placeVillage(6, 4));
  villagePositions.push(placeVillage(7, 5));
  
  // Place barriers
  for (let i = 0; i < 4; i++) {
    placeRandomNonEdgeElement(elementTypes.TRASH);
  }
  
  for (let i = 0; i < 8; i++) {
    placeRandomNonEdgeElement(elementTypes.ROCK);
  }
  
  // Recreate grid and pipe queue
  createGrid();
  generatePipeQueue();
  
  // Update the village count and score in the UI
  document.getElementById('score').textContent = `0/${villagePositions.length} | Score: ${cumulativeScore}`;
  
  // Disable buttons appropriately
  document.getElementById('start-btn').disabled = true;
  document.getElementById('next-round-btn').disabled = true;
}

// Function to display the water fact modal
function showWaterFactModal() {
  const modal = document.getElementById('fact-modal');
  modal.style.display = 'block';
  
  // Add event listeners for buttons
  document.getElementById('ok-btn').addEventListener('click', closeModal);
  document.getElementById('learn-more-btn').addEventListener('click', learnMore);
}

// Function to close the modal
function closeModal() {
  document.getElementById('fact-modal').style.display = 'none';
}

// Placeholder function for "Learn More" button
function learnMore() {
  alert('This would link to educational resources about clean water access.');
  // In the future, this would open a new tab with educational content
  // window.open('https://www.charitywater.org/global-water-crisis', '_blank');
  closeModal();
}

// ===== Start Game =====

document.getElementById('start-btn').addEventListener('click', () => {
  // Only allow water flow if at least one pipe has been placed
  if (firstPipePlaced) {
    // Fast forward the timer to 0
    timeRemaining = 0;
    
    // Update the timer display immediately
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = formatTime(timeRemaining);
    }
    
    // End the game which will trigger water flow
    endGame();
  } else {
    alert('Place at least one pipe before starting water flow!');
  }
});

// Also show the modal at game start (after DOM is loaded)
document.addEventListener('DOMContentLoaded', () => {
  // Initialize DOM references first
  if (!initializeDOM()) {
    alert("Error: Could not initialize game interface. Please refresh the page.");
    return;
  }
  
  // Initialize the game
  initializeGame();
  
  // Start with the button disabled until first pipe is placed
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.disabled = true;
  }
  
  // Add reset button functionality
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      // Confirm before resetting if game is in progress
      if (firstPipePlaced && gameActive && !confirm('Are you sure you want to reset the game? All progress will be lost.')) {
        return;
      }
      
      // Reset the game
      initializeGame();
    });
  }
  
  // Add next round button functionality
  const nextRoundBtn = document.getElementById('next-round-btn');
  if (nextRoundBtn) {
    nextRoundBtn.disabled = true;
    nextRoundBtn.addEventListener('click', startNextRound);
  }
  
  // Show water fact modal when the page first loads
  setTimeout(showWaterFactModal, 1000);
});
