
// ----------------------------------
// 全域狀態
// ----------------------------------
let introPhase = "loop";
let overlayStep = 0;
let arStarted = false;

const $ = s => document.querySelector(s);

// 黑幕
const blackout = document.getElementById("tv-blackout");

function blackoutOn()  { blackout.classList.add("active"); }
function blackoutOff() { blackout.classList.remove("active"); }


// ----------------------------------
// 9:16 Scale
// ----------------------------------
function calculateScale() {
  const scale = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
  document.documentElement.style.setProperty("--scale-factor", scale);
}
calculateScale();
window.addEventListener("resize", calculateScale);


// ----------------------------------
// DOM
// ----------------------------------
const introContainer = $("#intro-container");
const introVideo     = $("#intro-video");

const typeScreen     = $("#typewriter-screen");
const typeTextEl     = $("#typewriter-text");

const type2Screen    = $("#typewriter2-screen");
const type2TextEl    = $("#typewriter2-text");

const arScene        = $("#ar-scene");
const cameraOverlay  = $("#camera-overlay");
const cameraFade     = $("#camera-fade");

const scanOverlay    = $("#scan-overlay");
const scanCountdown  = $("#scan-countdown");

const ratingOverlay   = $("#rating-overlay");
const lowScoreOverlay = $("#low-score-overlay");
const photoOffOverlay = $("#photo-off-overlay");

const btnLowOff  = $("#btn-off");
const btnLowNext = $("#btn-next");
const btnEndOff  = $("#btn-end-off");


// ----------------------------------
// Hands video
// ----------------------------------
let handsVideo = document.getElementById("mk-video");
if (!handsVideo) {
  handsVideo = document.createElement("video");
  handsVideo.id = "mk-video";
  handsVideo.playsInline = true;
  handsVideo.muted = true;
  handsVideo.style.display = "none";
  document.body.appendChild(handsVideo);
}


// ----------------------------------
// 隱藏全部 overlay
// ----------------------------------
function hideAll() {
  [
    cameraOverlay, scanOverlay,
    ratingOverlay, lowScoreOverlay,
    photoOffOverlay, typeScreen, type2Screen
  ].forEach(el => el && (el.style.display = "none"));
}



// ===============================
// TV（開機 / 關機）
// ===============================
function playTVOpen(el) {

  blackoutOff(); // 進畫面前 → 確保黑幕退掉

  el.style.display = "flex";
  el.classList.remove("tv-off");
  void el.offsetWidth;
  el.classList.add("tv-on");
}

function playTVOff(el, cb) {

  blackoutOn(); // 關機瞬間 → 黑幕蓋上

  el.classList.remove("tv-on");
  el.classList.add("tv-off");

  setTimeout(() => {

    el.style.display = "none";
    el.classList.remove("tv-off");

    cb && cb();

  }, 450);
}



// ===============================
// 第一段 打字機
// ===============================
function showLoadingText(text){

    const el = document.getElementById("loading-text");
    if(el) el.textContent = text;
  const box = document.getElementById("loading-box");
  if(box) box.style.display = "block";
}

function startFakeLoading(targetPercent){
  const bar  = document.getElementById("progress-bar");
  const text = document.getElementById("progress-text");

  let p = 0;
  const t = setInterval(()=>{
    p++;
    bar.style.width = p + "%";
    text.textContent = p + "%";

    if(p >= targetPercent){
      clearInterval(t);
    }
  }, 120);
}

const TYPEWRITER_TEXT = `
> ……
歡迎來到「模範生」系統

正在同步群體審美數據...計算你的外貌相似度

你的臉部特徵將被送入模型進行比對

請正視鏡頭 並保持中立表情
任何微小變化都將被記錄

———

即將進入評分程序
請準備好被觀看
`;

let typingIndex = 0;
let typingTimer = null;

function startTypewriterEffect() {

  typeTextEl.textContent = "";
  typingIndex = 0;
  clearInterval(typingTimer);

  typingTimer = setInterval(() => {

    if(typingIndex >= TYPEWRITER_TEXT.length){
      clearInterval(typingTimer);
    
     
   // ✅ 打字機結束 → 第一次進度條（10%）
showLoadingText("系統正在載入模型標準");
startFakeLoading(10);

    
      return;
    }
    

    typeTextEl.textContent =
      TYPEWRITER_TEXT.slice(0, typingIndex++);

  }, 50);
}

function showTypewriterScreen() {

  playTVOpen(typeScreen);
  startTypewriterEffect();
  setTimeout(() => {

    playTVOff(typeScreen, () => enterAR());

  }, 8000);
}



// ===============================
// INTRO 影片流程
// ===============================

function playFullIntroOnce() {
  introPhase = "full";
  introVideo.loop = false;
  introVideo.muted = false; // 1. 這裡改為 false，準備播放聲音
  introVideo.currentTime = 0;
  
  // 嘗試播放
  introVideo.play().catch((err) => {
    console.log("自動播放被攔截，等待使用者點擊...");
    showStartButton(); // 如果被瀏覽器擋住，就顯示按鈕
  });

  introVideo.onended = () => {
    introVideo.onended = null;
    showTypewriterScreen();
  };
}


// ===============================
// 進入 AR（攝影畫面）
// ===============================
function enterAR() {

  if (arStarted) return;
  arStarted = true;

  introVideo?.pause();
  introContainer && (introContainer.style.display = "none");

  arScene.style.display = "block";
  cameraOverlay.style.display = "flex";

  blackoutOff(); // 鏡頭出現前一定先退黑幕

  if (cameraFade) {
    cameraFade.style.display = "block";
    cameraFade.classList.remove("show");
    requestAnimationFrame(() => cameraFade.classList.add("show"));
  }

  setTimeout(startScanSequence, 2000);
}



// ===============================
// 掃描倒數
// ===============================

let faceInterval;
let scanLineInterval;
let scanTimer;

function startScanSequence() {
  console.log("開始 15 秒掃描序列...");
  
  const scanMusic = document.getElementById("scan-music");
  if (scanMusic) {
    scanMusic.currentTime = 0;
    scanMusic.volume = 0.2;
    scanMusic.play().catch(()=>{});
  }
  
  const scanOverlay = $("#scan-overlay");
  const faceRect = $("#face-rect");
  const randomData = $("#random-data");
  const scanCountdown = $("#scan-countdown");
  const lineH = $("#scan-line-h");
  const lineV = $("#scan-line-v");

  // 1. 顯示外層
  scanOverlay.style.display = "block";
  scanOverlay.classList.add("glitch-active");

  // 2. 紅框與長數字隨機跳動 (每 0.15 秒)
  clearInterval(faceInterval);
  faceInterval = setInterval(() => {
    const maxX = 1080 - 300;
    const maxY = 1920 - 350;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    faceRect.style.left = x + "px";
    faceRect.style.top = y + "px";
    faceRect.style.display = "block";

    // 生成更長的隨機碼 (例如: 8A2F9B10-C2E4)
    const p1 = Math.floor(Math.random() * 0xffffffff).toString(16).padEnd(8, '0');
    const p2 = Math.floor(Math.random() * 0xffff).toString(16).padEnd(4, '0');
    randomData.textContent = `${p1}-${p2}`.toUpperCase();
  }, 150);

  // 3. 兩條 1px 紅色細線交集掃描 (每 0.03 秒更新位置)
  clearInterval(scanLineInterval);
  scanLineInterval = setInterval(() => {
    const time = performance.now() * 0.002;
    // 水平線上下跑
    const yH = (Math.sin(time) * 0.5 + 0.5) * 1920;
    lineH.style.top = yH + "px";
    // 垂直線左右跑 (速度稍快一點點作區隔)
    const xV = (Math.cos(time * 0.8) * 0.5 + 0.5) * 1080;
    lineV.style.left = xV + "px";
  }, 30);

  // 4. 強制 15 秒自動跳轉邏輯
  let timeLeft = 5; // 設定為 15 秒
  scanCountdown.textContent = timeLeft;
  
  clearInterval(scanTimer);
  scanTimer = setInterval(() => {
    timeLeft--;
    
    if (timeLeft <= 0) {
      // 停止所有計時器
      clearInterval(scanTimer);
      clearInterval(faceInterval);
      clearInterval(scanLineInterval);
      
      // 隱藏掃描層
      scanOverlay.style.display = "none";
      scanOverlay.classList.remove("glitch-active");
      
      if (scanMusic) {
        scanMusic.pause();
        scanMusic.currentTime = 0;
      }

      console.log("15秒時間到，自動跳轉...");
      showPreRatingTypewriter(); // 執行下一個動作
    } else {
      scanCountdown.textContent = timeLeft;
    }
  }, 1000); // 每一秒跑一次
}
// ===============================
// 第二段 打字機
// ===============================
const TYPEWRITER2_TEXT = `
> 臉部資料擷取完成

系統正在生成你的個人評分表
請保持靜止

———

演算法運行中
請勿關閉視窗
`;

let type2Index = 0;
let type2Timer = null;

function startTypewriter2() {

  type2TextEl.textContent = "";
  type2Index = 0;
  clearInterval(type2Timer);

  type2Timer = setInterval(() => {

    if (type2Index >= TYPEWRITER2_TEXT.length) {
      clearInterval(type2Timer);
      return;
    }

    type2TextEl.textContent =
      TYPEWRITER2_TEXT.slice(0, type2Index++);

  }, 45);
}

function showPreRatingTypewriter() {
  console.log("進入 showPreRatingTypewriter...");

  // ✅ 修正點：在這裡重新獲取 DOM，或者直接用 $("#scan-overlay")
  const scanOverlay = document.getElementById("scan-overlay");
  if (scanOverlay) scanOverlay.style.display = "none";

  // 確保畫面乾淨
  hideAll();

  // 播放電視開啟效果
  playTVOpen(type2Screen);
  startTypewriter2();

  /* ⭐ 第二次 loading 設定 */
  const box2  = document.getElementById("loading2-box");
  const bar2  = document.getElementById("progress2-bar");
  const text2 = document.getElementById("progress2-text");

  if (box2 && bar2 && text2) {
    box2.style.display = "block";
    bar2.style.width = "0%";
    text2.textContent = "0%";

    let p = 0;
    const t = setInterval(() => {
      p++;
      bar2.style.width = p + "%";
      text2.textContent = p + "%";
      if (p >= 30) clearInterval(t);
    }, 120);
  }

  // 設定 20 秒後關閉打字機並顯示評分表
  setTimeout(() => {
    console.log("打字機時間結束，準備顯示評分表...");
    playTVOff(type2Screen, () => {
      blackoutOn();

      setTimeout(() => {
        ratingOverlay.style.display = "flex";
        ratingOverlay.classList.remove("fax-print");
        void ratingOverlay.offsetWidth;
        ratingOverlay.classList.add("fax-print");

        const faxSound = document.getElementById("fax-sound");
        if (faxSound) {
          faxSound.currentTime = 0;
          faxSound.volume = 0.85;
          faxSound.play().catch(()=>{});
        }

        setTimeout(() => blackoutOff(), 200);
        overlayStep = 2;

        // ⭐ 14 秒後跳轉到 step3.html
        setTimeout(() => {
          console.log("跳轉至 step3.html");
          window.location.href = "step3.html";
        }, 8000);

      }, 280);
    });
  }, 5000); 
}


// ===============================
// 06 POPUP：按讚 / OFF
// ===============================
function goLowScoreNext() {

  stopHandsCamera();

  lowScoreOverlay.style.display = "none";
  ratingOverlay.style.display   = "none";

  window.location.href = "makeup.html";
}

function goLowScoreOff() {

  stopHandsCamera();

  lowScoreOverlay.style.display = "none";
  photoOffOverlay.style.display = "flex";

  overlayStep = 5;
}

btnLowNext && (btnLowNext.onclick = goLowScoreNext);
btnLowOff  && (btnLowOff.onclick  = goLowScoreOff);
btnEndOff  && (btnEndOff.onclick  = () => location.reload());



// ===============================
// MediaPipe Hands
// ===============================
const hands = new Hands({
  locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
});

hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 0,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.5,
});

let thumbUpFrames   = 0;
let thumbDownFrames = 0;
let lastThumbAction = 0;

const HOLD_NEED   = 2;
const COOLDOWN_MS = 1200;

function isThumbUp(lm){ return lm[4].y < lm[5].y - 0.02; }
function isThumbDown(lm){ return lm[4].y > lm[5].y + 0.02; }

function handleHandsResults(results) {

  if (overlayStep !== 3) return;

  if (!results.multiHandLandmarks?.length) {
    thumbUpFrames = thumbDownFrames = 0;
    return;
  }

  const lm  = results.multiHandLandmarks[0];
  const now = performance.now();

  const up   = isThumbUp(lm);
  const down = isThumbDown(lm);

  if (up)  { thumbUpFrames++;  thumbDownFrames = 0; }
  else if (down){ thumbDownFrames++; thumbUpFrames = 0; }
  else     { thumbUpFrames = thumbDownFrames = 0; }

  if (now - lastThumbAction < COOLDOWN_MS) return;

  if (thumbUpFrames >= HOLD_NEED) {
    lastThumbAction = now;
    goLowScoreNext();
    return;
  }

  if (thumbDownFrames >= HOLD_NEED) {
    lastThumbAction = now;
    goLowScoreOff();
  }
}

hands.onResults(handleHandsResults);



// ===============================
// Hands Camera
// ===============================
let handsCamera = null;
let handsCameraStarted = false;

function startHandsCamera() {

  if (handsCameraStarted) return;
  handsCameraStarted = true;

  navigator.mediaDevices.getUserMedia({ video:true })
  .then(stream => {

    handsVideo.srcObject = stream;

    handsCamera = new Camera(handsVideo, {
      onFrame: async () => {
        if (!handsVideo.videoWidth) return;
        await hands.send({ image: handsVideo });
      },
      width:1080,
      height:1920
    });

    handsCamera.start();
  });
}

function stopHandsCamera() {

  if (!handsCameraStarted) return;
  handsCameraStarted = false;

  try { handsCamera?.stop(); } catch{}

  if (handsVideo?.srcObject) {
    handsVideo.srcObject.getTracks().forEach(t=>t.stop());
    handsVideo.srcObject = null;
  }
}
// ===============================
// INIT - 初始化與聲音解鎖
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  hideAll();

  // 1. 預設隱藏 AR 畫面，顯示 Intro 影片容器
  cameraFade?.classList.remove("show");
  cameraFade && (cameraFade.style.display = "none");
  arScene.style.display = "none";
  introContainer.style.display = "block";

  // 2. 確保在 INIT 時黑幕退掉
  blackoutOff(); 

  // --- 聲音解鎖邏輯 ---

  const startOverlay = document.getElementById("click-to-start");

  // 封裝解鎖與播放的邏輯
  function unlockAndPlay() {
    if (!startOverlay) return; // 防止重複執行
    
    console.log("🔊 聲音已解鎖，開始播放影片");

    // 淡出並移除啟動遮罩
    startOverlay.style.opacity = "0";
    setTimeout(() => {
        startOverlay.remove(); // 徹底從 DOM 中移除
    }, 500); // 與 CSS transition 時間一致

    // 關鍵：在使用者互動事件內取消靜音並播放
    const introVideo = document.getElementById("intro-video");
    if (introVideo) {
        introVideo.muted = false; // 取消靜音
        
        // 嘗試播放，並處理潛在的錯誤
        const playPromise = introVideo.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // 播放成功
                console.log("影片開始播放 (有聲音)");
            }).catch(error => {
                // 播放失敗 (例如瀏覽器仍攔截)
                console.error("影片播放失敗:", error);
                // 這裡可以加入後備邏輯，例如顯示一個小的播放按鈕
            });
        }
    }

    // 預先解鎖其他音效 (防止後續音效也沒聲音)
    const scanMusic = document.getElementById("scan-music");
    const faxSound = document.getElementById("fax-sound");
    [scanMusic, faxSound].forEach(p => {
        if (p) {
            // 快速播放後暫停，解鎖音訊上下文
            p.play().then(() => p.pause()).catch(() => {});
        }
    });

    // 呼叫原本的 intro 流程 (確保 loop: false 和 onended 事件正確設定)
    playFullIntroOnce();
  }

  // A. 監聽點擊事件
  startOverlay.addEventListener("click", unlockAndPlay, { once: true });

  // B. 監聽按鍵事件 (Enter 鍵)
  window.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        unlockAndPlay();
    }
  }, { once: true }); // ensure it only happens once

  console.log("✅ script ready（等待使用者點擊圖片或按 Enter 開啟聲音）");
});