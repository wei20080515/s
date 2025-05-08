// 初始化 GUN
const gun = Gun(['https://gun-manhattan.herokuapp.com/gun']);

// 遊戲狀態
const gameState = {
    pieces: null,
    currentPlayer: 'red',
    selectedPiece: null,
    players: {
        red: null,
        black: null
    }
};

// 棋子初始配置
const initialBoard = {
    'red_車1': {x: 0, y: 9, type: '車', color: 'red'},
    'red_馬1': {x: 1, y: 9, type: '馬', color: 'red'},
    'red_相1': {x: 2, y: 9, type: '相', color: 'red'},
    'red_士1': {x: 3, y: 9, type: '士', color: 'red'},
    'red_將': {x: 4, y: 9, type: '將', color: 'red'},
    'red_士2': {x: 5, y: 9, type: '士', color: 'red'},
    'red_相2': {x: 6, y: 9, type: '相', color: 'red'},
    'red_馬2': {x: 7, y: 9, type: '馬', color: 'red'},
    'red_車2': {x: 8, y: 9, type: '車', color: 'red'},
    'red_炮1': {x: 1, y: 7, type: '炮', color: 'red'},
    'red_炮2': {x: 7, y: 7, type: '炮', color: 'red'},
    'red_兵1': {x: 0, y: 6, type: '兵', color: 'red'},
    'red_兵2': {x: 2, y: 6, type: '兵', color: 'red'},
    'red_兵3': {x: 4, y: 6, type: '兵', color: 'red'},
    'red_兵4': {x: 6, y: 6, type: '兵', color: 'red'},
    'red_兵5': {x: 8, y: 6, type: '兵', color: 'red'},
    
    'black_車1': {x: 0, y: 0, type: '車', color: 'black'},
    'black_馬1': {x: 1, y: 0, type: '馬', color: 'black'},
    'black_象1': {x: 2, y: 0, type: '象', color: 'black'},
    'black_士1': {x: 3, y: 0, type: '士', color: 'black'},
    'black_將': {x: 4, y: 0, type: '將', color: 'black'},
    'black_士2': {x: 5, y: 0, type: '士', color: 'black'},
    'black_象2': {x: 6, y: 0, type: '象', color: 'black'},
    'black_馬2': {x: 7, y: 0, type: '馬', color: 'black'},
    'black_車2': {x: 8, y: 0, type: '車', color: 'black'},
    'black_炮1': {x: 1, y: 2, type: '炮', color: 'black'},
    'black_炮2': {x: 7, y: 2, type: '炮', color: 'black'},
    'black_卒1': {x: 0, y: 3, type: '卒', color: 'black'},
    'black_卒2': {x: 2, y: 3, type: '卒', color: 'black'},
    'black_卒3': {x: 4, y: 3, type: '卒', color: 'black'},
    'black_卒4': {x: 6, y: 3, type: '卒', color: 'black'},
    'black_卒5': {x: 8, y: 3, type: '卒', color: 'black'}
};

// DOM 元素
const chessboard = document.getElementById('chessboard');
const playerNameInput = document.getElementById('playerName');
const joinGameButton = document.getElementById('joinGame');
const newGameButton = document.getElementById('newGame');
const surrenderButton = document.getElementById('surrender');
const roomInfo = document.getElementById('roomInfo');

// 初始化遊戲
function initGame() {
    // 清空棋盤
    chessboard.innerHTML = '';
    
    // 繪製棋盤格子
    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 9; x++) {
            const grid = document.createElement('div');
            grid.className = 'grid';
            grid.style.left = (x * 50) + 'px';
            grid.style.top = (y * 50) + 'px';
            chessboard.appendChild(grid);
        }
    }
    
    // 設置初始棋盤
    gameState.pieces = initialBoard;
    updateBoard();
    
    // 訂閱遊戲狀態
    gun.get('chinesechess').on((data) => {
        if (data) {
            gameState.pieces = data.pieces || initialBoard;
            gameState.currentPlayer = data.currentPlayer || 'red';
            gameState.players = data.players || { red: null, black: null };
            updateBoard();
            updateGameInfo();
        }
    });

    // 初始化遊戲狀態到 GUN
    gun.get('chinesechess').put({
        pieces: initialBoard,
        currentPlayer: 'red',
        players: { red: null, black: null }
    });
}

// 更新棋盤顯示
function updateBoard() {
    // 清除所有棋子
    const pieces = chessboard.getElementsByClassName('chess-piece');
    while (pieces.length > 0) {
        pieces[0].remove();
    }
    
    // 放置棋子
    for (const [id, piece] of Object.entries(gameState.pieces)) {
        const pieceElement = document.createElement('div');
        pieceElement.className = `chess-piece ${piece.color}`;
        pieceElement.textContent = piece.type;
        pieceElement.style.left = (piece.x * 50) + 'px';
        pieceElement.style.top = (piece.y * 50) + 'px';
        pieceElement.dataset.id = id;
        
        pieceElement.addEventListener('click', handlePieceClick);
        chessboard.appendChild(pieceElement);
    }
}

// 處理棋子點擊
function handlePieceClick(event) {
    const pieceId = event.target.dataset.id;
    const piece = gameState.pieces[pieceId];
    
    // 確認是否是當前玩家的回合
    const playerColor = getPlayerColor();
    if (!playerColor || playerColor !== gameState.currentPlayer) {
        return;
    }
    
    if (gameState.selectedPiece) {
        // 如果已經選擇了棋子，嘗試移動
        if (isValidMove(gameState.selectedPiece, piece)) {
            movePiece(gameState.selectedPiece, piece);
        }
        gameState.selectedPiece = null;
        updateBoard();
    } else if (piece.color === playerColor) {
        // 選擇新的棋子
        gameState.selectedPiece = piece;
        event.target.classList.add('selected');
    }
}

// 確認移動是否合法
function isValidMove(fromPiece, toPiece) {
    // 這裡需要實現各種棋子的移動規則
    // 為了示範，我們先允許任何移動
    return true;
}

// 移動棋子
function movePiece(fromPiece, toPosition) {
    const newState = {
        pieces: { ...gameState.pieces },
        currentPlayer: gameState.currentPlayer === 'red' ? 'black' : 'red',
        players: gameState.players
    };
    
    // 更新棋子位置
    if (toPosition.x !== undefined) {
        fromPiece.x = toPosition.x;
        fromPiece.y = toPosition.y;
    }
    
    // 更新遊戲狀態到 GUN
    gun.get('chinesechess').put(newState);
}

// 加入遊戲
joinGameButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) return;
    
    if (!gameState.players.red) {
        gameState.players.red = playerName;
    } else if (!gameState.players.black) {
        gameState.players.black = playerName;
    }
    
    gun.get('chinesechess').get('players').put(gameState.players);
});

// 開新局
newGameButton.addEventListener('click', () => {
    if (confirm('確定要開新局嗎？')) {
        gun.get('chinesechess').put({
            pieces: initialBoard,
            currentPlayer: 'red',
            players: gameState.players
        });
    }
});

// 投降
surrenderButton.addEventListener('click', () => {
    if (confirm('確定要投降嗎？')) {
        const playerColor = getPlayerColor();
        if (playerColor) {
            alert(`${gameState.players[playerColor]} 投降了！`);
            // 可以在這裡加入更多遊戲結束的邏輯
        }
    }
});

// 獲取玩家顏色
function getPlayerColor() {
    const playerName = playerNameInput.value.trim();
    if (gameState.players.red === playerName) return 'red';
    if (gameState.players.black === playerName) return 'black';
    return null;
}

// 更新遊戲資訊
function updateGameInfo() {
    let info = `當前回合：${gameState.currentPlayer === 'red' ? '紅方' : '黑方'}<br>`;
    info += `紅方：${gameState.players.red || '等待加入'}<br>`;
    info += `黑方：${gameState.players.black || '等待加入'}`;
    roomInfo.innerHTML = info;
}

// 啟動遊戲
initGame();

