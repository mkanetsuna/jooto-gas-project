function GetToken() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const storedAccessToken = scriptProperties.getProperty('accessToken');
  const storedExpiresAt = scriptProperties.getProperty('expiresAt');

  if (storedAccessToken && storedExpiresAt) {
    const currentTime = Math.floor(Date.now() / 1000); // 現在のUnixエポック時間を取得
    if (currentTime < storedExpiresAt)
      return storedAccessToken; // 既存のトークンを返す
  }
  const email = scriptProperties.getProperty('email');
  const password = scriptProperties.getProperty('password');
  const loginUrl = "https://api.m2msystems.cloud/login";
  const payload = {
    'email': email,
    'password': password
  };
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  try {
    const response = UrlFetchApp.fetch(loginUrl, options);
    if (response.getResponseCode() == 200) {
      const jsonResponse = JSON.parse(response.getContentText());
      const accessToken = jsonResponse.accessToken;
      const expiresAt = Math.floor(jsonResponse.expiresAt / 1000);
      scriptProperties.setProperty('accessToken', accessToken);
      scriptProperties.setProperty('expiresAt', expiresAt);
      return accessToken; // 新しいトークンを返す
    } else {
      Logger.log('トークンの取得に失敗しました。ステータスコード：' + response.getResponseCode());
      return null;
    }
  } catch (error) {
    Logger.log('トークン取得時にエラーが発生しました: ' + error.toString());
    return null;
  }
}

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

function CreatePayload(...args) {
  let payload = {};
  args.forEach(function(arg) {
    for (let key in arg)
      if (arg.hasOwnProperty(key))
        payload[key] = arg[key];
  });
  return payload;
}

function CallApi(accessToken, apiUrl, method, payload = null, authHeader = 'Bearer ', maxRetries = 15) {
  const headers = {
    'Authorization': authHeader + accessToken,
    'Content-Type': 'application/json'
  };
  const options = {
    'method': method,
    'headers': headers,
    'muteHttpExceptions': true
  };
  if (payload) options.payload = JSON.stringify(payload);

  let attempts = 0;
  const retryDelay = 1000; // 初期リトライ待機時間（ミリ秒）

  while (attempts < maxRetries) {
    try {
      const response = UrlFetchApp.fetch(apiUrl, options);
      const responseCode = response.getResponseCode();
      
      if (responseCode == 503)
        throw new Error('503 Service Unavailable');
      
      Logger.log('Response code: ' + responseCode);
      return JSON.parse(response.getContentText());
    } catch (error) {
      attempts++;
      if (attempts < maxRetries) {
        Logger.log('Error: ' + error.message + '. Retrying in ' + retryDelay * attempts + ' ms...');
        Utilities.sleep(retryDelay * attempts); // 指数バックオフ
      } else {
        Logger.log('Max retries reached. Error: ' + error.message);
        throw error;
      }
    }
  }
}

function OutputJsonToSheet(jsonData, sheetId, sheetName, isCurrentPage1 = true) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet with name ' + sheetName + ' does not exist in the spreadsheet.');

  const keys = Object.keys(jsonData[0]);
  const startRow = (isCurrentPage1) ? 1 : sheet.getLastRow() + 1;

  if (isCurrentPage1) {
    sheet.clear();
    for (let i = 0; i < keys.length; i++)
      sheet.getRange(1, i + 1).setValue(keys[i]);
  }

  for (let row = 0; row < jsonData.length; row++) {
    for (let col = 0; col < keys.length; col++) {
      let value = jsonData[row][keys[col]];
      if (Array.isArray(value))
        value = value.join(', '); // リストをカンマ区切りの文字列に変換
      sheet.getRange(startRow + row + 1, col + 1).setValue(value);
    }
  }
}