/**
 * TakaGO Low-Latency Multiplayer & Gun Tracing System
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

  // Remote Players state map
  const remotePlayers = new Map(); // id -> state
  let supabase = null;
  let channel = null;

  // 2. First-Time Username Modal Management
  function promptUsernameIfNeeded(onComplete) {
    if (myUsername && myUsername.trim().length > 0) {
      if (onComplete) onComplete(myUsername);
      return;
    }

    const defaultName = 'Operator_' + (Math.floor(Math.random() * 900) + 100);

    // Create Modal DOM
    let modal = document.getElementById('taka-username-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'taka-username-modal';
      modal.innerHTML = `
        <div class="taka-modal-backdrop">
          <div class="taka-modal-card">
            <div class="taka-modal-header">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff7828" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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
      if (onComplete) onComplete(myUsername);
    };
  }

  // Allow clicking badge to change callsign anytime
  window.__takaChangeCallsign = function() {
    myUsername = '';
    promptUsernameIfNeeded((name) => {
      if (channel) {
        channel.track({ id: myPlayerId, name: name });
      }
    });
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
      el.textContent = count;
    }
  }

  // 4. Connect to Supabase Realtime
  function initMultiplayer() {
    if (!window.supabase) {
      console.warn('[Multiplayer] Supabase JS SDK not loaded yet, retrying in 200ms...');
      setTimeout(initMultiplayer, 200);
      return;
    }

    try {
      supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (err) {
      console.error('[Multiplayer] Failed to create Supabase client:', err);
      return;
    }

    // Zero-delay WebSocket broadcast channel
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
          // Remove from engine bots
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
        // Local player was shot by another player!
        const player = window.__takaSim.player;
        if (player.health > 0) {
          player.health = Math.max(0, player.health - (payload.damage || 25));
          if (player.health <= 0) {
            // Player died
            window.__takaSim.emit({
              type: 'death',
              target: 0,
              actor: payload.attackerId ? hashString(payload.attackerId) : 1,
              actorName: payload.attackerName || 'Enemy',
              headshot: !!payload.headshot,
              weapon: payload.weapon || 'ak47'
            });
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
        channel.track({ id: myPlayerId, name: myUsername || 'Player' });
        console.log('[Multiplayer] Subscribed to room:', ROOM_NAME);
      }
    });

    // Start outgoing position broadcast loop @ 30Hz
    startOutgoingBroadcastLoop();
  }

  // 9. Handle incoming remote position
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
    } else {
      bot.name = p.name || bot.name;
      bot.targetPos = p.pos;
      bot.targetYaw = p.yaw;
      bot.targetPitch = p.pitch;
      bot.body.duck = p.duck || 0;
      bot.health = p.health ?? bot.health;
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

    // Render the 3D tracer beam in the scene
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

    // 3D Spatial Gunshot Audio
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

  // 11. Hook into Local Game Events (When local player shoots/hits)
  window.__takaOnGameEvent = function(e, sim) {
    if (!channel) return;

    // Local weapon fired: broadcast shot instantly to all connected players!
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

    // Local hit on a remote player: broadcast hit
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
      if (!channel || !window.__takaSim || !window.__takaSim.player) return;
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
    }, 33); // ~30 times per second for smooth, zero-delay real-time networking

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

  // 13. Initialization Entrypoint
  window.addEventListener('DOMContentLoaded', () => {
    promptUsernameIfNeeded(() => {
      initMultiplayer();
    });
  });

  // Also trigger if DOM is already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    promptUsernameIfNeeded(() => {
      initMultiplayer();
    });
  }
})();
