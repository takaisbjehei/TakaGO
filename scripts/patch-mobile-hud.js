const fs = require('fs');
const path = require('path');

const gameHtmlPath = path.join(__dirname, '..', 'game.html');
let html = fs.readFileSync(gameHtmlPath, 'utf8');

const targetStart = '  /* Portrait rotation banner to prompt playing in horizontal */';
const targetEnd = '</body></html>';

const startIndex = html.indexOf(targetStart);
if (startIndex === -1) {
  throw new Error('Could not find targetStart in game.html');
}

const replacement = `  /* Top Bar (Fullscreen & Custom HUD) */
  #taka-top-controls {
    pointer-events: auto;
    position: absolute;
    top: 10px;
    left: 14px;
    display: flex;
    gap: 8px;
    z-index: 10000;
  }
  .taka-top-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: rgba(15, 23, 42, 0.78);
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    color: #f8fafc;
    border-radius: 8px;
    padding: 6px 11px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
    transition: background 0.15s ease, transform 0.1s ease;
  }
  .taka-top-btn:active {
    transform: scale(0.95);
    background: rgba(255, 120, 40, 0.85);
  }

  /* HUD Layout Customizer Toolbar */
  #taka-hud-toolbar {
    display: none;
    pointer-events: auto;
    position: absolute;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(15, 23, 42, 0.95);
    border: 2px solid #ff7828;
    box-shadow: 0 4px 20px rgba(255, 120, 40, 0.45);
    border-radius: 12px;
    padding: 6px 14px;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    z-index: 10002;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }
  .hud-edit-tip {
    font-size: 11px;
    font-weight: 800;
    color: #ffaa40;
    letter-spacing: 0.8px;
  }
  .hud-edit-actions {
    display: flex;
    gap: 8px;
  }
  .hud-action-btn {
    pointer-events: auto;
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.35);
    color: #fff;
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
  }
  .hud-save-btn {
    background: #ff7828;
    border-color: #ffaa40;
    color: #fff;
  }
  .hud-save-btn:active {
    background: #ea580c;
  }

  /* Outline indicator on movable controls while in edit mode */
  body.taka-hud-editing .taka-action-btn,
  body.taka-hud-editing #taka-joystick-base {
    outline: 2px dashed #ffaa40 !important;
    outline-offset: 3px;
    cursor: move !important;
    animation: taka-hud-glow 1.5s infinite alternate;
  }
  @keyframes taka-hud-glow {
    0% { outline-color: #ff7828; box-shadow: 0 0 8px rgba(255, 120, 40, 0.5); }
    100% { outline-color: #facc15; box-shadow: 0 0 16px rgba(250, 204, 21, 0.7); }
  }

  /* Portrait rotation banner to prompt playing in horizontal */
  @media screen and (orientation: portrait) and (max-width: 900px) {
    #taka-rotate-prompt {
      display: flex !important;
    }
  }
  #taka-rotate-prompt {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 99999;
    background: rgba(10, 15, 25, 0.96);
    color: #ffffff;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  }
  #taka-rotate-prompt .rotate-icon {
    width: 56px;
    height: 56px;
    margin-bottom: 16px;
    animation: taka-rotate-spin 2s ease-in-out infinite alternate;
  }
  @keyframes taka-rotate-spin {
    0% { transform: rotate(0deg); }
    50% { transform: rotate(-90deg); }
    100% { transform: rotate(-90deg); }
  }
</style>

<div id="taka-rotate-prompt">
  <svg class="rotate-icon" viewBox="0 0 24 24" fill="none" stroke="#ff7828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
    <path d="M12 18h.01"></path>
  </svg>
  <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;">Rotate Device</h2>
  <p style="margin:0;font-size:14px;color:#94a3b8;max-width:280px;">Please rotate your phone to landscape (horizontal) to play TakaGO.</p>
</div>

<div id="taka-mobile-controls">
  <!-- Top Bar: Fullscreen & Custom HUD -->
  <div id="taka-top-controls">
    <button id="taka-btn-fullscreen" class="taka-top-btn" type="button" aria-label="Toggle Fullscreen">
      <svg id="taka-fs-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
      </svg>
      <span id="taka-fs-label">FULLSCREEN</span>
    </button>
    <button id="taka-btn-customize" class="taka-top-btn" type="button" aria-label="Customize Controls Layout">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      <span>CUSTOM HUD</span>
    </button>
  </div>

  <!-- HUD Layout Customizer Toolbar (Active in edit mode) -->
  <div id="taka-hud-toolbar">
    <span class="hud-edit-tip">DRAG ANY BUTTON TO REPOSITION</span>
    <div class="hud-edit-actions">
      <button id="taka-hud-reset" type="button" class="hud-action-btn">RESET</button>
      <button id="taka-hud-save" type="button" class="hud-action-btn hud-save-btn">SAVE &amp; DONE</button>
    </div>
  </div>

  <!-- Joystick Base & Thumb -->
  <div id="taka-joystick-base" class="taka-touch-zone">
    <div id="taka-joystick-thumb"></div>
  </div>

  <!-- Touch Look Zone for turning / aiming -->
  <div id="taka-look-zone" class="taka-touch-zone"></div>

  <!-- Virtual Buttons -->
  <button id="taka-btn-fire" class="taka-action-btn" type="button">FIRE</button>
  <button id="taka-btn-scope" class="taka-action-btn" type="button">SCOPE</button>
  <button id="taka-btn-jump" class="taka-action-btn" type="button">JUMP</button>
  <button id="taka-btn-crouch" class="taka-action-btn" type="button">CROUCH</button>
  <button id="taka-btn-reload" class="taka-action-btn" type="button">RELOAD</button>
</div>

<script>
(function() {
  window.__takaMobileMove = { forward: 0, right: 0 };
  window.__takaMobileJump = false;
  window.__takaMobileDuck = false;
  window.__takaMobileWalk = false;

  var movableIds = [
    'taka-joystick-base',
    'taka-btn-fire',
    'taka-btn-scope',
    'taka-btn-jump',
    'taka-btn-crouch',
    'taka-btn-reload'
  ];

  var isHudEditing = false;
  var customLayout = {};

  // 1. Load saved layout from localStorage
  function loadLayout() {
    try {
      var saved = localStorage.getItem('taka_custom_hud');
      if (saved) {
        customLayout = JSON.parse(saved);
        applyLayout();
      }
    } catch (e) {}
  }

  function applyLayout() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    for (var i = 0; i < movableIds.length; i++) {
      var id = movableIds[i];
      var elem = document.getElementById(id);
      if (elem && customLayout[id]) {
        var left = customLayout[id].x * vw;
        var top = customLayout[id].y * vh;
        elem.style.left = left + 'px';
        elem.style.top = top + 'px';
        elem.style.bottom = 'auto';
        elem.style.right = 'auto';
      }
    }
  }

  window.addEventListener('resize', function() {
    if (Object.keys(customLayout).length > 0) {
      applyLayout();
    }
  });

  loadLayout();

  // 2. Fullscreen Toggle
  var btnFs = document.getElementById('taka-btn-fullscreen');
  var fsLabel = document.getElementById('taka-fs-label');

  function updateFsLabel() {
    var isFull = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (fsLabel) {
      fsLabel.textContent = isFull ? 'EXIT FULL' : 'FULLSCREEN';
    }
  }

  btnFs.addEventListener('click', function(e) {
    e.preventDefault();
    var docEl = document.documentElement;
    var isFull = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement;
    if (!isFull) {
      var req = docEl.requestFullscreen || docEl.webkitRequestFullscreen || docEl.mozRequestFullScreen;
      if (req) {
        req.call(docEl).catch(function(){});
      }
    } else {
      var exit = document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen;
      if (exit) {
        exit.call(document).catch(function(){});
      }
    }
  });

  document.addEventListener('fullscreenchange', updateFsLabel);
  document.addEventListener('webkitfullscreenchange', updateFsLabel);

  // 3. Custom HUD Layout Editing
  var btnCustomize = document.getElementById('taka-btn-customize');
  var hudToolbar = document.getElementById('taka-hud-toolbar');
  var topControls = document.getElementById('taka-top-controls');
  var btnHudSave = document.getElementById('taka-hud-save');
  var btnHudReset = document.getElementById('taka-hud-reset');

  function enterHudEdit() {
    isHudEditing = true;
    document.body.classList.add('taka-hud-editing');
    hudToolbar.style.display = 'flex';
    topControls.style.display = 'none';
  }

  function exitHudEdit() {
    isHudEditing = false;
    document.body.classList.remove('taka-hud-editing');
    hudToolbar.style.display = 'none';
    topControls.style.display = 'flex';
  }

  btnCustomize.addEventListener('click', function(e) {
    e.preventDefault();
    enterHudEdit();
  });

  btnHudSave.addEventListener('click', function(e) {
    e.preventDefault();
    try {
      localStorage.setItem('taka_custom_hud', JSON.stringify(customLayout));
    } catch(err) {}
    exitHudEdit();
  });

  btnHudReset.addEventListener('click', function(e) {
    e.preventDefault();
    try {
      localStorage.removeItem('taka_custom_hud');
    } catch(err) {}
    customLayout = {};
    for (var i = 0; i < movableIds.length; i++) {
      var elem = document.getElementById(movableIds[i]);
      if (elem) {
        elem.style.left = '';
        elem.style.top = '';
        elem.style.bottom = '';
        elem.style.right = '';
      }
    }
    exitHudEdit();
  });

  // HUD Drag Handling
  var hudDragTarget = null;
  var hudDragTouchId = null;
  var hudDragOffset = { x: 0, y: 0 };

  function initMovableButton(elem) {
    elem.addEventListener('touchstart', function(e) {
      if (!isHudEditing) return;
      e.preventDefault();
      e.stopPropagation();
      if (hudDragTarget === null && e.changedTouches.length > 0) {
        var touch = e.changedTouches[0];
        hudDragTarget = elem;
        hudDragTouchId = touch.identifier;
        var rect = elem.getBoundingClientRect();
        hudDragOffset = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top
        };
      }
    }, { passive: false });
  }

  for (var m = 0; m < movableIds.length; m++) {
    var el = document.getElementById(movableIds[m]);
    if (el) initMovableButton(el);
  }

  window.addEventListener('touchmove', function(e) {
    if (isHudEditing && hudDragTarget !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        if (touch.identifier === hudDragTouchId) {
          var left = touch.clientX - hudDragOffset.x;
          var top = touch.clientY - hudDragOffset.y;
          var maxLeft = window.innerWidth - hudDragTarget.offsetWidth;
          var maxTop = window.innerHeight - hudDragTarget.offsetHeight;
          left = Math.max(5, Math.min(left, maxLeft - 5));
          top = Math.max(5, Math.min(top, maxTop - 5));
          hudDragTarget.style.left = left + 'px';
          hudDragTarget.style.top = top + 'px';
          hudDragTarget.style.bottom = 'auto';
          hudDragTarget.style.right = 'auto';
          customLayout[hudDragTarget.id] = {
            x: left / window.innerWidth,
            y: top / window.innerHeight
          };
          break;
        }
      }
    }
  }, { passive: false });

  function endHudDrag(e) {
    if (isHudEditing && hudDragTarget !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === hudDragTouchId) {
          hudDragTarget = null;
          hudDragTouchId = null;
          break;
        }
      }
    }
  }
  window.addEventListener('touchend', endHudDrag);
  window.addEventListener('touchcancel', endHudDrag);

  // 4. Virtual Joystick
  var joyBase = document.getElementById('taka-joystick-base');
  var joyThumb = document.getElementById('taka-joystick-thumb');
  var joyTouchId = null;
  var joyCenter = { x: 0, y: 0 };
  var maxRadius = 50;

  function updateJoystick(clientX, clientY) {
    var dx = clientX - joyCenter.x;
    var dy = clientY - joyCenter.y;
    var dist = Math.hypot(dx, dy);
    var clampedDist = Math.min(dist, maxRadius);
    var angle = Math.atan2(dy, dx);

    var thumbX = Math.cos(angle) * clampedDist;
    var thumbY = Math.sin(angle) * clampedDist;
    joyThumb.style.transform = 'translate(' + thumbX + 'px, ' + thumbY + 'px)';

    var normX = thumbX / maxRadius;
    var normY = thumbY / maxRadius;

    window.__takaMobileMove.forward = -normY;
    window.__takaMobileMove.right = normX;

    if (window.__takaEnqueue) {
      window.__takaEnqueue('move');
    }
  }

  function resetJoystick() {
    joyTouchId = null;
    joyThumb.style.transform = 'translate(0px, 0px)';
    window.__takaMobileMove.forward = 0;
    window.__takaMobileMove.right = 0;
    if (window.__takaEnqueue) {
      window.__takaEnqueue('move');
    }
  }

  joyBase.addEventListener('touchstart', function(e) {
    if (isHudEditing) return; // handled by HUD drag
    e.preventDefault();
    if (joyTouchId === null && e.changedTouches.length > 0) {
      var touch = e.changedTouches[0];
      joyTouchId = touch.identifier;
      var rect = joyBase.getBoundingClientRect();
      joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      updateJoystick(touch.clientX, touch.clientY);
    }
  }, { passive: false });

  window.addEventListener('touchmove', function(e) {
    if (joyTouchId !== null && !isHudEditing) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId) {
          updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
          break;
        }
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', function(e) {
    if (joyTouchId !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId) {
          resetJoystick();
          break;
        }
      }
    }
  });

  window.addEventListener('touchcancel', function(e) {
    if (joyTouchId !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === joyTouchId) {
          resetJoystick();
          break;
        }
      }
    }
  });

  // 5. Touch Look / Aim Zone
  var lookZone = document.getElementById('taka-look-zone');
  var lookTouchId = null;
  var lastLookPos = { x: 0, y: 0 };

  lookZone.addEventListener('touchstart', function(e) {
    if (isHudEditing) return;
    e.preventDefault();
    if (lookTouchId === null && e.changedTouches.length > 0) {
      var touch = e.changedTouches[0];
      lookTouchId = touch.identifier;
      lastLookPos = { x: touch.clientX, y: touch.clientY };
    }
  }, { passive: false });

  window.addEventListener('touchmove', function(e) {
    if (lookTouchId !== null && !isHudEditing) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        if (touch.identifier === lookTouchId) {
          var dx = touch.clientX - lastLookPos.x;
          var dy = touch.clientY - lastLookPos.y;
          lastLookPos = { x: touch.clientX, y: touch.clientY };
          if (window.__takaLook) {
            window.__takaLook(dx * 1.6, dy * 1.6);
          }
          break;
        }
      }
    }
  }, { passive: false });

  window.addEventListener('touchend', function(e) {
    if (lookTouchId !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    }
  });

  window.addEventListener('touchcancel', function(e) {
    if (lookTouchId !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === lookTouchId) {
          lookTouchId = null;
          break;
        }
      }
    }
  });

  // 6. Virtual Action Buttons (With Aim On Fire Rotation!)
  var btnFire = document.getElementById('taka-btn-fire');
  var btnScope = document.getElementById('taka-btn-scope');
  var btnJump = document.getElementById('taka-btn-jump');
  var btnCrouch = document.getElementById('taka-btn-crouch');
  var btnReload = document.getElementById('taka-btn-reload');

  // Aim-While-Firing Tracking
  var fireTouchId = null;
  var lastFirePos = { x: 0, y: 0 };

  btnFire.addEventListener('touchstart', function(e) {
    if (isHudEditing) return; // handled by layout drag
    e.preventDefault();
    if (fireTouchId === null && e.changedTouches.length > 0) {
      var touch = e.changedTouches[0];
      fireTouchId = touch.identifier;
      lastFirePos = { x: touch.clientX, y: touch.clientY };
      if (window.__takaEnqueue) window.__takaEnqueue('fireDown');
    }
  }, { passive: false });

  // Rotate screen / camera while dragging finger on the fire button
  window.addEventListener('touchmove', function(e) {
    if (fireTouchId !== null && !isHudEditing) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        var touch = e.changedTouches[i];
        if (touch.identifier === fireTouchId) {
          var fdx = touch.clientX - lastFirePos.x;
          var fdy = touch.clientY - lastFirePos.y;
          lastFirePos = { x: touch.clientX, y: touch.clientY };
          if (window.__takaLook) {
            window.__takaLook(fdx * 1.6, fdy * 1.6);
          }
          break;
        }
      }
    }
  }, { passive: false });

  function releaseFire(e) {
    if (fireTouchId !== null) {
      for (var i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === fireTouchId) {
          fireTouchId = null;
          if (window.__takaEnqueue) window.__takaEnqueue('fireUp');
          break;
        }
      }
    }
  }

  window.addEventListener('touchend', releaseFire);
  window.addEventListener('touchcancel', releaseFire);

  btnScope.addEventListener('touchstart', function(e) {
    if (isHudEditing) return;
    e.preventDefault();
    if (window.__takaEnqueue) window.__takaEnqueue('alternate');
  }, { passive: false });

  btnJump.addEventListener('touchstart', function(e) {
    if (isHudEditing) return;
    e.preventDefault();
    if (window.__takaEnqueue) window.__takaEnqueue('jump');
  }, { passive: false });

  btnCrouch.addEventListener('touchstart', function(e) {
    if (isHudEditing) return;
    e.preventDefault();
    if (window.__takaEnqueue) {
      window.__takaEnqueue('duck');
      btnCrouch.classList.toggle('is-crouched', window.__takaMobileDuck);
    }
  }, { passive: false });

  btnReload.addEventListener('touchstart', function(e) {
    if (isHudEditing) return;
    e.preventDefault();
    if (window.__takaEnqueue) window.__takaEnqueue('reload');
  }, { passive: false });

})();
</script>
</body></html>`;

html = html.substring(0, startIndex) + replacement;
fs.writeFileSync(gameHtmlPath, html, 'utf8');
console.log('Successfully updated game.html with Fullscreen, Custom Layout, and Aim-On-Fire!');
