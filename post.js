// ===============================
// 模範生 IG 貼文頁 post.js
// ===============================

// DOM
const postImage     = document.getElementById("postImage");
const likeBtn       = document.getElementById("likeBtn");
const likesCount    = document.getElementById("likesCount");
const commentInput = document.getElementById("commentInput"); 
const commentsList  = document.getElementById("commentsList");

// -------------------------------
// 讀取上一頁資料
// -------------------------------
const finalScore = localStorage.getItem("finalScore") || 0;
const photoData = localStorage.getItem("capturedImage");

// 修正：賦值邏輯留一組即可
if (photoData) {
  postImage.src = photoData;
} else {
  postImage.src = "image/default.jpg";
}

// -------------------------------
// Like 功能
// -------------------------------
let liked = false;
let likes = Math.floor(Math.random() * 100) + 20;

likesCount.innerText = `${likes} likes`;

likeBtn.addEventListener("click", () => {
  liked = !liked;
  likeBtn.innerText = liked ? "❤️" : "♡";
  likes += liked ? 1 : -1;
  likesCount.innerText = `${likes} likes`;
});

// -------------------------------
// 留言功能 (爆炸堆疊版)
// -------------------------------

commentInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && commentInput.value.trim() !== "") {
    createLocalExplosion(commentInput.value);
    commentInput.value = "";
  }
});

function createLocalExplosion(text) {
  if (!commentsList) return;

  const el = document.createElement("div");
  el.className = "exploding-comment";
  
  // 請確認你的圖片檔案放在 image 資料夾，且檔名是 text2.png 或 text2.jpg
  el.innerHTML = `
    <img src="image/text2.png" /> 
    <span><strong>USER</strong> ${text}</span>
  `;

  commentsList.appendChild(el);
  el.offsetHeight; // 強制重繪

  // 設定爆炸物理座標
  const randomX = Math.floor(Math.random() * 300) - 50;
  const randomY = Math.floor(Math.random() * 400) + 50;
  const randomRotate = Math.floor(Math.random() * 20) - 10;

  requestAnimationFrame(() => {
    el.classList.add("active");
    el.style.left = `${randomX}px`;
    el.style.bottom = `${randomY}px`;
    el.style.transform = `scale(1) rotate(${randomRotate}deg)`;
  });
}

// ===============================
// 1. 螢幕適配預覽
// ===============================
function autoResize() {
    const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920) * 0.95;
    const scaler = document.getElementById('preview-scaler');
    if (scaler) {
        scaler.style.setProperty('--js-scale', s);
    }
}
window.addEventListener('resize', autoResize);
autoResize();

// ===============================
// 3. 截圖、存檔與自動跳轉 (step6.html)
// ===============================

// 🟢 定義：執行截圖並跳轉的非同步函式
async function autoCaptureAndRedirect() {
    const target = document.querySelector(".ig-phone"); // 抓取要拍照的區域
    if (!target) return;

    try {
        const canvas = await html2canvas(target, {
            useCORS: true,
            backgroundColor: "#000",
            width: window.innerWidth,
            height: window.innerHeight,
            scale: 1,
            x: 0,
            y: 0,
            scrollX: 0,
            scrollY: 0,
        });

        // 將畫面轉為 JPG 並存入資料庫
        const screenshot = canvas.toDataURL("image/jpeg", 0.7);
        localStorage.setItem("photo_04", screenshot);
        
        // 拍照完成後，給予 1.5 秒緩衝再跳轉
        setTimeout(() => {
            window.location.href = "step6.html"; // 🟢 目標頁面
        }, 1500);
    } catch (err) {
        console.error("截圖失敗:", err);
    }
}

// 🟢 執行：設定 10 秒倒數計時器
let timeLeft = 10; 

const timer = setInterval(() => {
    timeLeft--;

    // 當時間剩下 2 秒時，啟動截圖程式 (預留處理時間)
    if (timeLeft === 2) {
        clearInterval(timer); // 停止計時器以免重複執行
        autoCaptureAndRedirect(); // 🟢 正式啟動合併後的函式
    }
}, 1000);