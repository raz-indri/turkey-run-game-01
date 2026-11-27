/* Gobble Dash — art.js: every sprite is drawn with canvas paths.
   Original art: Tom the turkey, Farmer Bram, the farmyard, the barn,
   and the kitchen. No images, no copied art. */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  function ellipse(c, x, y, rx, ry, color) {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, TAU);
    c.fill();
  }

  function circle(c, x, y, r, color) {
    ellipse(c, x, y, r, r, color);
  }

  function feather(c, x, y, len, angle, color) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(0, -len / 2, len * 0.22, len / 2, 0, 0, TAU);
    c.fill();
    c.restore();
  }

  /* --- Tom the turkey. runPhase animates legs + bob; sliding ducks low. --- */
  function drawTurkey(c, x, y, runPhase, sliding, scared) {
    var bob = sliding ? 0 : Math.sin(runPhase) * 3;
    var bodyY = y + bob;
    c.save();
    c.translate(x, bodyY);
    if (sliding) c.scale(1.25, 0.62);

    // Tail feather fan
    var fanColors = ['#c1440e', '#e07b39', '#f2a541', '#8b5a2b', '#c1440e'];
    for (var i = 0; i < 5; i++) {
      feather(c, -26, -6, 46, -0.9 + i * 0.45, fanColors[i]);
    }
    // Body
    ellipse(c, 0, 0, 30, 24, '#7a4a21');
    ellipse(c, -4, 4, 22, 17, '#a06a35');
    // Wing
    c.fillStyle = '#5d3a1a';
    c.beginPath();
    c.ellipse(2, -2, 16, 10, -0.4, 0, TAU);
    c.fill();
    // Head + neck
    c.strokeStyle = '#c1440e';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(20, -14);
    c.quadraticCurveTo(28, -30, 26, -38);
    c.stroke();
    circle(c, 27, -42, 11, '#8b5a2b');
    // Beak
    c.fillStyle = '#f2a541';
    c.beginPath();
    c.moveTo(36, -44);
    c.lineTo(48, -40);
    c.lineTo(36, -36);
    c.closePath();
    c.fill();
    // Wattle
    c.fillStyle = '#d62828';
    c.beginPath();
    c.ellipse(33, -32, 4, 7, 0.3, 0, TAU);
    c.fill();
    // Eye (wide when scared)
    circle(c, 30, -45, scared ? 4.5 : 3, '#fff');
    circle(c, 31, -45, scared ? 2.2 : 1.6, '#1d1d1d');
    // Legs
    c.strokeStyle = '#f2a541';
    c.lineWidth = 4;
    var legSwing = sliding ? 0 : Math.sin(runPhase) * 10;
    c.beginPath();
    c.moveTo(-6, 20); c.lineTo(-6 + legSwing, 34);
    c.moveTo(8, 20); c.lineTo(8 - legSwing, 34);
    c.stroke();
    c.restore();
  }

  /* --- Farmer Bram, the chaser. Carries a carving knife when close. --- */
  function drawFarmer(c, x, y, runPhase, angry) {
    var bob = Math.abs(Math.sin(runPhase)) * -4;
    c.save();
    c.translate(x, y + bob);
    // Legs (overalls)
    c.strokeStyle = '#2f4d6d';
    c.lineWidth = 9;
    var swing = Math.sin(runPhase) * 12;
    c.beginPath();
    c.moveTo(-8, -34); c.lineTo(-8 + swing, 0);
    c.moveTo(8, -34); c.lineTo(8 - swing, 0);
    c.stroke();
    // Body: plaid shirt + overalls
    c.fillStyle = '#b23a2e';
    c.fillRect(-20, -78, 40, 48);
    c.fillStyle = '#2f4d6d';
    c.fillRect(-20, -52, 40, 24);
    c.fillStyle = '#f2d8a7';
    c.fillRect(-20, -80, 40, 8);
    // Arms reaching forward, one holding the carving knife
    c.strokeStyle = '#b23a2e';
    c.lineWidth = 8;
    c.beginPath();
    c.moveTo(14, -70); c.lineTo(34, -58 + Math.sin(runPhase) * 3);
    c.moveTo(-14, -70); c.lineTo(-30, -56);
    c.stroke();
    drawKnife(c, 40, -56 + Math.sin(runPhase) * 3, 0.5);
    // Head
    circle(c, 0, -92, 15, '#f2c89b');
    // Straw hat
    c.fillStyle = '#e8c95a';
    c.beginPath();
    c.ellipse(0, -100, 26, 7, 0, 0, TAU);
    c.fill();
    c.fillRect(-13, -114, 26, 14);
    // Angry brows + moustache
    c.strokeStyle = '#3d2314';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-9, -98); c.lineTo(-2, -94);
    c.moveTo(9, -98); c.lineTo(2, -94);
    c.stroke();
    c.fillStyle = '#3d2314';
    c.fillRect(-8, -86, 16, 4);
    if (angry) {
      c.fillStyle = '#d62828';
      c.font = 'bold 13px sans-serif';
      c.textAlign = 'center';
      c.fillText('!', 0, -122);
    }
    c.restore();
  }

  function drawKnife(c, x, y, angle) {
    c.save();
    c.translate(x, y);
    c.rotate(angle);
    // Handle
    c.fillStyle = '#4a2c14';
    c.fillRect(-14, -4, 16, 8);
    // Blade
    c.fillStyle = '#dfe6ea';
    c.beginPath();
    c.moveTo(2, -6);
    c.lineTo(30, -3);
    c.lineTo(34, 0);
    c.lineTo(30, 3);
    c.lineTo(2, 6);
    c.closePath();
    c.fill();
    c.strokeStyle = '#9aa5ab';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(4, 0);
    c.lineTo(30, 0);
    c.stroke();
    c.restore();
  }

  /* --- The oven: a squat iron box with a glowing door. --- */
  function drawOven(c, x, y, w, h) {
    c.fillStyle = '#3a3a3a';
    c.fillRect(x, y, w, h);
    c.fillStyle = '#555';
    c.fillRect(x + 6, y + 6, w - 12, h * 0.45);
    // Glowing door
    var glow = c.createLinearGradient(x, y, x, y + h);
    glow.addColorStop(0, '#ff9d00');
    glow.addColorStop(1, '#c1440e');
    c.fillStyle = glow;
    c.fillRect(x + 12, y + 12, w - 24, h * 0.32);
    c.strokeStyle = '#222';
    c.lineWidth = 3;
    c.strokeRect(x + 12, y + 12, w - 24, h * 0.32);
    // Heat wobble lines
    c.strokeStyle = 'rgba(255,157,0,0.8)';
    c.lineWidth = 2;
    for (var i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(x + 20 + i * 14, y - 6);
      c.quadraticCurveTo(x + 24 + i * 14, y - 14, x + 20 + i * 14, y - 20);
      c.stroke();
    }
    // Feet + dial
    c.fillStyle = '#222';
    c.fillRect(x + 4, y + h - 6, 8, 6);
    c.fillRect(x + w - 12, y + h - 6, 8, 6);
    circle(c, x + w / 2, y + h * 0.62, 6, '#f2d8a7');
  }

  function drawFence(c, x, y, w, h) {
    c.fillStyle = '#8b5a2b';
    c.fillRect(x, y + h * 0.25, w, 8);
    c.fillRect(x, y + h * 0.65, w, 8);
    for (var i = 0; i < 3; i++) {
      c.fillRect(x + 6 + i * (w - 12) / 2 - 4, y, 8, h);
    }
  }

  function drawHayBale(c, x, y, r) {
    circle(c, x, y, r, '#e8c95a');
    c.strokeStyle = '#b98a1e';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(x, y, r * 0.65, 0, TAU);
    c.stroke();
    c.beginPath();
    c.arc(x, y, r * 0.3, 0, TAU);
    c.stroke();
  }

  function drawCorn(c, x, y, bob) {
    c.save();
    c.translate(x, y + bob);
    c.rotate(0.5);
    ellipse(c, 0, 0, 9, 16, '#ffd23f');
    c.strokeStyle = '#e8a91c';
    c.lineWidth = 1.5;
    for (var i = -1; i <= 1; i++) {
      c.beginPath();
      c.moveTo(i * 5, -12);
      c.lineTo(i * 5, 12);
      c.stroke();
    }
    c.fillStyle = '#7fb069';
    c.beginPath();
    c.moveTo(-8, 12);
    c.lineTo(0, 26);
    c.lineTo(8, 12);
    c.closePath();
    c.fill();
    c.restore();
  }

  /* --- Backgrounds: farmyard, barn, kitchen. Parallax by scrollX. --- */
  function drawSky(c, w, h, stage) {
    var sky = c.createLinearGradient(0, 0, 0, h);
    if (stage === 2) {
      sky.addColorStop(0, '#7a4a2b');
      sky.addColorStop(0.6, '#a8642f');
      sky.addColorStop(1, '#c97e3a');
    } else {
      sky.addColorStop(0, '#f7b267');
      sky.addColorStop(0.55, '#f4845f');
      sky.addColorStop(1, '#e76f51');
    }
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    // Low autumn sun
    var sun = c.createRadialGradient(1080, 120, 10, 1080, 120, 130);
    sun.addColorStop(0, 'rgba(255,240,180,0.95)');
    sun.addColorStop(1, 'rgba(255,240,180,0)');
    c.fillStyle = sun;
    c.fillRect(900, 0, 360, 260);
    circle(c, 1080, 120, 46, '#ffe9a8');
  }

  function drawClouds(c, scrollX, w) {
    c.fillStyle = 'rgba(255,244,220,0.85)';
    for (var i = 0; i < 4; i++) {
      var cx = ((i * 340 - scrollX * 0.15) % (w + 200) + w + 200) % (w + 200) - 100;
      ellipse(c, cx, 80 + (i % 2) * 46, 52, 18, 'rgba(255,244,220,0.85)');
      ellipse(c, cx + 34, 88 + (i % 2) * 46, 38, 15, 'rgba(255,244,220,0.85)');
    }
  }

  function drawFarmyard(c, scrollX, w, groundY) {
    // Rolling hills
    c.fillStyle = '#c97e3a';
    c.beginPath();
    c.moveTo(0, groundY - 60);
    for (var x = 0; x <= w; x += 40) {
      c.lineTo(x, groundY - 60 + Math.sin((x + scrollX * 0.4) * 0.008) * 22);
    }
    c.lineTo(w, groundY);
    c.lineTo(0, groundY);
    c.closePath();
    c.fill();
    // Barn silhouette
    var bx = 900 - ((scrollX * 0.5) % 1600);
    c.fillStyle = '#8b2f23';
    c.fillRect(bx, groundY - 190, 170, 190);
    c.beginPath();
    c.moveTo(bx - 12, groundY - 190);
    c.lineTo(bx + 85, groundY - 250);
    c.lineTo(bx + 182, groundY - 190);
    c.closePath();
    c.fillStyle = '#5d1d15';
    c.fill();
    c.fillStyle = '#f2d8a7';
    c.fillRect(bx + 66, groundY - 90, 38, 90);
    // Pumpkins + fence posts along the ground
    for (var i = 0; i < 8; i++) {
      var px = ((i * 220 - scrollX * 0.8) % (w + 240) + w + 240) % (w + 240) - 120;
      circle(c, px, groundY - 12, 14, '#e07b39');
      c.strokeStyle = '#7fb069';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(px, groundY - 24);
      c.lineTo(px + 4, groundY - 34);
      c.stroke();
      c.fillStyle = '#8b5a2b';
      c.fillRect(px + 90, groundY - 46, 8, 46);
    }
  }

  function drawBarnInterior(c, w, groundY) {
    c.fillStyle = '#6b4423';
    c.fillRect(0, 0, w, groundY);
    c.fillStyle = '#7d5230';
    for (var i = 0; i < 14; i++) {
      c.fillRect(i * 96, 0, 6, groundY);
    }
    // Hanging lanterns
    for (var j = 0; j < 4; j++) {
      var lx = 160 + j * 320;
      c.strokeStyle = '#3d2314';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(lx, 0);
      c.lineTo(lx, 70);
      c.stroke();
      var glow = c.createRadialGradient(lx, 92, 4, lx, 92, 60);
      glow.addColorStop(0, 'rgba(255,200,90,0.9)');
      glow.addColorStop(1, 'rgba(255,200,90,0)');
      c.fillStyle = glow;
      c.fillRect(lx - 60, 32, 120, 120);
      c.fillStyle = '#f2a541';
      c.fillRect(lx - 12, 78, 24, 30);
    }
    // Hay bales stacked at the back
    drawHayBale(c, 120, groundY - 30, 34);
    drawHayBale(c, 1160, groundY - 30, 34);
  }

  function drawKitchen(c, w, groundY) {
    // Tiled wall
    c.fillStyle = '#f2e3c6';
    c.fillRect(0, 0, w, groundY);
    c.strokeStyle = '#d9c49a';
    c.lineWidth = 2;
    for (var i = 0; i < 16; i++) {
      c.beginPath();
      c.moveTo(i * 84, 0);
      c.lineTo(i * 84, groundY);
      c.stroke();
    }
    for (var j = 0; j < 6; j++) {
      c.beginPath();
      c.moveTo(0, j * 84);
      c.lineTo(w, j * 84);
      c.stroke();
    }
    // Counter with pots + a pie
    c.fillStyle = '#8b5a2b';
    c.fillRect(0, groundY - 120, w, 120);
    c.fillStyle = '#a06a35';
    c.fillRect(0, groundY - 120, w, 12);
    c.fillStyle = '#3a3a3a';
    c.fillRect(120, groundY - 168, 90, 48);
    c.fillRect(1060, groundY - 168, 90, 48);
    circle(c, 640, groundY - 138, 34, '#e07b39');
    c.fillStyle = '#c1440e';
    c.beginPath();
    c.arc(640, groundY - 138, 22, 0, TAU);
    c.fill();
    // Window with night sky
    c.fillStyle = '#2f4d6d';
    c.fillRect(880, 60, 180, 140);
    c.fillStyle = '#ffe9a8';
    circle(c, 940, 110, 16, '#ffe9a8');
    c.strokeStyle = '#f2e3c6';
    c.lineWidth = 6;
    c.strokeRect(880, 60, 180, 140);
    c.beginPath();
    c.moveTo(970, 60); c.lineTo(970, 200);
    c.moveTo(880, 130); c.lineTo(1060, 130);
    c.stroke();
  }

  function drawGround(c, w, groundY, h, stage) {
    var g = c.createLinearGradient(0, groundY, 0, h);
    if (stage === 2) {
      g.addColorStop(0, '#9c6b30');
      g.addColorStop(1, '#6b4423');
    } else {
      g.addColorStop(0, '#d9a05b');
      g.addColorStop(1, '#a8642f');
    }
    c.fillStyle = g;
    c.fillRect(0, groundY, w, h - groundY);
    // Ground speckles
    c.fillStyle = 'rgba(0,0,0,0.12)';
    for (var i = 0; i < 40; i++) {
      var sx = (i * 173) % w;
      c.fillRect(sx, groundY + 12 + (i * 37) % 50, 14, 4);
    }
  }

  window.GobbleArt = {
    drawTurkey: drawTurkey,
    drawFarmer: drawFarmer,
    drawKnife: drawKnife,
    drawOven: drawOven,
    drawFence: drawFence,
    drawHayBale: drawHayBale,
    drawCorn: drawCorn,
    drawSky: drawSky,
    drawClouds: drawClouds,
    drawFarmyard: drawFarmyard,
    drawBarnInterior: drawBarnInterior,
    drawKitchen: drawKitchen,
    drawGround: drawGround
  };
})();
