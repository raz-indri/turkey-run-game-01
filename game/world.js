/* Gobble Dash — world.js: stages, obstacles and spawning.
   Three stages grow harder as Tom runs: the farmyard, the barn,
   then the kitchen — the oven and the carving knife wait there. */
(function () {
  'use strict';

  // Lane ground positions (canvas 1280x720, ground line at 650).
  // Lanes sit close to the ground so the turkey and obstacles read as
  // running on the dirt, not floating above it.
  var LANES = [530, 585, 640];
  var GROUND_Y = 650;

  var STAGES = [
    {
      name: 'THE FARMYARD',
      sub: 'Dawn breaks over the farm. Run, Tom, run!',
      from: 0,
      speed: 420,
      spawnEvery: 1.2,
      obstacles: ['fence', 'hay', 'cornRow'],
      bg: 0
    },
    {
      name: 'THE BARN',
      sub: 'Bram is closing in. Mind the hay — and the knives.',
      from: 400,
      speed: 520,
      spawnEvery: 0.9,
      obstacles: ['fence', 'hay', 'knife', 'cornRow'],
      bg: 1
    },
    {
      name: 'THE KITCHEN',
      sub: 'The oven is hot and the carving knife is out. Almost free!',
      from: 800,
      speed: 620,
      spawnEvery: 0.78,
      obstacles: ['oven', 'knife', 'fence', 'cornRow'],
      bg: 2
    }
  ];

  var ESCAPE_DISTANCE = 1200;

  function stageFor(distance) {
    var s = STAGES[0];
    for (var i = 0; i < STAGES.length; i++) {
      if (distance >= STAGES[i].from) s = STAGES[i];
    }
    return s;
  }

  function stageIndexFor(distance) {
    var idx = 0;
    for (var i = 0; i < STAGES.length; i++) {
      if (distance >= STAGES[i].from) idx = i;
    }
    return idx;
  }

  function pickObstacle(stage, rng) {
    var list = stage.obstacles;
    return list[Math.floor(rng() * list.length)];
  }

  // Build one obstacle (or a corn row) at the right edge of the screen.
  function spawnObstacle(stage, rng) {
    var kind = pickObstacle(stage, rng);
    var lane = Math.floor(rng() * 3);
    var x = 1320;
    if (kind === 'cornRow') {
      var corns = [];
      for (var i = 0; i < 4; i++) {
        corns.push({ x: x + i * 46, lane: lane, taken: false });
      }
      return { kind: 'cornRow', x: x, lane: lane, corns: corns, w: 200, h: 40 };
    }
    if (kind === 'oven') {
      return { kind: 'oven', x: x, lane: lane, w: 74, h: 96, passed: false };
    }
    if (kind === 'knife') {
      // A carving knife slashes across one lane, low enough to slide under.
      return { kind: 'knife', x: x, lane: lane, w: 90, h: 26, passed: false, spin: rng() * 6.28 };
    }
    if (kind === 'fence') {
      return { kind: 'fence', x: x, lane: lane, w: 60, h: 74, passed: false };
    }
    return { kind: 'hay', x: x, lane: lane, w: 64, h: 64, passed: false };
  }

  // Where an obstacle sits vertically, by kind and lane.
  function obstacleY(ob) {
    var laneY = LANES[ob.lane];
    if (ob.kind === 'oven') return laneY - 96;
    if (ob.kind === 'knife') return laneY - 66;
    if (ob.kind === 'fence') return laneY - 74;
    if (ob.kind === 'hay') return laneY - 64;
    return laneY - 40;
  }

  function obstacleTop(ob) { return obstacleY(ob); }
  function obstacleBottom(ob) { return obstacleY(ob) + ob.h; }

  window.GobbleWorld = {
    LANES: LANES,
    GROUND_Y: GROUND_Y,
    STAGES: STAGES,
    ESCAPE_DISTANCE: ESCAPE_DISTANCE,
    stageFor: stageFor,
    stageIndexFor: stageIndexFor,
    spawnObstacle: spawnObstacle,
    obstacleY: obstacleY,
    obstacleTop: obstacleTop,
    obstacleBottom: obstacleBottom
  };
})();
