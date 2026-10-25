/* Isolated title-page migration. Original gameplay bundle and storage stay untouched. */
(() => {
  'use strict';
  const TEMPLATE = "\n<div class=\"title-head\">\n  <div class=\"cover-title\">\n    <img class=\"ct-line1\" src=\"assets/title_line1.png\" alt=\"\"/>\n    <img class=\"ct-line2\" src=\"assets/title_line2.png\" alt=\"\"/>\n  </div>\n  <img class=\"ct-tag\" src=\"assets/title_tag.png\" alt=\"\"/>\n  <div class=\"user-line\" id=\"home-source-user-line\" style=\"display:none\"></div>\n</div>\n<div class=\"cover-char\" id=\"cover-char\">\n  <img src=\"assets/cover_char.png\" alt=\"\"/>\n</div>\n<div class=\"map-wrap\" id=\"map-wrap\">\n  <div class=\"map-bg\" id=\"map-bg\"></div>\n  <div class=\"dy-clouds\"><i class=\"c1\"></i><i class=\"c2\"></i><i class=\"c3\"></i></div>\n  <div class=\"dy-haze\"></div>\n  <canvas class=\"dy-petals\" id=\"dy-petals\"></canvas>\n  <button class=\"dy-time-btn\" id=\"dy-time-btn\">☀ 时辰 · 自动</button>\n  <button class=\"dy-music-btn\" id=\"dy-music-btn\">♫ 奏乐</button>\n  <button class=\"map-spot\" data-act=\"start\" style=\"left:50%;top:42%\"><span class=\"ms-name\">正殿</span><span class=\"ms-fn\">开始游戏</span></button>\n  <button class=\"map-spot\" data-act=\"chapters\" style=\"left:50%;top:78%\"><span class=\"ms-name\">宫门</span><span class=\"ms-fn\">章节选择</span></button>\n  <button class=\"map-spot\" data-act=\"archive\" style=\"left:34%;top:26%\"><span class=\"ms-name\">档案阁</span><span class=\"ms-fn\">存档 / 建档</span></button>\n  <button class=\"map-spot\" data-act=\"showcase\" style=\"left:16%;top:22%\"><span class=\"ms-name\">偏殿</span><span class=\"ms-fn\">角色设定</span></button>\n  <button class=\"map-spot\" data-act=\"scenes\" style=\"left:14%;top:48%\"><span class=\"ms-name\">藏书阁</span><span class=\"ms-fn\">剧情图鉴</span></button>\n  <button class=\"map-spot\" data-act=\"settings\" style=\"left:16%;top:74%\"><span class=\"ms-name\">左配殿</span><span class=\"ms-fn\">设置</span></button>\n  <button class=\"map-spot\" data-act=\"wardrobe\" style=\"left:74%;top:20%\"><span class=\"ms-name\">角楼</span><span class=\"ms-fn\">服装更换</span></button>\n  <button class=\"map-spot\" data-act=\"endings\" style=\"left:74%;top:48%\"><span class=\"ms-name\">昭阳殿</span><span class=\"ms-fn\">结局图鉴</span></button>\n  <button class=\"map-spot\" data-act=\"help\" style=\"left:74%;top:76%\"><span class=\"ms-name\">右配殿</span><span class=\"ms-fn\">操作说明</span></button>\n</div>\n<div class=\"home-utility\"><button data-home-action=\"homepage\">个人主页</button><button data-home-action=\"login\">登录 / 账号</button><button data-home-action=\"feedback\">反馈建议</button></div>\n<button class=\"runaway-btn\" id=\"runaway-btn\">🪙 偷跑出宫 · 小游戏</button>\n</div>";
  const install = () => {
    const screen = document.getElementById('screen-title');
    if (!screen) return false;
    if (screen.dataset.homeV2) return true;
    screen.dataset.homeV2 = 'installed';
    const original = screen.querySelector('.title-wrap');
    if (!original) return false;
    const actions = new Map([...original.querySelectorAll('.map-spot')].map(button => [button.dataset.act, button]));
    const runaway = original.querySelector('#runaway-btn');
    original.classList.add('home-original');
    original.setAttribute('aria-hidden', 'true');
    const view = document.createElement('div');
    view.className = 'title-wrap home-v2';
    view.innerHTML = TEMPLATE;
    screen.appendChild(view);
    const map = view.querySelector('.map-bg');
    const timeButton = view.querySelector('.dy-time-btn');
    const musicButton = view.querySelector('.dy-music-btn');
    const music = document.createElement('audio');
    music.id = 'home-title-music';
    music.src = './assets/bgm_moldau.wav';
    music.loop = true;
    music.preload = 'auto';
    document.body.appendChild(music);
    let musicWanted = true;
    let phase = 'auto';
    let visible = false;
    const phases = ['dawn', 'day', 'dusk', 'night'];
    const labels = {dawn:'黎明', day:'白天', dusk:'黄昏', night:'黑夜'};
    const currentPhase = () => {
      const h = new Date().getHours();
      return h >= 5 && h < 9 ? 'dawn' : h >= 9 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
    };
    const setBackground = () => {
      const p = phase === 'auto' ? currentPhase() : phase;
      map.style.backgroundImage = `url(./assets/bg_title_${p}.jpg)`;
      map.classList.remove('bg-swap');
      void map.offsetWidth;
      map.classList.add('bg-swap');
      screen.classList.toggle('lights-on', p === 'dusk' || p === 'night');
      timeButton.textContent = `时辰 · ${phase === 'auto' ? '自动' : labels[p]}`;
    };
    const canShow = () => screen.classList.contains('active') && !document.getElementById('gate-loading');
    const syncMusic = () => {
      const audio = window.__mainAudio;
      const show = canShow();
      visible = show;
      const enabled = !audio || (audio.musicOn && !audio.masterMuted);
      music.volume = Math.min(1, Math.max(0, audio ? audio.bgmVol * audio.master * .72 : .5));
      if (show && audio && !audio.deferred && audio.current) audio.playBgm('none');
      if (show && musicWanted && enabled) {
        if (music.paused) music.play().catch(() => {});
      } else if (!music.paused) music.pause();
      musicButton.textContent = musicWanted && enabled ? '止乐' : '奏乐';
      musicButton.setAttribute('aria-pressed', String(musicWanted && enabled));
    };
    timeButton.addEventListener('click', () => {
      phase = phase === 'auto' ? currentPhase() : phases[(phases.indexOf(phase) + 1) % phases.length];
      setBackground();
    });
    musicButton.addEventListener('click', () => { musicWanted = !musicWanted; syncMusic(); });
    view.addEventListener('click', event => {
      const utility = event.target.closest('[data-home-action]');
      const spot = event.target.closest('.map-spot');
      const isRunaway = event.target.closest('.runaway-btn');
      const action = utility ? utility.dataset.homeAction : spot ? spot.dataset.act : null;
      if (action && actions.has(action)) {
        music.pause();
        actions.get(action).click();
        syncMusic();
      } else if (isRunaway && runaway) {
        music.pause();
        runaway.click();
        syncMusic();
      }
    });
    const canvas = view.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let width = 0, height = 0;
    const resize = () => { width = canvas.width = view.clientWidth; height = canvas.height = view.clientHeight; };
    new ResizeObserver(resize).observe(view);
    resize();
    const makePetal = () => ({x:Math.random() * Math.max(width, 1), y:-20-Math.random()*Math.max(height,1)*.4, s:.4+Math.random()*.95, r:Math.random()*6.28, vr:(Math.random()-.5)*.02, a:.5+Math.random()*.45, sw:Math.random()*6.28});
    const petals = Array.from({length:34}, makePetal);
    let lastFrame = 0;
    const tick = now => {
      requestAnimationFrame(tick);
      if (!visible || !ctx || now-lastFrame<25) return;
      lastFrame = now;
      ctx.clearRect(0, 0, width, height);
      for (let i=0; i<petals.length; i++) {
        const p=petals[i];
        p.y+=p.s; p.x+=Math.sin(p.sw+=.014)*.42; p.r+=p.vr;
        ctx.save(); ctx.globalAlpha=p.a; ctx.translate(p.x,p.y); ctx.rotate(p.r);
        ctx.fillStyle='#a3273a'; ctx.beginPath(); ctx.ellipse(0,0,5.2,3.1,0,0,Math.PI*2); ctx.fill(); ctx.restore();
        if (p.y>height+24) petals[i]=makePetal();
      }
    };
    requestAnimationFrame(tick);
    new MutationObserver(syncMusic).observe(screen, {attributes:true, attributeFilter:['class']});
    document.addEventListener('pointerdown', () => { if (canShow()) syncMusic(); }, {passive:true});
    setInterval(syncMusic, 400);
    setInterval(() => { if (phase==='auto') setBackground(); }, 60000);
    setBackground(); syncMusic();
    window.__homeV2 = {version:1, state:()=>({visible:canShow(), phase, background:map.style.backgroundImage, musicWanted, musicPaused:music.paused, volume:music.volume, musicSrc:music.src, originalActionCount:actions.size})};
    return true;
  };
  const observer = new MutationObserver(() => { if (install()) observer.disconnect(); });
  if (!install()) observer.observe(document.documentElement, {childList:true, subtree:true});
})();
