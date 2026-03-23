// ===============================
// 模範生 IG 貼文頁 post.js
// ===============================

// DOM
const postImage     = document.getElementById("postImage");
const glitchScore   = document.getElementById("glitchScore");
const likeBtn       = document.getElementById("likeBtn");
const likesCount    = document.getElementById("likesCount");
const commentInput  = document.getElementById("commentInput");
const commentsList  = document.getElementById("commentsList");

// -------------------------------
// 讀取上一頁資料
// -------------------------------

const finalScore = localStorage.getItem("finalScore") || 0;
const photoData = localStorage.getItem("capturedImage");

if (photoData) {
  postImage.src = photoData;
} else {
  postImage.src = "image/default.jpg";
}


if (photoData) {
  postImage.src = photoData;
} else {
  postImage.src = "image/default.jpg"; // 保底
}

glitchScore.innerText = `最終分數：${finalScore} 分`;

// -------------------------------
// 分數對應語言（你可以再調荒謬感）
// -------------------------------
if (finalScore >= 80) {
  glitchScore.innerText += "｜模範生";
} else if (finalScore >= 50) {
  glitchScore.innerText += "｜合格";
} else {
  glitchScore.innerText += "｜待加強";
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
// 留言功能
// -------------------------------
commentInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && commentInput.value.trim() !== "") {
    const comment = document.createElement("div");
    comment.className = "comment";
    comment.innerHTML = `<strong>USER</strong> ${commentInput.value}`;
    commentsList.prepend(comment);
    commentInput.value = "";
  }
});
// ===============================
// 自動倒數、截圖並跳轉
// ===============================

// 設定倒數秒數
let timeLeft = 5; 
const countdownDisplay = document.getElementById("countdown-text");

const timer = setInterval(() => {
    timeLeft--;
    if (countdownDisplay) {
        countdownDisplay.innerText = `頁面將於 ${timeLeft} 秒後自動跳轉拍照列印...`;
    }

    // 在倒數結束前 2 秒先執行截圖流程，確保準時跳轉
    if (timeLeft === 2) {
        autoCaptureAndRedirect();
        clearInterval(timer); // 停止計時器
    }
}, 1000);
async function autoCaptureAndRedirect() {
  console.log("🚀 啟動自動截圖流程...");

  const btn = document.getElementById("btn-end-post");
  if (btn) btn.style.visibility = "hidden";

  const target = document.querySelector(".ig-phone");

  if (!target) {
      window.location.href = "final.html";
      return;
  }

  // 取得目標元素在視窗中的絕對位置
  const rect = target.getBoundingClientRect();

  try {
      const images = target.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      // 💡 關鍵修正：加入 x, y, width, height 參數強制校準
      const canvas = await html2canvas(target, {
          useCORS: true,
          allowTaint: false,
          backgroundColor: "#000",
          scale: 2,
          // 以下四行是為了解決裁切偏移問題
          x: 0, 
          y: 0,
          scrollX: 0,
          scrollY: 0,
          width: target.offsetWidth,
          height: target.offsetHeight,
          // 確保截圖時考慮到當前的視窗捲動位移
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight
      });

      const screenshot = canvas.toDataURL("image/png");
      
      try {
          localStorage.setItem("post_shot", screenshot);
      } catch (e) {
          localStorage.setItem("post_shot", canvas.toDataURL("image/jpeg", 0.7));
      }

      setTimeout(() => {
          window.location.href = "final.html";
      }, 1500);

  } catch (err) {
      console.error("自動截圖錯誤:", err);
      window.location.href = "final.html";
  }
} 