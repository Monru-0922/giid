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
// 強行鎖定 AR 畫面位置，防止 MindAR 亂跑
function lockARPosition() {
    const fix = (el) => {
        if (el) {
            el.style.setProperty('left', '0px', 'important');
            el.style.setProperty('top', '0px', 'important');
            el.style.setProperty('width', '100vw', 'important');
            el.style.setProperty('height', '100vh', 'important');
            // 🟢 修正：保留水平鏡像翻轉，否則畫面會崩潰
            el.style.setProperty('transform', 'scaleX(-1)', 'important');
        }
    };
    setInterval(() => {
        fix(document.getElementById('ar-scene'));
        fix(document.querySelector('.a-canvas'));
        // ⚠️ 注意：這裡暫時不要 fix(video)，讓 CSS 去管 video 就好
    }, 100);
}

// 啟動鎖定
lockARPosition();


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

  if (introVideo) {
      introVideo.pause();
      introVideo.src = ""; // 清空來源，釋放記憶體
      introVideo.load();
      introVideo.style.display = "none";
  }
  
  introContainer && (introContainer.style.display = "none");

  arScene.style.display = "block";
  cameraOverlay.style.display = "flex";
  
  blackoutOff();
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
    clearInterval(scanTimer);
    clearInterval(faceInterval);
    clearInterval(scanLineInterval);

    // 1. 🔊 立即關閉音效
    const scanMusic = document.getElementById("scan-music");
    if (scanMusic) { scanMusic.pause(); scanMusic.currentTime = 0; }

    // 2. 🧹 清空螢幕（最重要！）：把所有特效、文字全部瞬間藏起來
    const scanOverlay = document.getElementById("scan-overlay");
    if (scanOverlay) {
        // 直接用 display none 確保螢幕上「只有」最底層的攝像頭 Video
        scanOverlay.style.display = "none"; 
    }

  // 3. ⏳ 強制停頓 200 毫秒（這是快門緩衝）
    // 給瀏覽器時間把上面的 UI 刪掉，讓 video 畫面穩定下來
    setTimeout(() => {
        
        console.log("📸 準備擷取純淨人臉影像...");
        autoCaptureUser(); // 🟢 就在這個瞬間按快門！

        // 4. 拍完照後，再進入第二段打字機
        showPreRatingTypewriter(); 
        
    }, 200); // 200ms 是安全時間，肉眼看不出來，但對程式來說很久

    } else {
        scanCountdown.textContent = timeLeft;
    }
}, 1000);
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

// ...前面的代碼保持不變...

function showPreRatingTypewriter() {
    console.log("進入 showPreRatingTypewriter...");
    hideAll();

    const type2Screen = document.getElementById("typewriter2-screen");
    if (type2Screen) {
        type2Screen.style.display = "block";
        playTVOpen(type2Screen);
        startTypewriter2();
    }

    // --- 進度條邏輯 ---
    const box2 = document.getElementById("loading2-box");
    const bar2 = document.getElementById("progress2-bar");
    const text2 = document.getElementById("progress2-text");
    if (box2 && bar2 && text2) {
        box2.style.display = "block";
        let p = 0;
        const t = setInterval(() => {
            p++;
            bar2.style.width = p + "%";
            text2.textContent = p + "%";
            if (p >= 100) clearInterval(t);
        }, 50);
    }

    setTimeout(async () => {
   // 🎲 1. 隨機選底圖（加入防重複邏輯）
        const scoreOptions = ["image/score-01.jpg", "image/score-02.jpg", "image/score-03.jpg"];
        
        // 從瀏覽器紀錄中取得「上一次」顯示的圖片路徑
        const lastBG = localStorage.getItem("last_score_bg");
        let selectedBG;

        // 使用 do...while 迴圈：如果抽到的跟上次一樣，就重新抽一次
        do {
            selectedBG = scoreOptions[Math.floor(Math.random() * scoreOptions.length)];
        } while (selectedBG === lastBG);

        // 記住這一次的結果，供下一次比對
        localStorage.setItem("last_score_bg", selectedBG);

        const ratingBgEl = document.getElementById("rating-bg");
        if (ratingBgEl) {
            ratingBgEl.src = selectedBG;
            console.log("🎲 隨機選中（已過濾重複）:", selectedBG);
        }

        // 🎬 2. 顯示容器
        const ratingOverlay = document.getElementById('rating-overlay');
        if (ratingOverlay) {
            ratingOverlay.style.display = "flex";
            ratingOverlay.style.opacity = "1";
        }
        blackoutOff();

        // 📸 3. 裁切與畫五官到畫布上
        const faceData = localStorage.getItem("user_captured_photo");
        if (faceData) {
            const faceImg = new Image();
            faceImg.src = faceData;
            await new Promise(r => faceImg.onload = r);

            const featureSettings = [
                { id: 'crop-eye', s: [450, 400, 200, 150] },
                { id: 'crop-nose', s: [480, 600, 150, 150] },
                { id: 'crop-mouth', s: [450, 800, 200, 150] }
            ];

            featureSettings.forEach(f => {
                const canvas = document.getElementById(f.id);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    canvas.width = canvas.offsetWidth;
                    canvas.height = canvas.offsetHeight;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(faceImg, f.s[0], f.s[1], f.s[2], f.s[3], 0, 0, canvas.width, canvas.height);
                }
            });

            const userImg = document.getElementById('user-captured-photo');
            if (userImg) userImg.src = faceData;
        }

        // 🎬 4. 結束打字機，啟動「合成與跳轉」定時器
        // 🎬 4. 結束打字機
        playTVOff(type2Screen, async () => { // 🟢 這裡要加 async
            blackoutOff();
            showFinalRating();

            console.log("📍 評分表已顯示，10秒後截圖並跳轉...");

            setTimeout(async () => {
                console.log("🚀 開始合成存檔...");
                
                // 🟢 重要：確保截圖時 rating-overlay 是顯示的
                document.getElementById('rating-overlay').style.display = "flex";

                // 🟢 關鍵：必須確保 await 執行完畢
                const success = await generateFinalScoreImage();
                
                if (success) {
                    console.log("🚀 存檔完成，前往 Step 3");
                    window.location.href = "step3.html";
                } else {
                    console.error("❌ 存檔失敗，請檢查控制台紅字");
                }
            }, 10000); 
        });

    }, 6000); 
}

// ==========================================
// 🎨 核心合成函式：把螢幕上所有元素壓扁成一張圖
// ==========================================
async function generateFinalScoreImage() {
    console.log("🎨 正在截取評分結果...");
    
    // 🟡 修正 1：確保抓取的是包含內容的 wrapper
    const target = document.getElementById("rating-content-wrapper"); 
    
    if (!target) {
        console.error("❌ 找不到容器，截圖失敗");
        return false;
    }

    // 等待一下確保渲染完成
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const canvas = await html2canvas(target, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#000",
            width: target.offsetWidth,
            height: target.offsetHeight,
            // 🟡 修正 2：scale 改為 1 避免儲存空間爆滿 (QuotaExceededError)
            scale: 1 
        });

        // 🟡 修正 3：品質稍微降低到 0.7 確保寫入速度與空間
        const finalData = canvas.toDataURL('image/jpeg', 0.7);
        localStorage.setItem("photo_01", finalData); 
        console.log("✅ photo_01 截圖成功，長度:", finalData.length);
        return true;
    } catch (err) {
        console.error("❌ photo_01 截圖失敗:", err);
        return false;
    }
}
// INIT - 初始化與聲音解鎖//
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

//自動拍照與評分表顯示邏輯//

function autoCaptureUser() {
    console.log("📸 執行拍照程序...");
    // 找出攝影機 Video (避開待機影片)
    const allVideos = document.querySelectorAll('video');
    let video = null;
    allVideos.forEach(v => {
        if (v.id !== "intro-video" && v.id !== "mk-video") { video = v; }
    });
    if (!video) video = document.querySelector('video');

    const canvas = document.getElementById('capture-canvas');
    if (!video || !canvas || video.videoWidth === 0) return;

    const ctx = canvas.getContext('2d');

    // 🟢 修正：提高解析度至 1130x1500，這樣在 4K 電視上才清楚
    canvas.width = 1130;
    canvas.height = 1500;

    const sw = video.videoWidth;
    const sh = video.videoHeight;
    const targetRatio = 1130 / 1500;
    let dx, dy, dw, dh;

    if (sw / sh > targetRatio) {
        dw = sh * targetRatio; dh = sh;
        dx = (sw - dw) / 2; dy = 0;
    } else {
        dw = sw; dh = sw / targetRatio;
        dx = 0; dy = (sh - dh) / 2;
    }

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1); // 鏡像處理
    ctx.drawImage(video, dx, dy, dw, dh, 0, 0, 1130, 1500);
    ctx.restore();

    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    localStorage.setItem("user_captured_photo", dataUrl);
    
    const targetImg = document.getElementById('user-captured-photo');
    if (targetImg) targetImg.src = dataUrl;
    console.log("✅ 高解析度影像已存入");
}

function showFinalRating() {
    console.log("🛠️ 執行 showFinalRating (僅顯示)...");
    const ratingOverlay = document.getElementById('rating-overlay');
    // 注意：如果你希望最後看到的是合成後的「整張圖」，我們改抓 rating-bg 這個元素
    const ratingBgImg = document.getElementById('rating-bg'); 
    const finalScoreData = localStorage.getItem('photo_01');

    blackoutOff(); 

    if (ratingOverlay) {
        ratingOverlay.style.setProperty('display', 'flex', 'important');
        ratingOverlay.style.zIndex = "10000"; 
        ratingOverlay.style.opacity = "1";
    }

    if (finalScoreData && ratingBgImg) {
        ratingBgImg.src = finalScoreData; // 把合成好的圖直接換掉原本的底圖
        console.log("✅ 最終合成影像已顯示於 rating-bg");
    }
}