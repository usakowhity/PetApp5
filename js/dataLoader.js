// ---------------------------------------------
// dataLoader.js
// ---------------------------------------------
// JSONファイルを読み込むユーティリティ
// ---------------------------------------------

export async function loadJSON(path) {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            console.warn(`dataLoader: ${path} が読み込めません (${response.status})`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error(`dataLoader: 読み込みエラー - ${error}`);
        return null;
    }
}
