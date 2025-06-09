// ===== Pipe Types and Utilities =====

const pipeTypes = {
  straight: ['N', 'S'],
  elbow: ['N', 'E'],
  t_junction: ['N', 'E', 'W'],
  cross: ['N', 'E', 'S', 'W']
};

function getRandomPipeType() {
  const keys = Object.keys(pipeTypes);
  return keys[Math.floor(Math.random() * keys.length)];
}

// ===== Game Initialization =====

const gridElement = document.getElementById('grid');
const queueElement = document.getElementById('queue');
const gridSize = 10;
let pipeQueue = [];

function createGrid() {
  for (let i = 0; i < gridSize * gridSize; i++) {
    const tile = document.createElement('div');
    tile.classList.add('grid-tile');
    tile.dataset.index = i;
    tile.addEventListener('click', () => placePipe(i));
    gridElement.appendChild(tile);
  }
}

function generatePipeQueue() {
  pipeQueue = Array.from({ length: 5 }, () => getRandomPipeType());
  renderPipeQueue();
}

function renderPipeQueue() {
  queueElement.innerHTML = '';
  pipeQueue.forEach((type, index) => {
    const tile = document.createElement('div');
    tile.textContent = type;
    tile.className = 'grid-tile';
    tile.dataset.queueIndex = index;
    queueElement.appendChild(tile);
  });
}

// ===== Pipe Placement =====

function placePipe(index) {
  const tile = gridElement.children[index];
  if (!pipeQueue.length) return;
  tile.textContent = pipeQueue[0];
  pipeQueue.shift();
  pipeQueue.push(getRandomPipeType());
  renderPipeQueue();
}

// ===== Start Game =====

document.getElementById('start-btn').addEventListener('click', () => {
  alert('Water flow simulation will run here.');
});

// ===== Start the App =====

createGrid();
generatePipeQueue();
