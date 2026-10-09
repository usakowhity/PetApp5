// app.js v3.2.7（公開前・完全統合版）
// --------------------------------------------
// PetApp5-Web: Direct Talk + Diary + Idle Layer
// v3.2.6 の構造を完全維持しつつ、Direct Talk辞書を修正・追加
// --------------------------------------------

import { renderRabbit, clearRabbit } from "./uiRenderer.js";
import { selectRabbitAction } from "./rabbitActionSelector.js";

// ペット名（初期値）
let petName = "レオ";

// -----------------------------
// JSONロード
// -----------------------------
async function loadActions() {
    try {
        const response = await fetch("./data/rabbit_actions.json");
        return await response.json();
    } catch (error) {
        console.error("Error loading rabbit_actions.json:", error);
        return null;
    }
}

// -----------------------------
// Direct Talk（音声認識）
// -----------------------------
function startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("このブラウザは音声認識に対応していません。");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        document.getElementById("speech-result").textContent = text;

        console.log("Speech recognized:", text);

        if (!text.startsWith(petName)) {
            console.log("Not DirectTalk.");
            return;
        }

        const intentText = text.replace(petName, "").trim();
        const actions = await loadActions();

        let actionId = null;

        // -----------------------------
        // Direct Talk 辞書（v3.2.7）
        // -----------------------------

        // あいさつ（修正）
        if (intentText.includes("おはよう")) actionId = "R10";
        else if (intentText.includes("元気")) actionId = "R11";

        // 感情・休息（かわいい判定強化＋おりこう＋お利口）
        else if (intentText.match(/かわいい|可愛い|カワイイ|おりこう|お利口/)) actionId = "R14";   // 喜び
        else if (intentText.includes("おやすみ")) actionId = "R15";                                   // 休息
        else if (intentText.includes("ねんね")) actionId = "R08";                                     // 追加：寝る系

        // 呼びつけ（追加）
        else if (intentText.includes("おいで")) actionId = "R16";                                     // 呼びつけ

        // 食べ物
        else if (intentText.includes("ごはん")) actionId = "R19";
        else if (intentText.includes("牧草")) actionId = "R17";
        else if (intentText.includes("チモシー")) actionId = "R17";

        // 飲み物
        else if (intentText.includes("水") || intentText.includes("お水")) actionId = "R18";

        // お腹すいた
        else if (intentText.includes("お腹") || intentText.includes("すいた")) actionId = "R03";

        if (!actionId) {
            console.log("No matching intent.");
            return;
        }

        const action = actions[actionId];
        const phrase = action.short_phrases?.length
            ? action.short_phrases[Math.floor(Math.random() * action.short_phrases.length)]
            : "";

        renderRabbit(action, phrase);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
    };

    recognition.start();
}

// -----------------------------
// Diary → Selector（軽量ルールベース）
// -----------------------------
async function processDiary() {
    const diaryText = document.getElementById("diary-input").value.trim();
    if (!diaryText) {
        alert("日記が空です。");
        return;
    }

    const actions = await loadActions();
    if (!actions) return;

    function detectEmotionNeed(text) {
        const t = text;

        // 疲れ
        if (t.match(/疲|しんど|きつ|だる|眠い|眠た/)) {
            return {
                emotions: [{ label: "fatigue_apathy", score: 1.0 }],
                needs: [{ label: "quiet_rest", score: 1.0 }]
            };
        }

        // 悲しみ
        if (t.match(/悲|つら|泣|涙|えーん|ガーン|ショック/)) {
            return {
                emotions: [{ label: "sadness", score: 1.0 }],
                needs: [{ label: "companionship", score: 1.0 }]
            };
        }

        // 不安
        if (t.match(/不安|心配|怖|びくびく/)) {
            return {
                emotions: [{ label: "anxiety_fear", score: 1.0 }],
                needs: [{ label: "reassurance", score: 1.0 }]
            };
        }

        // 寂しさ
        if (t.match(/寂|孤独|しゅん/)) {
            return {
                emotions: [{ label: "loneliness", score: 1.0 }],
                needs: [{ label: "companionship", score: 1.0 }]
            };
        }

        // 喜び
        if (t.match(/嬉|楽し|よかった|ご機嫌|ラッキー/)) {
            return {
                emotions: [{ label: "joy", score: 1.0 }],
                needs: [{ label: "share_joy", score: 1.0 }]
            };
        }

        // 怒り
        if (t.match(/怒|おこ|イラ|むか|プンプン/)) {
            return {
                emotions: [{ label: "anger", score: 1.0 }],
                needs: [{ label: "relaxation", score: 1.0 }]
            };
        }

        // fallback
        return {
            emotions: [{ label: "pleasant", score: 0.2 }],
            needs: [{ label: "companionship", score: 1.0 }]
        };
    }

    const { emotions, needs } = detectEmotionNeed(diaryText);

    const result = await selectRabbitAction({
        emotions,
        needs
    });

    if (!result) {
        console.warn("Diary: Action候補がありません");
        return;
    }

    const action = result.action;
    const phrase = result.chosenPhrase || "";

    renderRabbit(action, phrase);
}

// -----------------------------
// Idle Layer（v3.2 時間帯仕様）
// -----------------------------
async function startIdleLoop() {
    const actions = await loadActions();
    if (!actions) return;

    function getTimeSlot() {
        const hour = new Date().getHours();

        if (hour >= 6 && hour < 10) return "morning";
        if (hour >= 10 && hour < 16) return "noon";
        if (hour >= 16 && hour < 20) return "evening";
        return "night";
    }

    function chooseIdleAction() {
        const slot = getTimeSlot();

        let candidates = [];

        if (slot === "morning") {
            candidates = ["R17", "R18", "R19"];
        } else if (slot === "noon") {
            candidates = ["R08"];
        } else if (slot === "evening") {
            candidates = ["R17", "R18", "R19"];
        } else if (slot === "night") {
            candidates = ["R15"];
        }

        const id = candidates[Math.floor(Math.random() * candidates.length)];
        return actions[id];
    }

    function showIdle() {
        const action = chooseIdleAction();
        if (!action) return;

        const phrase = action.short_phrases?.length
            ? action.short_phrases[Math.floor(Math.random() * action.short_phrases.length)]
            : "";

        renderRabbit(action, phrase);
    }

    showIdle();
    setInterval(showIdle, 20000);
}

// -----------------------------
// 初期化
// -----------------------------
window.addEventListener("DOMContentLoaded", () => {
    console.log("Pet name set:", petName);

    const talkBtn = document.getElementById("start-voice");
    const diaryBtn = document.getElementById("analyze-button");

    if (talkBtn) talkBtn.addEventListener("click", startSpeechRecognition);
    if (diaryBtn) diaryBtn.addEventListener("click", processDiary);

    startIdleLoop();
});
