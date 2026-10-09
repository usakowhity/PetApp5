// uiRenderer.js
// PetApp5-Web Rendering Layer (PNG / MP4 判定 + Speech Bubble)

export function renderRabbit(action, phrase = "") {
    const area = document.getElementById("rabbit-area");
    const bubble = document.getElementById("speech-bubble");

    if (!area || !bubble) {
        console.error("UI要素が見つかりません: rabbit-area / speech-bubble");
        return;
    }

    // 安全確認：action が未定義の場合は描画しない
    if (!action || !action.image) {
        console.warn("renderRabbit: action または action.image が未定義です");
        return;
    }

    // 既存DOM構造を壊さないため、uiRendererが生成した描画要素だけ削除する
    area.querySelectorAll(".rabbit-media").forEach(el => el.remove());

    const imagePath = action.image;
    const isVideo = imagePath.endsWith(".mp4");

    if (isVideo) {
        // MP4優先（Idle Layer R17〜R19）
        const video = document.createElement("video");
        video.src = imagePath;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.maxWidth = "480px";
        video.classList.add("rabbit-media");

        // MP4再生失敗 → PNGフォールバック（PNGが存在する場合のみ成立）
        video.onerror = () => {
            console.warn("MP4再生に失敗:", imagePath);

            const pngPath = imagePath.replace(".mp4", ".png");

            const fallbackImg = document.createElement("img");
            fallbackImg.src = pngPath;
            fallbackImg.alt = "rabbit";
            fallbackImg.style.maxWidth = "480px";
            fallbackImg.classList.add("rabbit-media");

            if (video.parentNode === area) {
                video.remove();
            }
            area.insertBefore(fallbackImg, bubble);
        };

        area.insertBefore(video, bubble);

    } else {
        // PNG（R01〜R16）
        const img = document.createElement("img");
        img.src = imagePath;
        img.alt = "rabbit";
        img.style.maxWidth = "480px";
        img.classList.add("rabbit-media");
        area.insertBefore(img, bubble);
    }

    // phrase（吹き出し）表示
    bubble.textContent = phrase || "";
}

// ウサギの描画要素と吹き出しを消す（DOM構造は維持）
export function clearRabbit() {
    const area = document.getElementById("rabbit-area");
    const bubble = document.getElementById("speech-bubble");

    if (area) {
        area.querySelectorAll(".rabbit-media").forEach(el => el.remove());
    }
    if (bubble) {
        bubble.textContent = "";
    }
}
