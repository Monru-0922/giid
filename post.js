// ===============================
// 模範生 IG 貼文頁 post.js - 終極穩定版
// ===============================
// DOM
const postImage     = document.getElementById("postImage");
const likeBtn       = document.getElementById("likeBtn");
const likesCount    = document.getElementById("likesCount");
const commentInput  = document.getElementById("commentInput"); 
const commentsList  = document.getElementById("commentsList");

// -------------------------------
// 讀取上一頁資料
// -------------------------------
const photoData = localStorage.getItem("capturedImage");
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
// 🟢 留言功能
// -------------------------------
commentInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && commentInput.value.trim() !== "") {
    createFloatingComment(commentInput.value);
    commentInput.value = "";
  }
});

function createFloatingComment(text) {
  if (!commentsList) return;
  const el = document.createElement("div");
  el.className = "floating-comment";
  el.innerHTML = `<img src="image/text2.png" /><span><strong>USER</strong> ${text}</span>`;
  commentsList.appendChild(el);
  setTimeout(() => { el.remove(); }, 4000);
}

// -------------------------------
// 🟢 圖片隨機噴發
// -------------------------------
const floatContainer = document.getElementById("floating-images-container");
const pngSources = ["image/mess1.png","image/mess2.png","image/mess3.png","image/mess4.png","image/mess5.png","image/mess6.png","image/mess7.png","image/mess8.png"];

function spawnFloatingImage() {
  if (!floatContainer) return;
  const img = document.createElement("img");
  img.src = pngSources[Math.floor(Math.random() * pngSources.length)];
  img.className = "floating-png";
  const randomLeft = Math.floor(Math.random() * 90) + 5;
  const duration = Math.random() * 2 + 2; 
  const size = Math.floor(Math.random() * 800) + 800; 
  img.style.left = `${randomLeft}vw`;
  img.style.animationDuration = `${duration}s`;
  img.style.width = `${size}px`;
  floatContainer.appendChild(img);
  setTimeout(() => { img.remove(); }, duration * 1000);
}

// -------------------------------
// 螢幕適配
// -------------------------------
function autoResize() {
    const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920) * 0.95;
    const scaler = document.getElementById('preview-scaler');
    if (scaler) scaler.style.setProperty('--js-scale', s);
}
window.addEventListener('resize', autoResize);
autoResize();

// ===============================
// 🚀 關鍵：自動截圖、存檔（不列印）並跳轉
// ===============================

async function autoCaptureAndRedirect() {
    // 1. 立即上鎖，一輩子只能進來一次
    if (window.isFinalStepDone) return;
    window.isFinalStepDone = true;

    // 2. 徹底殺死所有的計時器，防止重複觸發
    if (window.imageInterval) clearInterval(window.imageInterval);
    if (window.countdownTimer) clearInterval(window.countdownTimer);

    console.log(`📸 執行最終存檔程序... 固定 ID: photo4`);
    
    const target = document.getElementById("preview-scaler") || document.body;

    try {
        const canvas = await html2canvas(target, {
            useCORS: true,
            backgroundColor: "#000",
            scale: 1.5, 
            logging: false
        });

        const screenshot = canvas.toDataURL("image/jpeg", 0.7);
        // 存入 localStorage 當備份
        localStorage.setItem("photo_04", screenshot);
        
        console.log(`📡 背景發送 Photo 4 至 Java...`);
        
        // 發送至 Java 伺服器，不帶 time 參數
        fetch(`http://localhost:8080/print?doPrint=false&id=photo4`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: screenshot })
        })
        .then(() => {
            console.log(`✅ photo4.jpg 已發送存檔`);
            // 延遲 300ms 確保 Java 寫入檔案後再跳轉
            setTimeout(() => {
                window.location.replace("step6.html");
            }, 300);
        })
        .catch((err) => {
            console.error("發送失敗:", err);
            window.location.replace("step6.html");
        });

    } catch (err) {
        console.error("截圖失敗:", err);
        window.location.replace("step6.html");
    }
} // 🟢 確保這裡有閉合大括號
// -------------------------------
// 啟動圖片噴發
// -------------------------------
window.imageInterval = setInterval(() => {
    if (typeof timeLeft !== 'undefined' && timeLeft <= 2) {
        clearInterval(window.imageInterval);
        return;
    }
    spawnFloatingImage();
}, 300);

// -------------------------------
// 10 秒倒數與觸發
// -------------------------------
let timeLeft = 10; 
window.countdownTimer = setInterval(() => {
    timeLeft--;
    console.log("⏱️ 倒數:", timeLeft);

    if (timeLeft <= 2) {
        // 時間一到，先清除計時器再執行
        clearInterval(window.countdownTimer); 
        autoCaptureAndRedirect(); 
    }
}, 1000);