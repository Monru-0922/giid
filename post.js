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
// 🟢 留言功能 (訊息流漂浮版) - 替換原本的爆炸版
// -------------------------------

// 監聽 Enter 鍵
commentInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && commentInput.value.trim() !== "") {
    createFloatingComment(commentInput.value); // 呼叫新函式
    commentInput.value = "";
  }
});

// 產生漂浮訊息的函式
function createFloatingComment(text) {
  if (!commentsList) return;

  const el = document.createElement("div");
  el.className = "floating-comment"; // 對應 CSS 的新 Class
  
  el.innerHTML = `
    <img src="image/text2.png" /> 
    <span><strong>USER</strong> ${text}</span>
  `;

  // 加入容器，CSS 的 flex-direction: column-reverse 會自動由下而上堆疊
  commentsList.appendChild(el);

  // 4 秒後自動移除元素，保持頁面效能，確保截圖時不會過重
  setTimeout(() => {
    el.remove();
  }, 4000);
}

// 🟢 額外加碼：自動噴出讚美留言 (讓畫面不冷清)
const autoComments = ["這也太精緻了吧！", "模範生實至名歸 ✨", "跪求教學 😍", "質感好棒！", "這個濾鏡太強了...", "美到窒息！"];

function startAutoComments() {
  const autoInterval = setInterval(() => {
    // 當倒數剩下 3 秒（準備截圖）時停止產生，避免干擾畫面穩定
    if (typeof timeLeft !== 'undefined' && timeLeft <= 3) {
        clearInterval(autoInterval);
        return;
    }
    const randomText = autoComments[Math.floor(Math.random() * autoComments.length)];
    createFloatingComment(randomText);
  }, 1500); // 每 1.5 秒自動噴出一則
}

// 啟動自動留言
startAutoComments();


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

async function autoCaptureAndRedirect() {
    const target = document.querySelector(".ig-phone"); 
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

        const screenshot = canvas.toDataURL("image/jpeg", 0.7);
        localStorage.setItem("photo_04", screenshot);
        
        setTimeout(() => {
            window.location.href = "step6.html"; 
        }, 1500);
    } catch (err) {
        console.error("截圖失敗:", err);
    }
}

// 10 秒倒數計時
let timeLeft = 10; 

const timer = setInterval(() => {
    timeLeft--;

    if (timeLeft === 2) {
        clearInterval(timer); 
        autoCaptureAndRedirect(); 
    }
}, 1000);