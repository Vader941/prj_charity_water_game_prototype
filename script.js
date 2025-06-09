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
  const keys = Object.keys(pipeTypes);
  return keys[Math.floor(Math.random() * keys.length)];
}

// ===== Game State Variables =====
const gridSize = 10;
let pipeQueue = [];
let gameGrid = new Array(gridSize * gridSize).fill(elementTypes.EMPTY);
let waterSourcePos = -1;
let villagePositions = []; // Array to track multiple village positions
let timerInterval = null;
let timeRemaining = 40; // 40 seconds
let gameActive = false;
let firstPipePlaced = false;

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
  
  // Enable the start water flow button
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.disabled = false;
  }
  
  alert('Time\'s up! Click "Start Water Flow" to see how your pipeline performs.');
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  timeRemaining = 40;
  firstPipePlaced = false;
  gameActive = false;
  
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = formatTime(timeRemaining);
    timerElement.classList.remove('time-up');
  }
}

// ===== Game Initialization =====

function initializeGame() {
  // Reset game state
  gameGrid = new Array(gridSize * gridSize).fill(elementTypes.EMPTY);
  villagePositions = [];
  resetTimer();
  
  // Get DOM elements
  const gridElement = document.getElementById('grid');
  const queueElement = document.getElementById('queue');
  
  if (!gridElement || !queueElement) {
    console.error("Required DOM elements not found. Aborting game initialization.");
    return;
  }
  
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
  
  // Update the village count in the UI
  document.getElementById('score').textContent = '0/' + villagePositions.length;
  
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
    console.error("Grid element not found!");
    return;
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
    console.error("Queue element not found!");
    return;
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
  
  // Store pipe type in dataset for later use
  tile.dataset.pipeType = pipeType;
  
  // Mark the grid position as having a pipe
  gameGrid[index] = elementTypes.PIPE;
  
  pipeQueue.shift();
  pipeQueue.push(getRandomPipeType());
  renderPipeQueue();
}

// ===== Start Game =====

document.getElementById('start-btn').addEventListener('click', () => {
  // Only allow water flow if at least one pipe has been placed
  if (firstPipePlaced) {
    alert('Water flow simulation will run here.');
    // After simulation is complete, offer option to play again
    // For now, just reset the game
    initializeGame();
  } else {
    alert('Place at least one pipe before starting water flow!');
  }
});

// ===== Start the App =====

// Move these declarations to the top level for global access
const gridElement = document.getElementById('grid');
const queueElement = document.getElementById('queue');

// Use DOMContentLoaded to ensure the DOM is fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
  // Make sure we have our grid and queue elements
  if (!gridElement || !queueElement) {
    console.error("Critical elements missing. Game cannot initialize.");
    return;
  }
  
  // Initialize the game
  initializeGame();
  
  // Start with the button disabled until first pipe is placed
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.disabled = true;
    
    // Add click event listener here to ensure it exists
    startBtn.addEventListener('click', () => {
      // Only allow water flow if at least one pipe has been placed
      if (firstPipePlaced) {
        alert('Water flow simulation will run here.');
        // After simulation is complete, offer option to play again
        // For now, just reset the game
        initializeGame();
      } else {
        alert('Place at least one pipe before starting water flow!');
      }
    });
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
});
