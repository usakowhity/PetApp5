// emotionMapper.js
// PetApp5-Web
// Emotion Layer — Interface Skeleton v1

// ============================================================
// 1. PetApp5 Emotion の直接変換
// ============================================================

const DIRECT_MAPPING = {
    joy: "joy",
    sadness: "sadness",
    anger: "anger",
    fear: "anxiety_fear"
};


// ============================================================
// 2. WRIME 補助ラベル
//    現時点では PetApp5 Emotion へ直接変換しない
// ============================================================

const AUXILIARY_WRIME_LABELS = [
    "anticipation",
    "surprise",
    "disgust",
    "trust"
];


// ============================================================
// 3. PetApp5 固有 Emotion
//    WRIME から直接得られないため、context 補完対象
// ============================================================

const PETAPP_CONTEXT_EMOTIONS = [
    "pleasant",
    "relief",
    "affection",
    "gratitude",
    "loneliness",
    "empathy_compassion",
    "fatigue_apathy"
];


// ============================================================
// 4. 出力制御
// ============================================================

const MIN_EMOTION_SCORE = 0.20;
const MAX_EMOTIONS = 3;


// ============================================================
// 5. WRIME 強度 → 0〜1 正規化
// ============================================================

function normalizeWrimeIntensity(intensity) {
    if (typeof intensity !== "number") {
        return 0;
    }

    return Math.max(0, Math.min(1, intensity / 3));
}


// ============================================================
// 6. WRIME → PetApp5 Emotion 直接変換
// ============================================================

function mapDirectWrimeEmotion(label, intensity) {
    const petAppLabel = DIRECT_MAPPING[label];

    if (!petAppLabel) {
        return null;
    }

    const score = normalizeWrimeIntensity(intensity);

    return {
        label: petAppLabel,
        score,
        source: "wrime"
    };
}


// ============================================================
// 7. WRIME 補助情報の保持
// ============================================================
//
// surprise / anticipation / disgust / trust は、
// 現時点では PetApp5 Emotion に直接変換しない。
// 将来の Context / Need 推定で利用できるよう保持する。
// ============================================================

function collectAuxiliaryWrime(wrime) {
    const auxiliary = {};

    AUXILIARY_WRIME_LABELS.forEach(label => {
        if (typeof wrime?.[label] === "number") {
            auxiliary[label] = {
                intensity: wrime[label],
                score: normalizeWrimeIntensity(wrime[label]),
                source: "wrime"
            };
        }
    });

    return auxiliary;
}


// ============================================================
// 8. PetApp5 Context Emotion 補完
// ============================================================
//
// v1.1:
// ここではまだ推定ロジックを実装しない。
// 将来、日記本文 + WRIME補助情報から推定する。
// ============================================================

function inferPetAppContextEmotions(diaryText, wrime) {
    // TODO:
    // pleasant
    // relief
    // affection
    // gratitude
    // loneliness
    // empathy_compassion
    // fatigue_apathy

    return [];
}


// ============================================================
// 9. 複数ソースの内部保持
// ============================================================
//
// 同じ Emotion が複数ソースから得られた場合、
// この段階では単純加算しない。
// ============================================================

function buildSourceGroupedEmotions(emotions) {
    const grouped = new Map();

    emotions.forEach(emotion => {
        if (!grouped.has(emotion.label)) {
            grouped.set(emotion.label, {
                label: emotion.label,
                sources: []
            });
        }

        grouped.get(emotion.label).sources.push({
            source: emotion.source,
            score: emotion.score
        });
    });

    return [...grouped.values()];
}


// ============================================================
// 10. score 統合
// ============================================================
//
// v1:
// 統合ルールは未確定。
// T01〜T20 の検証後に決定する。
// 現段階では、各 Emotion について最も高い source score
// を暫定的な公開 score とする。
// ============================================================

function aggregateEmotionScores(groupedEmotions) {
    return groupedEmotions.map(emotion => {

        const maxScore = Math.max(
            ...emotion.sources.map(source => source.score)
        );

        return {
            label: emotion.label,
            score: maxScore
        };
    });
}


// ============================================================
// 11. threshold + top-k
// ============================================================

function selectTopEmotions(emotions) {
    return emotions
        .filter(emotion => emotion.score >= MIN_EMOTION_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, MAX_EMOTIONS);
}


// ============================================================
// 12. 公開 API
// ============================================================

export function mapEmotions({ diaryText, wrime }) {

    // --------------------------------------------------------
    // 入力チェック
    // --------------------------------------------------------

    if (typeof diaryText !== "string") {
        throw new TypeError("diaryText must be a string.");
    }

    if (!wrime || typeof wrime !== "object") {
        throw new TypeError("wrime must be an object.");
    }


    // --------------------------------------------------------
    // ① WRIME → PetApp5 Emotion
    // --------------------------------------------------------

    const wrimeEmotions = [];

    Object.entries(wrime).forEach(([label, intensity]) => {

        const mapped = mapDirectWrimeEmotion(
            label,
            intensity
        );

        if (mapped) {
            wrimeEmotions.push(mapped);
        }
    });


    // --------------------------------------------------------
    // ② WRIME 補助情報
    // --------------------------------------------------------

    const auxiliaryWrime = collectAuxiliaryWrime(wrime);


    // --------------------------------------------------------
    // ③ Context 補完
    // --------------------------------------------------------

    const contextEmotions =
        inferPetAppContextEmotions(
            diaryText,
            wrime
        );


    // --------------------------------------------------------
    // ④ 全 Emotion 候補
    // --------------------------------------------------------

    const rawEmotions = [
        ...wrimeEmotions,
        ...contextEmotions
    ];


    // --------------------------------------------------------
    // ⑤ source 別に保持
    // --------------------------------------------------------

    const sourceGroupedEmotions =
        buildSourceGroupedEmotions(rawEmotions);


    // --------------------------------------------------------
    // ⑥ score 統合
    // --------------------------------------------------------
    //
    // 現在は「最大値」を暫定採用。
    // これは最終仕様ではなく、T01〜T20検証後に
    // aggregation rule として再評価する。
    //

    const aggregatedEmotions =
        aggregateEmotionScores(
            sourceGroupedEmotions
        );


    // --------------------------------------------------------
    // ⑦ threshold
    // ⑧ top 2〜3
    // --------------------------------------------------------

    const emotions =
        selectTopEmotions(
            aggregatedEmotions
        );


    // --------------------------------------------------------
    // Cフェーズへ渡す公開形式
    // --------------------------------------------------------

    return {
        emotions,

        // 以下はデバッグ・検証用。
        // Cフェーズの通常処理では使用しない。
        meta: {
            auxiliaryWrime,
            rawEmotions,
            sourceGroupedEmotions
        }
    };
}

