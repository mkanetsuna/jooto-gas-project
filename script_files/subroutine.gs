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

function ImportCleaningsAPIResponse(accessToken, sheetId, startDate, endDate) {
  const cleaningsApiUrl = "https://api-cleaning.m2msystems.cloud/v4/search/cleanings";

  const payloadForCleanings = CreatePayload({startDate}, {endDate});
  const jsonData = CallApi(accessToken, cleaningsApiUrl, "POST", payloadForCleanings);

  OutputJsonToSheet(jsonData, sheetId, "cleanings");
}



function ImportDelegateCleaningsAPIResponse(accessToken, sheetId, startDate, endDate) {
  const delegateCleaningsApiUrl = "https://api-cleaning.m2msystems.cloud/v3/search/delegate_cleanings";

  const payloadFordelegateCleanings = CreatePayload({startDate}, {endDate});
  const jsonData = CallApi(accessToken, delegateCleaningsApiUrl, "POST", payloadFordelegateCleanings);

  OutputJsonToSheet(jsonData, sheetId, "delegate_cleanings");
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
