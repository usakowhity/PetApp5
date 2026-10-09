// rabbitActionSelector.js (Browser版)
// PetApp5 - Healing Rabbit Diary
// Diary Layer のアクション選択ロジック（簡易版）

export function selectRabbitAction(diaryText) {
  if (typeof diaryText !== "string") return "R08"; // 安全対策

  if (diaryText.includes("雨")) {
    return "R15"; // 眠る
  } else if (diaryText.includes("牧草")) {
    return "R17"; // 牧草を食べる
  } else if (diaryText.includes("水")) {
    return "R18"; // 給水
  } else {
    return "R08"; // 通常
  }
}
