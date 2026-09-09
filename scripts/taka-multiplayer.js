/**
 * TakaGO Low-Latency Multiplayer, Gun Tracing & ESP Locator System
 * Powered by Supabase Realtime Channels (WebSocket Broadcast & Presence)
 */
(function() {
  const SUPABASE_URL = 'https://jnugeonbfqynopxycxyo.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpudWdlb25iZnF5bm9weHljeHlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MjI5MDUsImV4cCI6MjEwNDQ5ODkwNX0.CbPbSoAsHx8kxfBvEr4gAFfVryM-SwQ4zeF95TEOQGQ';
  const ROOM_NAME = 'takago_arena_dust2';

  // Helper string hash to produce stable numeric entityId for the engine
  function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 80000) + 2000;
  }

  // 1. Player Identity
  let myPlayerId = sessionStorage.getItem('taka_player_id');
  if (!myPlayerId) {
    myPlayerId = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    sessionStorage.setItem('taka_player_id', myPlayerId);
  }
  const myNumericId = hashString(myPlayerId);

  let myUsername = localStorage.getItem('taka_username') || '';
  if (!myUsername) {
    myUsername = 'Operator_' + (Math.floor(Math.random() * 900) + 100);
  }

  // Remote Players state map
  const remotePlayers = new Map(); // id -> state
  window.__takaRemotePlayers = remotePlayers;
  let supabase = null;
  let channel = null;
  let isSubscribed = false;
  let espEnabled = true;

  // Purge offline AI bots so only human players exist
  function purgeOfflineBots() {
    if (window.__takaSim && window.__takaSim.bots) {
      window.__takaSim.bots = window.__takaSim.bots.filter(b => b.isRemote);
    }
    if (window.__takaRenderer && window.__takaRenderer.actors) {
      for (const [id, actor] of window.__takaRenderer.actors.entries()) {
        if (id !== 0) {
          const isRemote = Array.from(remotePlayers.values()).some(rp => rp.entityId === id);
          if (!isRemote) {
            window.__takaRenderer.scene?.remove(actor);
            window.__takaRenderer.actors.delete(id);
            window.__takaRenderer.posedRigs?.delete(id);
          }
        }
      }
    }
  }

  // 2. First-Time Username Modal Management
  function promptUsernameIfNeeded(onComplete) {
    const stored = localStorage.getItem('taka_username');
    if (stored && stored.trim().length > 0) {
      myUsername = stored.trim();
      updatePlayerBadge();
      if (onComplete) onComplete(myUsername);
      return;
    }

    const defaultName = myUsername || ('Operator_' + (Math.floor(Math.random() * 900) + 100));

    // Create Modal DOM
    let modal = document.getElementById('taka-username-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'taka-username-modal';
      modal.innerHTML = `
        <div class="taka-modal-backdrop">
          <div class="taka-modal-card">
            <div class="taka-modal-header">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff7828" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <h2>CHOOSE YOUR CALLSIGN</h2>
            </div>
            <p class="taka-modal-desc">Enter your operative name for real-time multiplayer combat in Dust II:</p>
            <form id="taka-username-form" onsubmit="return false;">
              <input type="text" id="taka-username-input" maxlength="16" placeholder="${defaultName}" autocomplete="off" autofocus />
              <button type="submit" id="taka-username-submit">ENTER ARENA</button>
            </form>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.style.display = 'flex';
    const input = document.getElementById('taka-username-input');
    input.value = defaultName;
    setTimeout(() => { input.focus(); input.select(); }, 100);

    const form = document.getElementById('taka-username-form');
    form.onsubmit = function(e) {
      e.preventDefault();
      let chosen = (input.value || '').trim();
      if (!chosen) chosen = defaultName;
      myUsername = chosen;
      localStorage.setItem('taka_username', myUsername);
      modal.style.display = 'none';
      updatePlayerBadge();
      if (channel && isSubscribed) {
        channel.track({ id: myPlayerId, name: myUsername });
      }
      if (onComplete) onComplete(myUsername);
    };
  }

  // Allow clicking badge to change callsign anytime
  window.__takaChangeCallsign = function() {
    localStorage.removeItem('taka_username');
    promptUsernameIfNeeded((name) => {
      if (channel && isSubscribed) {
        channel.track({ id: myPlayerId, name: name });
      }
    });
  };

  // Toggle ESP Wallhack
  window.__takaToggleESP = function() {
    espEnabled = !espEnabled;
    const lbl = document.getElementById('taka-esp-label');
    const ind = document.getElementById('taka-esp-indicator');
    if (lbl) lbl.textContent = espEnabled ? 'ESP: ON' : 'ESP: OFF';
    if (ind) {
      ind.style.background = espEnabled ? '#00ff88' : '#ef4444';
      ind.style.boxShadow = espEnabled ? '0 0 8px #00ff88' : 'none';
    }
  };

  // 3. UI Status Badges
  function updatePlayerBadge() {
    const badge = document.getElementById('taka-callsign-badge');
    if (badge) {
      badge.textContent = myUsername || 'Player';
    }
  }

  function updateOnlineCount(count) {
    const el = document.getElementById('taka-online-count');
    if (el) {
      el.textContent = Math.max(1, count);
    }
  }

  // 4. Connect to Supabase Realtime
  function initMultiplayer() {
    if (!window.supabase) {
      console.warn('[Multiplayer] Supabase JS SDK not loaded yet, retrying in 200ms...');
      setTimeout(initMultiplayer, 200);
      return;
    }

    if (channel) return;

    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.error('[Multiplayer] Failed to create Supabase client:', err);
      return;
    }

    channel = supabase.channel(ROOM_NAME, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: myPlayerId }
      }
    });

    // Presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      let count = 0;
      for (const k in state) count += state[k].length;
      updateOnlineCount(Math.max(1, count));
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      if (!leftPresences) return;
      leftPresences.forEach(p => {
        const id = p.id || p.key;
        if (remotePlayers.has(id)) {
          const remote = remotePlayers.get(id);
          if (window.__takaRenderer) {
            const rig = window.__takaRenderer.posedRigs?.get(remote.entityId);
            if (rig) {
              window.__takaRenderer.scene?.remove(rig.root);
              if (typeof rig.dispose === 'function') rig.dispose();
              window.__takaRenderer.posedRigs?.delete(remote.entityId);
              window.__takaRenderer.actors?.delete(remote.entityId);
            }
          }
          if (window.__takaSim && window.__takaSim.bots) {
            const idx = window.__takaSim.bots.findIndex(b => b.remoteId === id);
            if (idx !== -1) {
              window.__takaSim.bots.splice(idx, 1);
            }
          }
          remotePlayers.delete(id);
        }
      });
    });

    // 5. Remote Position Updates
    channel.on('broadcast', { event: 'pos' }, ({ payload }) => {
      if (!payload || payload.id === myPlayerId) return;
      handleRemotePosition(payload);
    });

    // 6. Remote Gun Tracers & Firing Sync
    channel.on('broadcast', { event: 'shot' }, ({ payload }) => {
      if (!payload || payload.id === myPlayerId) return;
      handleRemoteShot(payload);
    });

    // 7. Remote Hit & Damage
    channel.on('broadcast', { event: 'hit' }, ({ payload }) => {
      if (!payload) return;
      if (payload.targetId === myNumericId && window.__takaSim && window.__takaSim.player) {
        const player = window.__takaSim.player;
        if (player.health > 0) {
          player.health = Math.max(0, player.health - (payload.damage || 25));
          if (player.health <= 0) {
            window.__takaSim.emit({
              type: 'death',
              target: 0,
              actor: payload.attackerId ? hashString(payload.attackerId) : 1,
              actorName: payload.attackerName || 'Enemy',
              headshot: !!payload.headshot,
              weapon: payload.weapon || 'ak47'
            });
            if (channel && isSubscribed) {
              channel.send({
                type: 'broadcast',
                event: 'kill',
                payload: {
                  killerId: payload.attackerId,
                  killerName: payload.attackerName,
                  victimId: myPlayerId,
                  victimName: myUsername,
                  weapon: payload.weapon || 'ak47',
                  headshot: !!payload.headshot
                }
              });
            }
          }
        }
      }
    });

    // 8. Remote Kill Notice
    channel.on('broadcast', { event: 'kill' }, ({ payload }) => {
      if (!payload || !window.__takaSim) return;
      window.__takaSim.emit({
        type: 'kill',
        actor: hashString(payload.killerId || 'p'),
        actorName: payload.killerName || 'Player',
        target: hashString(payload.victimId || 'v'),
        label: payload.victimName || 'Player',
        weapon: payload.weapon || 'ak47',
        headshot: !!payload.headshot
      });
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribed = true;
        channel.track({ id: myPlayerId, name: myUsername || 'Player' });
        console.log('[Multiplayer] Subscribed to room:', ROOM_NAME);
      }
    });

    startOutgoingBroadcastLoop();
  }

  // 9. Handle incoming remote position
  window.__takaHandleRemotePos = function(p) { return handleRemotePosition(p); };
  function handleRemotePosition(p) {
    if (!window.__takaSim || !window.__takaSim.bots) return;

    let bot = window.__takaSim.bots.find(b => b.remoteId === p.id);
    if (!bot) {
      bot = {
        entityId: p.nid || hashString(p.id),
        remoteId: p.id,
        isRemote: true,
        name: p.name || 'Operative',
        health: p.health ?? 100,
        body: {
          position: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
          velocity: { x: p.vel ? p.vel.x : 0, y: p.vel ? p.vel.y : 0, z: p.vel ? p.vel.z : 0 },
          duck: p.duck || 0,
          grounded: true
        },
        bodyPose: { phase: 0, time: 0, rate: 0 },
        punch: { pitch: 0, yaw: 0, time: 0 },
        intent: { forward: 0, right: 0, walk: false, duck: false, jump: false, yaw: p.yaw || 0 },
        targetPos: { x: p.pos.x, y: p.pos.y, z: p.pos.z },
        targetYaw: p.yaw || 0,
        targetPitch: p.pitch || 0,
        yaw: p.yaw || 0,
        pitch: p.pitch || 0,
        equipped: p.equipped || 'gun',
        gun: { id: p.weapon || 'ak47', mode: p.mode || 0, zoom: 0 },
        gunDraw: { serial: 1, started: 0, duration: 1, weapon: p.weapon || 'ak47' },
        knife: p.knife || { kind: 'butterfly', finish: 0, pattern: 0, swungAt: -100 },
        accuracyCrouched: false,
        damageRemainder: 0,
        armor: 100,
        pendingTags: [],
        inventory: {},
        kills: 0,
        deaths: 0,
        headshots: 0
      };
      window.__takaSim.bots.push(bot);
      remotePlayers.set(p.id, bot);

      if (window.__takaRenderer && window.__takaRenderer.rigFactory && window.__takaRenderer.scene) {
        try {
          const rig = window.__takaRenderer.rigFactory.create();
          // Enable X-Ray through walls for 3D model
          rig.root.traverse(child => {
            if (child.isMesh && child.material) {
              child.material.depthTest = false;
              child.renderOrder = 9999;
            }
          });
          window.__takaRenderer.posedRigs?.set(bot.entityId, rig);
          window.__takaRenderer.actors?.set(bot.entityId, rig.root);
          window.__takaRenderer.scene.add(rig.root);
        } catch (err) {
          console.warn('[Multiplayer] Failed to attach 3D rig:', err);
        }
      }
    } else {
      bot.name = p.name || bot.name;
      bot.targetPos = p.pos;
      bot.targetYaw = p.yaw;
      bot.targetPitch = p.pitch;
      bot.body.duck = p.duck || 0;
      bot.health = p.health ?? bot.health;
      if (bot.intent) {
        bot.intent.yaw = p.yaw || 0;
        bot.intent.duck = (p.duck || 0) > 0.5;
      }
      if (p.vel) {
        bot.body.velocity.x = p.vel.x;
        bot.body.velocity.y = p.vel.y;
        bot.body.velocity.z = p.vel.z;
      }
      if (p.weapon && bot.gun.id !== p.weapon) {
        bot.gun.id = p.weapon;
        bot.gunDraw.weapon = p.weapon;
      }
      bot.gun.mode = p.mode || 0;
      bot.equipped = p.equipped || 'gun';
    }
  }

  // 10. Handle incoming remote gunshot & bullet tracer
  function handleRemoteShot(s) {
    if (!window.__takaRenderer || !window.__takaSim) return;

    window.__takaRenderer.event({
      type: 'shot',
      actor: s.nid || hashString(s.id),
      position: s.pos,
      end: s.end,
      weapon: s.weapon,
      mode: s.mode || 0,
      worldHit: !!s.worldHit,
      impacts: s.impacts || [],
      time: window.__takaSim.time || (performance.now() / 1000)
    });

    if (window.__takaAudio && window.__takaSim.player) {
      const pPos = window.__takaSim.player.body.position;
      const pYaw = window.__takaSim.player.yaw;
      const dx = s.pos.x - pPos.x;
      const dz = s.pos.z - pPos.z;
      const dist = Math.hypot(dx, dz);
      const pan = Math.max(-1, Math.min(1, (dx * Math.cos(pYaw) - dz * Math.sin(pYaw)) / Math.max(1, dist)));
      window.__takaAudio.shot(s.weapon, s.mode || 0, { distance: dist, pan: pan }, s.nid || hashString(s.id));
    }
  }

  // 11. Hook into Local Game Events
  window.__takaOnGameEvent = function(e, sim) {
    if (!channel || !isSubscribed) return;

    if (e.type === 'shot' && e.actor === 0) {
      channel.send({
        type: 'broadcast',
        event: 'shot',
        payload: {
          id: myPlayerId,
          nid: myNumericId,
          name: myUsername || 'Player',
          weapon: e.weapon,
          mode: e.mode || 0,
          pos: e.position,
          end: e.end,
          worldHit: e.worldHit,
          impacts: e.impacts || []
        }
      });
    }

    if (e.type === 'hit' && e.actor === 0 && e.target) {
      channel.send({
        type: 'broadcast',
        event: 'hit',
        payload: {
          targetId: e.target,
          attackerId: myPlayerId,
          attackerName: myUsername,
          damage: e.value || 30,
          headshot: !!e.headshot,
          weapon: e.weapon
        }
      });
    }
  };

  // 12. Outgoing Transform Broadcast Loop (30Hz)
  function startOutgoingBroadcastLoop() {
    setInterval(() => {
      if (!channel || !isSubscribed || !window.__takaSim || !window.__takaSim.player) return;
      const p = window.__takaSim.player;
      if (p.health <= 0) return;

      channel.send({
        type: 'broadcast',
        event: 'pos',
        payload: {
          id: myPlayerId,
          nid: myNumericId,
          name: myUsername || 'Player',
          pos: { x: p.body.position.x, y: p.body.position.y, z: p.body.position.z },
          vel: { x: p.body.velocity.x, y: p.body.velocity.y, z: p.body.velocity.z },
          yaw: p.yaw,
          pitch: p.pitch,
          duck: p.body.duck || 0,
          health: p.health,
          weapon: p.gun.id,
          mode: p.gun.mode || 0,
          equipped: p.equipped,
          knife: p.knife
        }
      });
    }, 33);

    // Smooth frame-by-frame interpolation for remote players
    function interpolateRemote() {
      if (window.__takaSim && window.__takaSim.bots) {
        for (let i = 0; i < window.__takaSim.bots.length; i++) {
          const b = window.__takaSim.bots[i];
          if (b.isRemote && b.targetPos) {
            b.body.position.x += (b.targetPos.x - b.body.position.x) * 0.35;
            b.body.position.y += (b.targetPos.y - b.body.position.y) * 0.35;
            b.body.position.z += (b.targetPos.z - b.body.position.z) * 0.35;
            b.yaw += (b.targetYaw - b.yaw) * 0.4;
            b.pitch += (b.targetPitch - b.pitch) * 0.4;
          }
        }
      }
      requestAnimationFrame(interpolateRemote);
    }
    requestAnimationFrame(interpolateRemote);
  }

  // 13. High-Precision ESP Wallhack & Player Locator Overlay
  function startESP() {
    const canvas = document.getElementById('taka-esp-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function renderESP() {
      requestAnimationFrame(renderESP);
      purgeOfflineBots();

      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (!espEnabled) {
        ctx.restore();
        return;
      }

      const camera = window.__takaRenderer?.camera;
      const localPlayer = window.__takaSim?.player;

      if (!camera || !localPlayer) {
        ctx.restore();
        return;
      }

      camera.updateMatrixWorld?.();
      const lp = localPlayer.body?.position;
      if (!lp) {
        ctx.restore();
        return;
      }

      const targets = [];
      for (const [id, bot] of remotePlayers.entries()) {
        if (bot && bot.body?.position) {
          targets.push(bot);
        }
      }

      if (targets.length === 0) {
        ctx.font = '700 11px monospace';
        ctx.fillStyle = 'rgba(0, 255, 136, 0.75)';
        ctx.textAlign = 'left';
        ctx.fillText('📡 [ESP ACTIVE] WAITING FOR OTHER PLAYERS...', 18, height - 20);
        ctx.restore();
        return;
      }

      for (const bot of targets) {
        const bp = bot.body.position;
        const isAlive = (bot.health ?? 100) > 0;
        if (!isAlive) continue;

        const dx = bp.x - lp.x;
        const dy = bp.y - lp.y;
        const dz = bp.z - lp.z;
        const distUnits = Math.hypot(dx, dy, dz);
        const distMeters = Math.max(1, Math.round(distUnits * 0.0254));

        const rig = window.__takaRenderer?.posedRigs?.get(bot.entityId);
        if (rig && rig.root) {
          rig.root.traverse(child => {
            if (child.isMesh && child.material) {
              child.material.depthTest = !espEnabled;
              child.renderOrder = espEnabled ? 9999 : 0;
            }
          });
        }

        const isDuck = (bot.body.duck || 0) > 0.4;
        const headOffset = isDuck ? 46 : 68;

        const vFeet = camera.position.clone().set(bp.x, bp.y - 2, bp.z).project(camera);
        const vHead = camera.position.clone().set(bp.x, bp.y + headOffset, bp.z).project(camera);
        const vCenter = camera.position.clone().set(bp.x, bp.y + headOffset * 0.5, bp.z).project(camera);

        const inFront = vCenter.z < 1.0;

        const screenFeetX = (vFeet.x * 0.5 + 0.5) * width;
        const screenFeetY = (-vFeet.y * 0.5 + 0.5) * height;
        const screenHeadX = (vHead.x * 0.5 + 0.5) * width;
        const screenHeadY = (-vHead.y * 0.5 + 0.5) * height;

        const onScreen = inFront &&
          screenFeetX >= -60 && screenFeetX <= width + 60 &&
          screenFeetY >= -60 && screenFeetY <= height + 60;

        if (onScreen) {
          const boxHeight = Math.max(22, Math.abs(screenFeetY - screenHeadY));
          const boxWidth = Math.max(12, boxHeight * 0.54);
          const boxX = screenHeadX - boxWidth / 2;
          const boxY = Math.min(screenHeadY, screenFeetY);

          // 1. Tactical Snapline from Bottom-Center to Feet
          ctx.beginPath();
          ctx.moveTo(width / 2, height);
          ctx.lineTo(screenFeetX, screenFeetY);
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.42)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // 2. Corner Bracket Bounding Box
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 6;

          const cw = Math.min(boxWidth * 0.32, 14);
          const ch = Math.min(boxHeight * 0.25, 14);

          ctx.beginPath();
          // Top-Left
          ctx.moveTo(boxX, boxY + ch); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + cw, boxY);
          // Top-Right
          ctx.moveTo(boxX + boxWidth - cw, boxY); ctx.lineTo(boxX + boxWidth, boxY); ctx.lineTo(boxX + boxWidth, boxY + ch);
          // Bottom-Left
          ctx.moveTo(boxX, boxY + boxHeight - ch); ctx.lineTo(boxX, boxY + boxHeight); ctx.lineTo(boxX + cw, boxY + boxHeight);
          // Bottom-Right
          ctx.moveTo(boxX + boxWidth - cw, boxY + boxHeight); ctx.lineTo(boxX + boxWidth, boxY + boxHeight); ctx.lineTo(boxX + boxWidth, boxY + boxHeight - ch);
          ctx.stroke();

          // Subtle box tint
          ctx.fillStyle = 'rgba(0, 255, 136, 0.08)';
          ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

          // 3. Health Bar
          const barX = boxX - 6;
          const barWidth = 3;
          const hp = Math.max(0, Math.min(100, bot.health ?? 100));
          const hpRatio = hp / 100;
          const fillH = boxHeight * hpRatio;

          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(10, 15, 25, 0.8)';
          ctx.fillRect(barX - 1, boxY - 1, barWidth + 2, boxHeight + 2);
          ctx.fillStyle = hpRatio > 0.5 ? '#22c55e' : (hpRatio > 0.2 ? '#f59e0b' : '#ef4444');
          ctx.fillRect(barX, boxY + (boxHeight - fillH), barWidth, fillH);

          // 4. Name Tag Above Head
          ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.textAlign = 'center';
          const nameText = bot.name || 'Operative';
          const nameW = ctx.measureText(nameText).width + 12;

          ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
          ctx.fillRect(screenHeadX - nameW / 2, boxY - 19, nameW, 16);
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenHeadX - nameW / 2, boxY - 19, nameW, 16);
          ctx.fillStyle = '#00ff88';
          ctx.fillText(nameText, screenHeadX, boxY - 7);

          // 5. Distance & Weapon Below Feet
          const subText = `${distMeters}m • ${bot.gun?.id?.toUpperCase() || 'AK47'}`;
          ctx.font = 'bold 10px monospace';
          const subW = ctx.measureText(subText).width + 8;

          ctx.fillStyle = 'rgba(10, 15, 25, 0.85)';
          ctx.fillRect(screenFeetX - subW / 2, boxY + boxHeight + 3, subW, 14);
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(subText, screenFeetX, boxY + boxHeight + 14);

        } else {
          // OFF-SCREEN EDGE RADAR POINTER
          let dirX = vCenter.x;
          let dirY = -vCenter.y;
          if (!inFront) {
            dirX = -dirX;
            dirY = -dirY;
          }
          const len = Math.hypot(dirX, dirY) || 1;
          const normX = dirX / len;
          const normY = dirY / len;

          const margin = 50;
          const hw = width / 2 - margin;
          const hh = height / 2 - margin;
          let edgeX = 0, edgeY = 0;
          const slope = normY / (normX || 0.0001);

          if (Math.abs(normX) * hh > Math.abs(normY) * hw) {
            edgeX = normX > 0 ? hw : -hw;
            edgeY = edgeX * slope;
          } else {
            edgeY = normY > 0 ? hh : -hh;
            edgeX = edgeY / slope;
          }

          const px = width / 2 + edgeX;
          const py = height / 2 + edgeY;
          const angle = Math.atan2(normY, normX);

          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(angle);
          ctx.fillStyle = '#00ff88';
          ctx.shadowColor = '#00ff88';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(10, 0);
          ctx.lineTo(-8, -7);
          ctx.lineTo(-3, 0);
          ctx.lineTo(-8, 7);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Off-screen name & distance banner
          ctx.shadowBlur = 0;
          ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          const offText = `${bot.name || 'Operative'} [${distMeters}m]`;
          const offW = ctx.measureText(offText).width + 12;
          const offX = Math.max(margin, Math.min(width - margin - offW, px - offW / 2));
          const offY = Math.max(margin + 16, Math.min(height - margin, py + (normY > 0 ? -14 : 20)));

          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.fillRect(offX, offY - 12, offW, 16);
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 1;
          ctx.strokeRect(offX, offY - 12, offW, 16);
          ctx.fillStyle = '#00ff88';
          ctx.textAlign = 'left';
          ctx.fillText(offText, offX + 6, offY);
        }
      }
      ctx.restore();
    }

    requestAnimationFrame(renderESP);
  }

  // 14. Initialization Entrypoint
  function start() {
    updatePlayerBadge();
    initMultiplayer();
    startESP();
    if (!localStorage.getItem('taka_username')) {
      promptUsernameIfNeeded();
    }
  }

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
