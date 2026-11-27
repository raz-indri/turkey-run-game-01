/* Gobble Dash — game.js: the run itself.
   Tom the turkey flees Farmer Bram across the farmyard, the barn and
   the kitchen. Jump, slide and switch lanes; dodge the oven and the
   carving knife; grab corn; reach the Freedom Woods at 1200 m. */
(function () {
  'use strict';

  var canvas = document.getElementById('game');
  var ctx = canvas.getContext('2d');
  var W = 1280, H = 720;
  var S = window.GobbleSound;
  var A = window.GobbleArt;
  var WD = window.GobbleWorld;

  var TURKEY_X = 230;
  var GRAVITY = 2400;
  var JUMP_V = -880;

  var state = 'title'; // title | playing | paused | caught | escaped
  var turkey, farmerGap, score, distance, lives, speed;
  var obstacles, spawnTimer, runPhase, scrollX, banner, bannerT;
  var invulnT, slideT, shakeT, best, mutedNote;
  var buttons = [];
  var shotMode = null;
  var shotTime = 0;

  function loadBest() {
    try { return parseInt(window.localStorage.getItem('gobbleDashBest') || '0', 10) || 0; }
    catch (e) { return 0; }
  }
  function saveBest() {
    try { window.localStorage.setItem('gobbleDashBest', String(best)); } catch (e) { /* offline play */ }
  }
  best = loadBest();

  function resetRun() {
    turkey = { lane: 1, y: WD.LANES[1], vy: 0, jumping: false, sliding: false };
    farmerGap = 300;
    score = 0;
    distance = 0;
    lives = 3;
    speed = WD.STAGES[0].speed;
    obstacles = [];
    spawnTimer = 0.6;
    runPhase = 0;
    scrollX = 0;
    banner = WD.STAGES[0];
    bannerT = 2.2;
    invulnT = 0;
    slideT = 0;
    shakeT = 0;
  }
  resetRun();

  /* ---------- input ---------- */
  var keys = {};
  window.addEventListener('keydown', function (e) {
    if (e.repeat) return;
    keys[e.code] = true;
    S.unlock();
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      if (state === 'title') startGame();
      else if (state === 'caught' || state === 'escaped') startGame();
      else if (state === 'playing') jumpTurkey();
    }
    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      if (state === 'playing') slideTurkey();
      else if (state === 'title') startGame();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') switchLane(-1);
    if (e.code === 'ArrowRight' || e.code === 'KeyD') switchLane(1);
    if (e.code === 'KeyP' && (state === 'playing' || state === 'paused')) {
      state = state === 'playing' ? 'paused' : 'playing';
    }
    if (e.code === 'KeyM') { mutedNote = S.toggleMute() ? 'SOUND OFF (M)' : 'SOUND ON (M)'; }
    if (e.code === 'Enter' && state !== 'playing') startGame();
  });
  window.addEventListener('keyup', function (e) { keys[e.code] = false; });

  function canvasPos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }
  canvas.addEventListener('click', function (e) {
    S.unlock();
    var p = canvasPos(e);
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
        b.action();
        return;
      }
    }
    if (state === 'playing') jumpTurkey();
  });

  function startGame() {
    resetRun();
    state = 'playing';
    S.gobble();
    S.startMusic();
  }

  function jumpTurkey() {
    if (!turkey.jumping) {
      turkey.jumping = true;
      turkey.vy = JUMP_V;
      turkey.sliding = false;
      slideT = 0;
      S.jump();
    }
  }

  function slideTurkey() {
    if (!turkey.jumping) {
      turkey.sliding = true;
      slideT = 0.55;
      S.slide();
    }
  }

  function switchLane(dir) {
    if (state !== 'playing') return;
    var next = turkey.lane + dir;
    if (next >= 0 && next <= 2) {
      turkey.lane = next;
      S.jump();
    }
  }

  /* ---------- update ---------- */
  function update(dt) {
    if (state !== 'playing') return;
    runPhase += dt * 11;
    scrollX += speed * dt;
    distance += (speed * dt) / 42;
    score += speed * dt * 0.12;

    var stage = WD.stageFor(distance);
    speed = stage.speed;
    if (WD.stageIndexFor(distance) !== WD.stageIndexFor(distance - (speed * dt) / 42)) {
      banner = stage;
      bannerT = 2.4;
      S.spotted();
    }
    if (bannerT > 0) bannerT -= dt;
    if (mutedNote) mutedNote = null;

    // Farmer: gains on every stumble, slowly falls behind on a clean run.
    if (invulnT <= 0) farmerGap = Math.min(420, farmerGap + 9 * dt);
    else invulnT -= dt;
    if (farmerGap <= 46) return endRun('caught');
    if (slideT > 0) {
      slideT -= dt;
      if (slideT <= 0) turkey.sliding = false;
    }

    // Turkey vertical physics
    if (turkey.jumping) {
      turkey.vy += GRAVITY * dt;
      turkey.y += turkey.vy * dt;
      if (turkey.y >= WD.LANES[turkey.lane]) {
        turkey.y = WD.LANES[turkey.lane];
        turkey.jumping = false;
        turkey.vy = 0;
      }
    } else {
      // Glide toward the current lane line.
      var target = WD.LANES[turkey.lane];
      turkey.y += (target - turkey.y) * Math.min(1, dt * 14);
    }

    // Spawning
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      obstacles.push(WD.spawnObstacle(stage, Math.random));
      spawnTimer = stage.spawnEvery * (0.85 + Math.random() * 0.3);
    }

    // Move + collide
    var tBox = turkeyBox();
    for (var i = obstacles.length - 1; i >= 0; i--) {
      var ob = obstacles[i];
      ob.x -= speed * dt;
      if (ob.kind === 'cornRow') {
        for (var j = 0; j < ob.corns.length; j++) {
          var c = ob.corns[j];
          if (!c.taken && Math.abs(c.x - TURKEY_X) < 42 && c.lane === turkey.lane &&
              Math.abs(turkey.y - WD.LANES[c.lane]) < 46) {
            c.taken = true;
            score += 50;
            S.corn();
          }
        }
        if (ob.x + ob.w < -40) obstacles.splice(i, 1);
        continue;
      }
      if (ob.x + ob.w < -40) { obstacles.splice(i, 1); continue; }
      if (!ob.passed && ob.x + ob.w < TURKEY_X - 30) {
        ob.passed = true;
        score += 25;
      }
      if (invulnT > 0) continue;
      var oTop = WD.obstacleTop(ob), oBot = WD.obstacleBottom(ob);
      var overlapX = ob.x < TURKEY_X + 26 && ob.x + ob.w > TURKEY_X - 26;
      var overlapY = tBox.top < oBot - 6 && tBox.bottom > oTop + 6;
      var sameLane = ob.lane === turkey.lane;
      if (overlapX && overlapY && sameLane) {
        // Sliding ducks under a slashing knife; jumping clears low fences.
        if (ob.kind === 'knife' && turkey.sliding) continue;
        if ((ob.kind === 'fence' || ob.kind === 'hay') && turkey.jumping && tBox.bottom < oTop + 26) continue;
        stumble(ob);
      }
    }

    if (distance >= WD.ESCAPE_DISTANCE) return endRun('escaped');
    if (shakeT > 0) shakeT -= dt;
  }

  function turkeyBox() {
    var h = turkey.sliding ? 30 : 62;
    return { top: turkey.y - h, bottom: turkey.y + 8 };
  }

  function stumble(ob) {
    lives -= 1;
    farmerGap -= 95;
    invulnT = 1.4;
    shakeT = 0.35;
    S.thud();
    if (ob.kind === 'oven') S.spotted();
    if (lives <= 0) endRun('caught');
  }

  function endRun(how) {
    state = how;
    S.stopMusic();
    if (how === 'escaped') S.fanfare();
    else S.caught();
    if (Math.floor(score) > best) { best = Math.floor(score); saveBest(); }
  }

  /* ---------- drawing ---------- */
  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawButton(label, x, y, w, h, action, primary) {
    ctx.fillStyle = primary ? '#c1440e' : 'rgba(43,26,14,0.85)';
    roundRect(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffe9c4';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 26px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    buttons.push({ x: x, y: y, w: w, h: h, action: action });
  }

  function drawBackground(stageIdx) {
    var stage = WD.STAGES[stageIdx];
    A.drawSky(ctx, W, H, stageIdx);
    if (stageIdx !== 2) A.drawClouds(ctx, scrollX, W);
    if (stage.bg === 0) A.drawFarmyard(ctx, scrollX, W, WD.GROUND_Y);
    else if (stage.bg === 1) A.drawBarnInterior(ctx, W, WD.GROUND_Y);
    else A.drawKitchen(ctx, W, WD.GROUND_Y);
    A.drawGround(ctx, W, WD.GROUND_Y, H, stageIdx);
  }

  function drawShadow(x, groundY, rx, alpha) {
    ctx.fillStyle = 'rgba(43,26,14,' + alpha + ')';
    ctx.beginPath();
    ctx.ellipse(x, groundY, rx, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawObstacles() {
    for (var i = 0; i < obstacles.length; i++) {
      var ob = obstacles[i];
      var y = WD.obstacleY(ob);
      // Contact shadow grounds each obstacle on its lane.
      if (ob.kind !== 'cornRow') drawShadow(ob.x + ob.w / 2, WD.LANES[ob.lane] + 30, ob.w / 2 + 6, 0.25);
      if (ob.kind === 'oven') A.drawOven(ctx, ob.x, y, ob.w, ob.h);
      else if (ob.kind === 'knife') {
        ctx.save();
        ctx.translate(ob.x + ob.w / 2, y + 14);
        ctx.rotate(Math.sin(runPhase * 0.4 + ob.spin) * 0.25);
        A.drawKnife(ctx, 0, 0, 0.12);
        ctx.restore();
        ctx.fillStyle = 'rgba(214,40,40,0.9)';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', ob.x + ob.w / 2, y - 8);
      }
      else if (ob.kind === 'fence') A.drawFence(ctx, ob.x, y, ob.w, ob.h);
      else if (ob.kind === 'hay') A.drawHayBale(ctx, ob.x + ob.w / 2, y + ob.h / 2 + 8, 34);
      else if (ob.kind === 'cornRow') {
        for (var j = 0; j < ob.corns.length; j++) {
          var c = ob.corns[j];
          if (!c.taken) {
            drawShadow(c.x, WD.LANES[c.lane] + 30, 12, 0.18);
            A.drawCorn(ctx, c.x, WD.LANES[c.lane] - 18, Math.sin(runPhase + j) * 3);
          }
        }
      }
    }
  }

  function drawHUD() {
    // Top bar
    ctx.fillStyle = 'rgba(43,26,14,0.72)';
    roundRect(ctx, 16, 14, 1248, 54, 12);
    ctx.fill();
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 24px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCORE ' + Math.floor(score), 36, 42);
    ctx.fillText('DIST ' + Math.floor(distance) + ' m / ' + WD.ESCAPE_DISTANCE + ' m', 300, 42);
    ctx.fillText(WD.stageFor(distance).name, 660, 42);
    // Lives as little hearts
    ctx.textAlign = 'right';
    var hearts = '';
    for (var i = 0; i < 3; i++) hearts += (i < lives ? '♥' : '♡') + ' ';
    ctx.fillStyle = lives === 1 ? '#ff6b6b' : '#ffe9c4';
    ctx.fillText(hearts, 1240, 42);

    // Farmer proximity warning
    if (farmerGap < 130 && state === 'playing') {
      ctx.fillStyle = '#d62828';
      ctx.font = 'bold 30px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BRAM IS RIGHT BEHIND YOU!', W / 2, 108);
    }
    // Stage banner
    if (bannerT > 0) {
      ctx.globalAlpha = Math.min(1, bannerT);
      ctx.fillStyle = 'rgba(43,26,14,0.6)';
      roundRect(ctx, W / 2 - 330, 200, 660, 110, 16);
      ctx.fill();
      ctx.fillStyle = '#ffd23f';
      ctx.font = 'bold 44px "Trebuchet MS", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(banner.name, W / 2, 240);
      ctx.fillStyle = '#ffe9c4';
      ctx.font = '20px "Trebuchet MS", sans-serif';
      ctx.fillText(banner.sub, W / 2, 278);
      ctx.globalAlpha = 1;
    }
    // Distance progress bar
    ctx.fillStyle = 'rgba(43,26,14,0.72)';
    roundRect(ctx, 16, 682, 1248, 20, 10);
    ctx.fill();
    ctx.fillStyle = '#7fb069';
    var pw = 1248 * Math.min(1, distance / WD.ESCAPE_DISTANCE);
    roundRect(ctx, 16, 682, Math.max(20, pw), 20, 10);
    ctx.fill();
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('FREEDOM WOODS →', 1252, 676);
  }

  function drawTitle() {
    drawBackground(0);
    // Big friendly turkey on the title screen, feet on the ground.
    drawShadow(1020, 642, 40, 0.3);
    A.drawTurkey(ctx, 1020, 606, 1.2, false, false);
    A.drawFarmer(ctx, 180, 640, 0.6, true);
    ctx.fillStyle = 'rgba(43,26,14,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 92px "Trebuchet MS", sans-serif';
    ctx.fillText('GOBBLE DASH', W / 2, 150);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 34px "Trebuchet MS", sans-serif';
    ctx.fillText('The Great Turkey Escape', W / 2, 205);
    ctx.font = '21px "Trebuchet MS", sans-serif';
    ctx.fillText('Thanksgiving dinner is tonight — and YOU are the main course.', W / 2, 262);
    ctx.fillText('Outrun Farmer Bram from the farmyard to the Freedom Woods.', W / 2, 292);
    ctx.fillText('Dodge the oven and the carving knife. Grab corn. Don\'t get caught!', W / 2, 322);
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif';
    ctx.fillStyle = '#ffd23f';
    ctx.fillText('← → switch lane · SPACE jump · ↓ slide · P pause · M mute', W / 2, 380);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = '19px "Trebuchet MS", sans-serif';
    ctx.fillText('Best score: ' + best, W / 2, 414);
    drawButton('▶  START THE ESCAPE', W / 2 - 190, 450, 380, 64, startGame, true);
  }

  function drawPaused() {
    drawBackground(WD.stageIndexFor(distance));
    drawObstacles();
    A.drawTurkey(ctx, TURKEY_X, turkey.y, runPhase, turkey.sliding, false);
    ctx.fillStyle = 'rgba(43,26,14,0.6)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe9c4';
    ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, 330);
    ctx.font = '22px "Trebuchet MS", sans-serif';
    ctx.fillText('Press P to keep running', W / 2, 380);
  }

  function drawEnd(escaped) {
    drawBackground(escaped ? 0 : WD.stageIndexFor(distance));
    ctx.fillStyle = escaped ? 'rgba(30,80,30,0.28)' : 'rgba(60,10,10,0.5)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    if (escaped) {
      A.drawTurkey(ctx, W / 2, 300, 1.0, false, false);
      ctx.fillStyle = '#7fb069';
      ctx.font = 'bold 84px "Trebuchet MS", sans-serif';
      ctx.fillText('ESCAPED!', W / 2, 150);
      ctx.fillStyle = '#ffe9c4';
      ctx.font = '26px "Trebuchet MS", sans-serif';
      ctx.fillText('Tom made it to the Freedom Woods. No turkey dinner tonight!', W / 2, 420);
      ctx.fillText('Bram is still looking under the porch.', W / 2, 456);
    } else {
      drawShadow(W / 2 - 120, 676, 44, 0.3);
      drawShadow(W / 2 + 130, 642, 40, 0.3);
      A.drawFarmer(ctx, W / 2 - 120, 640, 0.4, true);
      A.drawTurkey(ctx, W / 2 + 130, 606, 0, false, true);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = 'bold 84px "Trebuchet MS", sans-serif';
      ctx.fillText('CAUGHT!', W / 2, 150);
      ctx.fillStyle = '#ffe9c4';
      ctx.font = '26px "Trebuchet MS", sans-serif';
      ctx.fillText('Farmer Bram got his turkey. The oven was already hot…', W / 2, 420);
      ctx.fillText('Shake it off and run again — the woods are waiting.', W / 2, 456);
    }
    ctx.font = 'bold 28px "Trebuchet MS", sans-serif';
    ctx.fillText('Score ' + Math.floor(score) + '   ·   Distance ' + Math.floor(distance) + ' m   ·   Best ' + best, W / 2, 520);
    drawButton('↻  RUN AGAIN', W / 2 - 150, 560, 300, 60, startGame, true);
  }

  function draw() {
    ctx.save();
    if (shakeT > 0) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    }
    buttons = [];
    if (state === 'title') { drawTitle(); }
    else if (state === 'paused') { drawPaused(); }
    else if (state === 'caught') { drawEnd(false); }
    else if (state === 'escaped') { drawEnd(true); }
    else {
      drawBackground(WD.stageIndexFor(distance));
      drawObstacles();
      // Farmer chases from the left; gap shown in pixels.
      var farmerX = TURKEY_X - farmerGap;
      if (farmerX > -80) A.drawFarmer(ctx, farmerX, WD.GROUND_Y, runPhase, farmerGap < 130);
      // Turkey, blinking while invulnerable after a stumble.
      // Contact shadow stays on the lane and shrinks as the jump rises.
      var laneGround = WD.LANES[turkey.lane] + 36;
      var jumpH = Math.max(0, WD.LANES[turkey.lane] - turkey.y);
      drawShadow(TURKEY_X, laneGround, 34 * (1 - jumpH / 700), 0.28 * Math.max(0.3, 1 - jumpH / 260));
      if (invulnT <= 0 || Math.floor(invulnT * 10) % 2 === 0) {
        A.drawTurkey(ctx, TURKEY_X, turkey.y, runPhase, turkey.sliding, farmerGap < 130);
      }
      drawHUD();
    }
    ctx.restore();
  }

  /* ---------- screenshot modes (real renders of this game) ----------
     ?shot=title | play | danger | caught | escaped
     The scene is staged, then frozen after half a second so the
     screenshot is a stable frame of the live game. */
  function applyShotMode() {
    var q = new URLSearchParams(window.location.search);
    shotMode = q.get('shot');
    if (!shotMode) return;
    if (shotMode === 'title') { state = 'title'; }
    else if (shotMode === 'play') {
      state = 'playing';
      distance = 260; score = 1340;
      obstacles = [
        { kind: 'fence', x: 700, lane: 1, w: 60, h: 74, passed: false },
        { kind: 'hay', x: 950, lane: 2, w: 64, h: 64, passed: false },
        { kind: 'cornRow', x: 560, lane: 0, w: 200, h: 40,
          corns: [
            { x: 560, lane: 0, taken: false }, { x: 606, lane: 0, taken: false },
            { x: 652, lane: 0, taken: true }, { x: 698, lane: 0, taken: false }
          ] }
      ];
      bannerT = 0;
    }
    else if (shotMode === 'danger') {
      state = 'playing';
      distance = 905; score = 4210;
      farmerGap = 78;
      obstacles = [
        { kind: 'oven', x: 640, lane: 1, w: 74, h: 96, passed: false },
        { kind: 'knife', x: 880, lane: 1, w: 90, h: 26, passed: false, spin: 1.2 },
        { kind: 'fence', x: 1080, lane: 0, w: 60, h: 74, passed: false }
      ];
      banner = WD.STAGES[2];
      bannerT = 1.8;
    }
    else if (shotMode === 'caught') {
      state = 'caught';
      distance = 612; score = 2870; lives = 0;
      best = Math.max(best, 2870);
    }
    else if (shotMode === 'escaped') {
      state = 'escaped';
      distance = 1200; score = 9840;
      best = Math.max(best, 9840);
    }
  }

  /* Debug handle for playtesting: read-only snapshot of the run. */
  window.__gobble = {
    debug: function () {
      return {
        state: state,
        farmerGap: Math.round(farmerGap),
        distance: Math.round(distance),
        score: Math.floor(score),
        lives: lives,
        turkeyLane: turkey.lane,
        turkeyY: Math.round(turkey.y),
        obstacles: obstacles.length,
        speed: Math.round(speed)
      };
    }
  };

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (shotMode) {
      shotTime += dt;
      if (shotTime < 0.5) update(dt);
    } else {
      update(dt);
    }
    draw();
    requestAnimationFrame(frame);
  }

  applyShotMode();
  requestAnimationFrame(frame);
})();
