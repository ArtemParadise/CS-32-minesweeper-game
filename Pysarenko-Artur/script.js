function createCell(hasMine = false, adjacentMines = 0, state = "closed") {
    return {
      hasMine: hasMine,             // чи є міна (true/false)
      adjacentMines: adjacentMines, // кількість мін навколо (0-8)
      state: state                  // "closed" | "open" | "flagged"
    };
  }
  
// 2. Створення ігрового поля (двовимірний масив)
function createField(rows, cols) {
    const field = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push(createCell());
      }
      field.push(row);
    }
    return field;
  }

function createGameState(rows, cols, minesCount) {
    return {
      rows: rows,                   // кількість рядків
      cols: cols,                   // кількість колонок
      minesCount: minesCount,       // загальна кількість мін
      status: "in_progress",        // "in_progress" | "win" | "lose"
      field: createField(rows, cols) // саме поле (двовимірний масив клітинок)
    };
  }

// 4. Ініціалізація прикладового поля з тестовими значеннями
const testGame = createGameState(9, 9, 5);

// ---- Рядок 0 ----
testGame.field[0][0] = createCell(true, 1, "closed");    // міна
testGame.field[0][1] = createCell(false, 1, "open");
testGame.field[0][2] = createCell(false, 0, "closed");
testGame.field[0][3] = createCell(false, 0, "closed");
testGame.field[0][4] = createCell(false, 0, "closed");
testGame.field[0][5] = createCell(false, 1, "closed");
testGame.field[0][6] = createCell(false, 1, "closed");
testGame.field[0][7] = createCell(false, 0, "closed");
testGame.field[0][8] = createCell(true, 1, "closed");    // міна

// ---- Рядок 1 ----
testGame.field[1][0] = createCell(false, 2, "closed");
testGame.field[1][1] = createCell(false, 2, "closed");
testGame.field[1][2] = createCell(false, 1, "closed");
testGame.field[1][3] = createCell(false, 0, "open");
testGame.field[1][4] = createCell(false, 1, "closed");
testGame.field[1][5] = createCell(false, 2, "closed");
testGame.field[1][6] = createCell(false, 2, "closed");
testGame.field[1][7] = createCell(false, 1, "closed");
testGame.field[1][8] = createCell(false, 1, "closed");

// ---- Рядок 2 ----
testGame.field[2][0] = createCell(false, 1, "closed");
testGame.field[2][1] = createCell(false, 1, "closed");
testGame.field[2][2] = createCell(true, 2, "closed");   // міна
testGame.field[2][3] = createCell(false, 2, "closed");
testGame.field[2][4] = createCell(false, 2, "closed");
testGame.field[2][5] = createCell(false, 1, "closed");
testGame.field[2][6] = createCell(false, 1, "closed");
testGame.field[2][7] = createCell(false, 1, "closed");
testGame.field[2][8] = createCell(false, 0, "closed");

// ---- Рядок 3 ----
testGame.field[3][0] = createCell(false, 0, "open");
testGame.field[3][1] = createCell(false, 1, "closed");
testGame.field[3][2] = createCell(false, 2, "closed");
testGame.field[3][3] = createCell(false, 3, "closed");
testGame.field[3][4] = createCell(false, 2, "closed");
testGame.field[3][5] = createCell(false, 2, "closed");
testGame.field[3][6] = createCell(false, 1, "closed");
testGame.field[3][7] = createCell(false, 0, "closed");
testGame.field[3][8] = createCell(false, 0, "closed");

// ---- Рядок 4 ----
testGame.field[4][0] = createCell(false, 0, "closed");
testGame.field[4][1] = createCell(false, 0, "closed");
testGame.field[4][2] = createCell(false, 1, "closed");
testGame.field[4][3] = createCell(false, 2, "closed");
testGame.field[4][4] = createCell(true, 1, "closed");   // міна
testGame.field[4][5] = createCell(false, 2, "closed");
testGame.field[4][6] = createCell(false, 1, "closed");
testGame.field[4][7] = createCell(false, 1, "closed");
testGame.field[4][8] = createCell(false, 0, "closed");

// ---- Рядок 5 ----
testGame.field[5][0] = createCell(false, 0, "closed");
testGame.field[5][1] = createCell(false, 1, "closed");
testGame.field[5][2] = createCell(false, 2, "closed");
testGame.field[5][3] = createCell(false, 2, "closed");
testGame.field[5][4] = createCell(false, 2, "closed");
testGame.field[5][5] = createCell(false, 1, "closed");
testGame.field[5][6] = createCell(false, 1, "closed");
testGame.field[5][7] = createCell(false, 0, "closed");
testGame.field[5][8] = createCell(false, 0, "closed");

// ---- Рядок 6 ----
testGame.field[6][0] = createCell(false, 0, "closed");
testGame.field[6][1] = createCell(false, 1, "closed");
testGame.field[6][2] = createCell(false, 1, "closed");
testGame.field[6][3] = createCell(false, 1, "closed");
testGame.field[6][4] = createCell(false, 1, "closed");
testGame.field[6][5] = createCell(false, 0, "closed");
testGame.field[6][6] = createCell(false, 0, "closed");
testGame.field[6][7] = createCell(false, 0, "closed");
testGame.field[6][8] = createCell(false, 0, "closed");

// ---- Рядок 7 ----
testGame.field[7][0] = createCell(false, 0, "closed");
testGame.field[7][1] = createCell(false, 0, "closed");
testGame.field[7][2] = createCell(false, 0, "closed");
testGame.field[7][3] = createCell(false, 1, "closed");
testGame.field[7][4] = createCell(false, 1, "closed");
testGame.field[7][5] = createCell(false, 1, "closed");
testGame.field[7][6] = createCell(false, 0, "closed");
testGame.field[7][7] = createCell(false, 0, "closed");
testGame.field[7][8] = createCell(false, 0, "closed");

// ---- Рядок 8 ----
testGame.field[8][0] = createCell(false, 0, "closed");
testGame.field[8][1] = createCell(false, 0, "closed");
testGame.field[8][2] = createCell(false, 0, "closed");
testGame.field[8][3] = createCell(false, 0, "closed");
testGame.field[8][4] = createCell(false, 0, "closed");
testGame.field[8][5] = createCell(false, 0, "closed");
testGame.field[8][6] = createCell(false, 0, "closed");
testGame.field[8][7] = createCell(false, 0, "closed");
testGame.field[8][8] = createCell(false, 0, "closed");

console.log("Тестове поле 9x9 з 5 мінами:");
console.log(testGame);
