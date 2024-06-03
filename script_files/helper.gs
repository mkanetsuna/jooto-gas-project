function CreateQueryString(params) {
  return Object.keys(params)
    .map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join('&');
}

/**
 * Unixタイムをフォーマットされた日時文字列に変換する関数
 * @param {Object} jsonData - APIレスポンスのjsonデータ
 * @param {Array} keys - Unixタイムで管理されているバリューに対応するキーのリスト
 * @return {Object} 変換処理をしたjsonData
 */
function FormatUnixToFormattedDateTime(jsonData, keys) {
  jsonData.forEach(item => {
    keys.forEach(key => {
      if (item.hasOwnProperty(key) && item[key] !== null) {
        let unixTime = Number(item[key]); // 数値に変換
        if (!isNaN(unixTime)) {
          let date = new Date(unixTime * 1000); // Unixタイムをミリ秒に変換
          item[key] = FormatDateTime(date);
        }
      }
    });
  });
  return jsonData;
}

/**
 * 日時オブジェクトを "YYYY/MM/DD HH:MM:SS" 形式の文字列にフォーマットする関数
 * @param {Date} dateTime - 日時オブジェクト
 * @return {String} フォーマットされた日時文字列
 */
function FormatDateTime(dateTime) {
  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, '0');
  const day = String(dateTime.getDate()).padStart(2, '0');
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');
  const seconds = String(dateTime.getSeconds()).padStart(2, '0');

  const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

  return formattedDateTime;
}
