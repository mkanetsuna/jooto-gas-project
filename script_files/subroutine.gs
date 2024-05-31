/**
 * 関数一覧:
 * 1. CreatePayload(...args)
 * 2. TransformData(data, keyName1, keyName2)
 * 3. TransformCheckinData(data)
 * 4. FlattenObject(obj, parent = '', res = {})
 * 5. OutputJsonToSheet(jsonData, sheetId, sheetName, isCurrentPage1)
 * 6. CallApi(accessToken, apiUrl, method, payload=null)
 * 7. GetToken()
 * 8. GetColumnDataByHeader(searchString, sheetId, sheetName)
 */



function CreatePayload(...args) {
  let payload = {};
  args.forEach(function(arg) {
    for (let key in arg)
      if (arg.hasOwnProperty(key))
        payload[key] = arg[key];
  });
  return payload;
}



function TransformData(data, keyName1, keyName2) {
  let transformedData = [];
  for (var key in data)
    if (data.hasOwnProperty(key)) {
      let newObject = {};
      newObject[keyName1] = key;
      newObject[keyName2] = data[key];
      transformedData.push(newObject);
    }
  return transformedData;
}



function TransformCheckinData(data) {
  var transformedData = [];
  for (var key in data) {
    if (data.hasOwnProperty(key)) {
      transformedData.push({
        cleaningId: key,
        hasCheckinOnDate: data[key].hasCheckinOnDate
      });
    }
  }
  return transformedData;
}



function FlattenObject(obj, parent = '', res = {}) {
  for (let key in obj) {
    let propName = parent ? parent + '.' + key : key;
    if (typeof obj[key] == 'object' && obj[key] !== null) {
      FlattenObject(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
}



function OutputJsonToSheet(jsonData, sheetId, sheetName, isCurrentPage1=true) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet)
    throw new Error('Sheet with name ' + sheetName + ' does not exist in the spreadsheet.');
  const keys = Object.keys(jsonData[0]);
  const startRow = (isCurrentPage1) ? 1 : sheet.getLastRow() + 1;
  if (isCurrentPage1) {
    sheet.clear();
    for (let i = 0; i < keys.length; i++)
      sheet.getRange(1, i + 1).setValue(keys[i]);
  }
  for (let row = 0; row < jsonData.length; row++)
    for (let col = 0; col < keys.length; col++)
      sheet.getRange(startRow + row + 1, col + 1).setValue(jsonData[row][keys[col]]);
}



function CallApi(accessToken, apiUrl, method, payload=null, authHeader='Bearer ') {
  const headers = {
    'Authorization': authHeader + accessToken,
    'Content-Type': 'application/json'
  };
  const options = {
    'method': method,
    'headers': headers
  };
  if (payload)
    options.payload = JSON.stringify(payload);
  const response = UrlFetchApp.fetch(apiUrl, options);
  return JSON.parse(response.getContentText());
}



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



function GetColumnDataByHeader(searchString, sheetId, sheetName) {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet)
    return null;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnIndex = headers.indexOf(searchString);
  if (columnIndex === -1)
    return null;
  const columnData = sheet.getRange(2, columnIndex + 1, sheet.getLastRow() - 1, 1).getValues();
  const dataList = columnData.map(function(row) {
    return row[0];
  });
  return dataList;
}
