// needEstimator.js
// PetApp5-Web
// Need Layer — Interface Skeleton v1
// Cフェーズ：Need推定の入出力契約と処理パイプラインのみを実装
// 推定アルゴリズムはまだ固定しない（T01〜T20で段階的に育てる）

// ============================================================
// 1. Need 定義（19 Need）
// ============================================================

export const NEEDS = [
    "companionship",
    "comfort",
    "connection",
    "touch",
    "care",
    "reassurance",
    "quiet_presence",
    "rest",
    "togetherness",
    "warmth",
    "relaxation",
    "listening",
    "engagement",
    "understanding",
    "share_surprise",
    "encouragement",
    "share_joy",
    "quiet_rest",
    "gentle_approach"
];


// ============================================================
// 2. 出力制御
// ============================================================

const MIN_NEED_SCORE = 0.20;
const MAX_NEEDS = 3;


// ============================================================
// 3. Need 候補生成（Emotionベース）
// ============================================================
//
// v1: まだ具体的な推定ロジックは実装しない。
//     EmotionからNeed候補を生成するフックだけ用意する。
// ============================================================

function inferNeedsFromEmotion(emotions) {
    // TODO: Emotion → Need候補生成ロジック（v1.1以降）
    return [];
}


// ============================================================
// 4. Need 候補生成（diary context）
// ============================================================
//
// v1: 明示的Need表現・暗黙的Need表現を検出するフック。
//     まだ具体的な辞書や正規表現は実装しない。
// ============================================================

function inferNeedsFromContext(diaryText) {
    // TODO: diary context → Need候補生成ロジック（v1.1以降）
    return [];
}


// ============================================================
// 5. Need 候補生成（WRIME auxiliary）
// ============================================================
//
// v1: surprise / anticipation / trust / disgust を補助情報として扱う。
//     まだ具体的な変換ルールは実装しない。
// ============================================================

function inferNeedsFromAuxiliary(auxiliary) {
    // TODO: auxiliary → Need候補生成ロジック（v1.1以降）
    return [];
}


// ============================================================
// 6. Need 候補の内部保持
// ============================================================
//
// 同じNeedが複数ソースから出た場合、統合せず保持する。
// ============================================================

function groupNeedSources(needCandidates) {
    const map = new Map();

    needCandidates.forEach(n => {
        if (!map.has(n.label)) {
            map.set(n.label, {
                label: n.label,
                sources: []
            });
        }

        map.get(n.label).sources.push({
            source: n.source,
            score: n.score
        });
    });

    return [...map.values()];
}


// ============================================================
// 7. score 統合（暫定）
// ============================================================
//
// v1: Emotion層と同じく「最大値」を暫定採用。
//     これは最終仕様ではなく、T01〜T20検証後に再評価。
// ============================================================

function aggregateNeedScores(groupedNeeds) {
    return groupedNeeds.map(n => {
        const maxScore = Math.max(...n.sources.map(s => s.score));
        return {
            label: n.label,
            score: maxScore
        };
    });
}


// ============================================================
// 8. threshold + top-k
// ============================================================

function selectTopNeeds(needs) {
    return needs
        .filter(n => n.score >= MIN_NEED_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_NEEDS);
}


// ============================================================
// 9. 公開 API
// ============================================================
//
// estimateNeeds({ diaryText, emotions, auxiliary })
//     → { needs: [...] }
//
// ここではまだ推定ロジックは未実装。
// ============================================================

export function estimateNeeds({ diaryText, emotions, auxiliary }) {

    if (typeof diaryText !== "string") {
        throw new TypeError("diaryText must be a string.");
    }

    if (!Array.isArray(emotions)) {
        throw new TypeError("emotions must be an array.");
    }

    if (!auxiliary || typeof auxiliary !== "object") {
        throw new TypeError("auxiliary must be an object.");
    }

    // --------------------------------------------------------
    // ① EmotionベースのNeed候補
    // --------------------------------------------------------
    const emotionNeeds = inferNeedsFromEmotion(emotions);

    // --------------------------------------------------------
    // ② diary contextベースのNeed候補
    // --------------------------------------------------------
    const contextNeeds = inferNeedsFromContext(diaryText);

    // --------------------------------------------------------
    // ③ WRIME auxiliaryベースのNeed候補
    // --------------------------------------------------------
    const auxiliaryNeeds = inferNeedsFromAuxiliary(auxiliary);

    // --------------------------------------------------------
    // ④ 全Need候補
    // --------------------------------------------------------
    const rawNeeds = [
        ...emotionNeeds,
        ...contextNeeds,
        ...auxiliaryNeeds
    ];

    // Needが何も得られない場合は空配列を返す（仕様どおり）
    if (rawNeeds.length === 0) {
        return { needs: [] };
    }

    // --------------------------------------------------------
    // ⑤ source別に保持
    // --------------------------------------------------------
    const groupedNeeds = groupNeedSources(rawNeeds);

    // --------------------------------------------------------
    // ⑥ score統合（暫定）
    // --------------------------------------------------------
    const aggregatedNeeds = aggregateNeedScores(groupedNeeds);

    // --------------------------------------------------------
    // ⑦ threshold + top-k
    // --------------------------------------------------------
    const needs = selectTopNeeds(aggregatedNeeds);

    // --------------------------------------------------------
    // 公開形式
    // --------------------------------------------------------
    return {
        needs,

        // デバッグ用（Emotion層と対称）
        meta: {
            rawNeeds,
            groupedNeeds
        }
    };
}
