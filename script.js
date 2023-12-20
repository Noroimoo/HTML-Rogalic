//Список предметов
const tiles = {
  WALL: 0,
  FLOOR: 1,
  PLAYER: 2,
  ENEMY: 3,
  HEALTH_POTION: 4,
  SWORD: 5,
};

//Игрок
const playerEntity = {
  health: null,
  attack: null,
  prevTile: tiles.FLOOR,
  dead: false
};

//Размеры и кол-во комнат
const mapWidth = 40;
const mapHeight = 24;
const minRoomSize = 3;
const maxRoomSize = 8;
const minRooms = 5;
const maxRooms = 10;

//Объекты
const emptyFloors = [];
const enemies = [];
const playerPosition = {x: 0, y: 0}
const map = [];

//Создаём карту наполняя её стенами
function createMap() {
  for (let y = 0; y < mapHeight; y++) {
    const row = [];
    for (let x = 0; x < mapWidth; x++) {
      row.push(tiles.WALL);
    }
    map.push(row);
  }
}


//Создаём прямоугольные комнаты случайных размеров и случайно раскидываем их по карте заменяя стены на пол.
function createRooms() {
  const roomCount = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;

  for (let i = 0; i < roomCount; i++) {
    const roomWidth = Math.floor(Math.random()* (maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const roomHeight = Math.floor(Math.random() *(maxRoomSize - minRoomSize + 1)) + minRoomSize;
    const roomPosX = Math.floor(Math.random()* (mapWidth - roomWidth - 1)) + 1;
    const roomPosY = Math.floor(Math.random() *(mapHeight - roomHeight - 1)) + 1;

    for (let y = roomPosY; y < roomPosY + roomHeight; y++) {
      for (let x = roomPosX; x < roomPosX + roomWidth; x++) {
        map[y][x] = tiles.FLOOR;
        emptyFloors.push ({ x, y, flooded: false });
      }
    }
  }
}


//Создаём случайное количество коридоров и проводим их через всю карту.
function createHallways() {
  const minHallways = 3;
  const maxHallways = 5;

  const horizontalHallwayCount = Math.floor(Math.random() *(maxHallways - minHallways + 1)) + minHallways;
  const verticalHallwayCount = Math.floor(Math.random()* (maxHallways - minHallways + 1)) + minHallways;

  // Создаём горизонтально. Записываем координаты пола в emptyFloors, так же ставим отметку что flooded = false для проверки комнат в другой функции 
  for (let i = 0; i < horizontalHallwayCount; i++) {
    const startY = Math.floor(Math.random()*mapHeight);
    for (let x = 0; x < mapWidth; x++) {
      map[startY][x] = tiles.FLOOR;
      if (!emptyFloors.some(floor => floor.x === x && floor.y === startY)) {
        emptyFloors.push({ x, y: startY, flooded: false });
      }
    }
  }

  // Тоже самое, только теперь вертикально.
  for (let i = 0; i < verticalHallwayCount; i++) {
    const startX = Math.floor(Math.random()* mapWidth);
    for (let y = 0; y < mapHeight; y++) {
      map[y][startX] = tiles.FLOOR;
      if (!emptyFloors.some(floor => floor.x === startX && floor.y === y)) {
        emptyFloors.push({ x: startX, y, flooded: false});
      }
    }
  }
}



//Проверяем во все ли комнаты можно пройти. Если можно, то возвращаем true, если нельзя, то false.
//Делается это с помощью flood fill алгоритма. https://en.wikipedia.org/wiki/Flood_fill
//Сначала находим индекс пола в emptyFloors который не является flooded
//Рекурсией вызываем floodFill функцию помечая каждую соседнюю клетку как flooded. Если клетка помечена, то добавляем её в accessibleFloors
//Сравниваем количество emptyFloors и accessibleFloors и возвращаем true если одно и тоже значение.
function isAccessible() {
  function floodFill(x, y) {
    const tile_index = emptyFloors.findIndex(floor => floor.x === x && floor.y === y && !floor.flooded);

    if (tile_index !== -1) {
      emptyFloors[tile_index].flooded = true;
      accessibleFloors.push(emptyFloors[tile_index]);
      floodFill(x - 1, y);
      floodFill(x + 1, y);
      floodFill(x, y - 1);
      floodFill(x, y + 1);
    }
  }

  const accessibleFloors = [];
  floodFill(playerPosition.x, playerPosition.y);

  if (accessibleFloors.length === emptyFloors.length) {
    return true;
  } else {
    return false;
  }
}














//Раскидываем предметы и персонажей по случайным координатам
function createEntities(enemyNum, playerNum, potionNum, swordNum) {
  function getRandomFloor() {
    const randomIndex = Math.floor(Math.random() * emptyFloors.length);
    const randomFloorTile = emptyFloors[randomIndex];
    emptyFloors.splice(randomIndex, 1);
    return randomFloorTile;
  }
  
  //При создании врага задаём ему статы и заносим его в список врагов
  function createEnemy(num) {
    for (let i = 0; i < num; i++) {
      const randomFloor = getRandomFloor();
      map[randomFloor.y][randomFloor.x] = tiles.ENEMY;
      enemies.push({ x: randomFloor.x, y: randomFloor.y, health: 3, attack: 2, prevTile: tiles.FLOOR});
    }
  }
  
  //При создании игрока задаём ему статы
  function createPlayer(num) {
    for (let i = 0; i < num; i++) {
      const randomFloor = getRandomFloor();
      map[randomFloor.y][randomFloor.x] = tiles.PLAYER;
      playerPosition.x = randomFloor.x;
      playerPosition.y = randomFloor.y;
      playerEntity.health = 10;
      playerEntity.attack = 1
      damageBar()
      healthBar()
    }
  }
 

  function createPotion(num) {
    for (let i = 0; i < num; i++) {
      const randomFloor = getRandomFloor();
      map[randomFloor.y][randomFloor.x] = tiles.HEALTH_POTION;
    }
  }

  function createSword(num) {
    for (let i = 0; i < num; i++) {
      const randomFloor = getRandomFloor();
      map[randomFloor.y][randomFloor.x] = tiles.SWORD;
    }
  }

  createEnemy(enemyNum);
  createPlayer(playerNum);
  createPotion(potionNum);
  createSword(swordNum);
}

//Проверяем если все враги были побеждены. Если их нету, то игрок победил. playerEntity.dead = true чтобы отрубить контроль у игрока
function victoryCondition() {
  if (enemies.length === 0 && !playerEntity.dead) {
    const healthBar = document.querySelector(".health-bar");
    healthBar.innerHTML = "⭐⭐⭐⭐⭐⭐⭐Victory!⭐⭐⭐⭐⭐⭐⭐";
    playerEntity.dead = true;
  }
}


//Проверяем может ли персонаж(игрок или враг) ходить на заданные координаты. Не даёт проходить через стены, врагов и игрока
function canYouWalkThere({x, y}) {
  if (x < 0) {
    return false;
  }

  if (x >= mapWidth) {
    return false;
  }

  if (y < 0) {
    return false;
  }

  if (y >= mapHeight) {
    return false;
  }

  if (map[y][x] === tiles.WALL) {
    return false;
  }

  if (map[y][x] === tiles.ENEMY) {
    return false;
  }

  if (map[y][x] === tiles.PLAYER) {
    return false;
  }

  return true;
}


//Функция для нажатия на кнопки. Работает только если playerEntity.dead = false
function onKeyPress(event) {
  if (!playerEntity.dead && (event.key === 'w' || event.key === 'ц'
    || event.key === 'a' || event.key === 'ф'
    || event.key === 's' || event.key === 'ы'
    || event.key === 'd' || event.key === 'в'
    || event.key === ' ')) {
    turn(event.key);
  }
}




//Логика геймплея. Сама игра поделена на ходы. Ход происходит при совершения какого либо действия игроком.

function turn(keyPressed) {
  const movedWhere = { ...playerPosition };

  //Меняем координаты movedWhere при нажатии в определенное направление.
  if (keyPressed === "w" || keyPressed === "ц") {
    movedWhere.y -= 1;
  } else if (keyPressed === "a" || keyPressed === "ф") {
    movedWhere.x -= 1;
  } else if (keyPressed === "s" || keyPressed === "ы") {
    movedWhere.y += 1;
  } else if (keyPressed === "d" || keyPressed === "в") {
    movedWhere.x += 1;
  } else if (keyPressed === " ") {
    attackEnemies();
    //В принципе, сюда можно поставить return. Но тогда враги не будут двигаться при нажатии на пробел а просто будут стоять.
    //Помоему интереснее когда они двигаются после атаки игрока.
  }
  

  //С помощью функции canYouWalkThere проверяем может ли персонаж передвинуться в том или ином направлении.
  if (canYouWalkThere(movedWhere)) {
    const currentTile = map[movedWhere.y][movedWhere.x];

    //currentTile нужен для записывания того, на чём персонаж стоит.
    //Если персонаж встал на меч, то добавляем ему атаки. Если на зелье, то востанавливаем HP
    if (currentTile === tiles.SWORD) {
      playerEntity.attack += 1;
      damageBar()
    } else if (currentTile === tiles.HEALTH_POTION) {
      playerEntity.health += 2;
      healthBar()
    }

  
    map[playerPosition.y][playerPosition.x] = playerEntity.prevTile;

    // Если игрок наступает на меч или зелье, то меняем их на FLOOR.
    playerEntity.prevTile = (currentTile === tiles.SWORD || currentTile === tiles.HEALTH_POTION) ? tiles.FLOOR : currentTile;

    playerPosition.x = movedWhere.x;
    playerPosition.y = movedWhere.y;
    map[playerPosition.y][playerPosition.x] = tiles.PLAYER;
    //Записываем новое место игрока.
  }

  // Все враги из списка двигаются в случайном направлении.
  function moveEnemies() {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const moveDirection = Math.floor(Math.random() * 4);

      let newEnemyPositionX = enemy.x;
      let newEnemyPositionY = enemy.y;

      if (moveDirection === 0) {
        newEnemyPositionY -= 1;
      } else if (moveDirection === 1) {
        newEnemyPositionY += 1;
      } else if (moveDirection === 2) {
        newEnemyPositionX -= 1;
      } else {
        newEnemyPositionX += 1;
      }

      if (canYouWalkThere({ x: newEnemyPositionX, y: newEnemyPositionY })) {
        map[enemy.y][enemy.x] = enemy.prevTile;
        enemy.prevTile = map[newEnemyPositionY][newEnemyPositionX];
        enemy.x = newEnemyPositionX;
        enemy.y = newEnemyPositionY;
        map[enemy.y][enemy.x] = tiles.ENEMY;
      }
    }
  }

  //Враги атакуют вокруг себя каждый ход.
  //Если игрок стоит близко, то убавляем здоровье
  function attackEverythingAroundEnemy(enemy) {
    const distanceX = Math.abs(enemy.x - playerPosition.x);
    const distanceY = Math.abs(enemy.y - playerPosition.y);

    if (distanceX <= 1 && distanceY <= 1) {
      playerEntity.health -= 1;
      healthBar()
    }
  }
  

  //Функция атаки всего вокруг игрока.
  function attackEnemies() {
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const distanceX = Math.abs(enemy.x - playerPosition.x);
      const distanceY = Math.abs(enemy.y - playerPosition.y);
      if (distanceX <= 1 && distanceY <= 1) {
        enemy.health -= playerEntity.attack;
        // Удаляем врага если его здоровье достигло нуля или меньше
        if (enemy.health <= 0) {
          map[enemy.y][enemy.x] = enemy.prevTile;
          // И удаляем его из списка.
          enemies.splice(i, 1);
          i--;
        }
      }
    }
  }

  moveEnemies();
  for (let i = 0; i < enemies.length; i++) {
    attackEverythingAroundEnemy(enemies[i]);
  }
  victoryCondition()
  drawMap();
}

//Отображаем здоровье игрока. Если здоровье достигает 0, то удаляем игрока с поля и дисплеим GAME OVER!
function healthBar() {
  const healthBar = document.querySelector(".health-bar");
  let hp = "";

  if (playerEntity.health > 0) {
    for (let i = 0; i < playerEntity.health; i++) {
      hp += "❤︎";
    }
  } 
  
  else {
    hp = "GAME OVER!";
    map[playerPosition.y][playerPosition.x] = tiles.FLOOR;
    playerEntity.dead = true;
    drawMap();
  }
  

  healthBar.innerHTML = hp;
}

//Тоже самое, только отображаем силу персонажа
function damageBar() {
  const damageBar = document.querySelector(".damageBar");
  let DMG = "";

  for (let i = 0; i < playerEntity.attack; i++) {
    DMG += "⚔️";
  }

  damageBar.innerHTML = DMG;
}



//Отрисовываем карту
function drawMap() {
  $('.field').empty();

  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const tile = $('<div class="tile"></div>');

      switch (map[y][x]) {
        case tiles.WALL:
          tile.addClass('tile-W');
          break;
        case tiles.FLOOR:
          tile.addClass('tile-empty');
          break;
        case tiles.PLAYER:
          tile.addClass('tile-P');

          //Добавляем здоровье над игроком
          const healthPercentage = (playerEntity.health / 10) *100;
          const healthBar = $(`<div class="health" style="width: ${healthPercentage}%; background-color: lime;"></div>`);
          tile.append(healthBar);
          break;
        case tiles.ENEMY:
          tile.addClass('tile-E');

          //Добавляем здоровье над врагами
          const enemy = enemies.find(enemy => enemy.x === x && enemy.y === y);
          const enemyHealthPercentage = (enemy.health / 3) *100;
          const enemyHealthBar = $(`<div class="health" style="width: ${enemyHealthPercentage}%;"></div>`);
          tile.append(enemyHealthBar);
          break;
        case tiles.HEALTH_POTION:
          tile.addClass('tile-HP');
          break;
        case tiles.SWORD:
          tile.addClass('tile-SW');
          break;
      }


      tile.css({
        top: y *50 + 'px',
        left: x* 50 + 'px',
      });
      $('.field').append(tile);
    }
  }
}

//Функция для отчищения данных карты. Нужна для правильной генерации.
function clearMap() {
  map.length = 0;
  emptyFloors.length = 0;
  enemies.length = 0;


  createMap();
  createRooms();
  createHallways();
  createEntities(10, 1, 10, 2);
}


//Загружаем карту полностью в первый раз. Если isAccessible = false, то загружаем карту по новой пока не станет true
$(document).ready(function () {
  createMap(); 
  emptyFloors.length = 0;
  createRooms();
  createHallways();
  createEntities(10, 1, 10, 2);
  drawMap();

  while (!isAccessible()) {
    clearMap();
  }
  drawMap();
  window.addEventListener('keydown', onKeyPress);
});
