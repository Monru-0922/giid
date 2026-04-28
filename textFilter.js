/* ===============================
   9:16 螢幕比例（與前頁一致）
=============================== */
function resize(){
  const s = Math.min(
    window.innerWidth / 1080,
    window.innerHeight / 1920
  );
  document.documentElement.style.setProperty("--scale-factor", s);
}
resize();
window.addEventListener("resize", resize);

/* ===============================
   DOM
=============================== */
const video  = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx    = canvas.getContext("2d");

/* ===============================
   設定
=============================== */
const AUTO_SHOT_MS = 5000;

/* ===============================
   載入貼臉文字圖片
=============================== */
const textImg = new Image();
textImg.src = "image/text1.png";

/* ===============================
   開鏡頭
=============================== */
navigator.mediaDevices.getUserMedia({ video: { facingMode:"user" } })
.then(stream => {
  video.srcObject = stream;

  // 等 video 有實際尺寸
  const wait = setInterval(() => {
    if (video.videoWidth > 0) {
      clearInterval(wait);
      startFaceMesh();
      startAutoShot();
    }
  }, 100);
})
.catch(err => console.error("Camera error:", err));

/* ===============================
   FaceMesh 初始化
=============================== */
let faceMesh = null;
let cam      = null;

function startFaceMesh(){
  faceMesh = new FaceMesh({
    locateFile: f =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.6,
    minTrackingConfidence: 0.6
  });

  cam = new Camera(video, {
    onFrame: async () => {
      if (!video.videoWidth) return;
      await faceMesh.send({ image: video });
    },
    width: 1080,
    height: 1920
  });

  cam.start();
  faceMesh.onResults(drawFace);
}

/* ===============================
   FaceMesh → 畫文字濾鏡
=============================== */
function drawFace(results){
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;

  canvas.width  = w;
  canvas.height = h;

  ctx.clearRect(0,0,w,h);

  if (!results.multiFaceLandmarks || !results.multiFaceLandmarks.length) return;
  const lm = results.multiFaceLandmarks[0];

  // 臉左右邊界（鏡像）
  const L = (1 - lm[234].x) * w;
  const R = (1 - lm[454].x) * w;

  // 額頭位置
  const T = lm[10].y * h;

  const faceW = Math.abs(R - L);

  // 文字大小（跟你原本一樣）
  const imgW = faceW * 5;
  const imgH = faceW * 3;

  const cx = (L + R) / 2;
  const x  = cx - imgW / 1.9;
  const y  = T  - imgH * 0.25;

  ctx.drawImage(textImg, x, y, imgW, imgH);
}

/* ===============================
   啟動自動拍照 (補回這段，解決報錯)
=============================== */
function startAutoShot() {
  console.log("⏱ 啟動 8 秒自動拍照倒數...");
  // 這裡的 8000 是指「進入頁面後多久拍照」
  // 拍照後 takePhotoAndGo 裡面還會再停 8 秒讓使用者看濾鏡
  setTimeout(() => {
    takePhotoAndGo();
  }, 5000); // 建議設 5 秒，讓使用者有時間對準臉
}

/* ===============================
   拍照 + 延遲跳轉 (Step 5 修正版：合成人臉+濾鏡+藍綠框)
=============================== */
async function takePhotoAndGo() {
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;

  // 1. 建立一個 1080x1920 的合成畫布 (確保比例為 9:16)
  const snap = document.createElement("canvas");
  snap.width  = 1080;
  snap.height = 1920;
  const sctx  = snap.getContext("2d");

  // ① 畫底層：鏡像攝影機 (手動翻轉)
  sctx.save();
  sctx.translate(1080, 0);
  sctx.scale(-1, 1);
  // 這裡將原始影片填滿 1080x1920
  sctx.drawImage(video, 0, 0, 1080, 1920);
  sctx.restore();

  // ② 畫中層：疊上目前畫面上正在跑的文字濾鏡 (canvas)
  sctx.drawImage(canvas, 0, 0, 1080, 1920);

  // ③ 畫頂層：疊上藍綠色相框 (.frame-overlay)
  // 請確保 HTML 裡有 <img class="frame-overlay" src="image/你的藍綠框.png">
  const frameImg = document.querySelector(".frame-overlay"); 
  if (frameImg && frameImg.complete) {
      sctx.drawImage(frameImg, 0, 0, 1080, 1920);
      console.log("🎨 藍綠色相框已合成");
  } else {
      console.warn("⚠️ 找不到相框元素或圖片尚未載入");
  }

  // ④ 執行存檔 (JPEG 品質 0.9 以利後續列印)
  const photo = snap.toDataURL("image/jpeg", 0.9);
  
  try {
    // 同時存入 photo_03 (給 final 列印) 與 capturedImage (給下一頁顯示)
    localStorage.setItem("photo_03", photo); 
    localStorage.setItem("capturedImage", photo); 
    console.log("✅ photo_03 完整合成圖存檔成功");
  } catch (e) {
    console.error("❌ 存檔失敗，可能是 LocalStorage 空間不足", e);
  }

  // ⑤ 倒數 5 秒跳轉
  let timeLeft = 5;
  const countdownDisplay = document.getElementById("countdown-text");
  
  const jumpTimer = setInterval(() => {
    timeLeft--;
    if (countdownDisplay) {
        countdownDisplay.innerText = `分析完成！將於 ${timeLeft} 秒後跳轉...`;
    }
    
    if (timeLeft <= 0) {
      clearInterval(jumpTimer);
      window.location.href = "post.html"; 
    }
  }, 1000); 
}