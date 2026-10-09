// ---------------------------------------------
// Rabbit Action Selector v2.2
// ---------------------------------------------
// Emotion × Need に基づいて R01〜R16 を選択する
// Canonical Emotion v1.0 / Need v1.0 に準拠
// ---------------------------------------------

import { loadJSON } from "./dataLoader.js";

export async function selectRabbitAction({ emotions, needs }) {
    const mapping = await loadJSON("./data/action_mapping.json");
    if (!mapping) {
        console.warn("Selector: action_mapping.json が読み込めません");
        return null;
    }

    const candidates = [];

    // Emotion × Need の組み合わせを探索
    for (const e of emotions) {
        for (const n of needs) {
            // Diaryから渡される {label, score} 形式に対応
            const emotionLabel = e.label || e;
            const needLabel = n.label || n;
            const emotionScore = e.score || 1.0;
            const needScore = n.score || 1.0;

            const emotionMap = mapping[emotionLabel];
            if (!emotionMap) continue;

            const needMap = emotionMap[needLabel];
            if (!needMap) continue;

            // 候補Actionをスコア付きで追加
            for (const actionId of needMap) {
                candidates.push({
                    id: actionId,
                    score: emotionScore + needScore
                });
            }
        }
    }

    // 候補がない場合
    if (candidates.length === 0) {
        console.warn("Selector: 候補Actionがありません");
        return null;
    }

    // スコア順に並べて上位3件からランダム選択
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, 3);
    const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    // Actionデータを読み込み
    const actions = await loadJSON("./data/rabbit_actions.json");
    if (!actions) {
        console.warn("Selector: rabbit_actions.json が読み込めません");
        return null;
    }

    const action = actions[chosen.id];
    if (!action) {
        console.warn(`Selector: Action ${chosen.id} が見つかりません`);
        return null;
    }

    // フレーズ選択
    const phrase = action.short_phrases?.length
        ? action.short_phrases[Math.floor(Math.random() * action.short_phrases.length)]
        : "";

    return {
        actionId: chosen.id,
        action,
        chosenPhrase: phrase
    };
}
