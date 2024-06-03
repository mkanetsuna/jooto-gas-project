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

function ImportOperationsAPIResponse(accessToken, sheetId, totalPages, pageSize, startDate, endDate, filter) {
  const operationsApiUrl = "https://api-cleaning.m2msystems.cloud/v4/operations/search";

  const keysToConvert = ['createdAt', 'startedAt', 'finishedAt', 'reportedAt', 'updatedAt', 'assignedAt'];

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const isCurrentPage1 = (currentPage === 1);
    const payloadForOperations = CreatePayload({startDate}, {endDate}, {filter}, {page:currentPage}, {pageSize});
    let operationsJsonData = CallApi(accessToken, operationsApiUrl, "POST", payloadForOperations);

    operationsJsonData = FormatUnixToFormattedDateTime(operationsJsonData, keysToConvert);

    OutputJsonToSheet(operationsJsonData, sheetId, "operations", isCurrentPage1);
  }
}

function ImportCleaningsAPIResponse(accessToken, sheetId, startDate, endDate) {
  const cleaningsApiUrl = "https://api-cleaning.m2msystems.cloud/v4/search/cleanings";

  const keysToConvert = ['createdAt', 'startedAt', 'finishedAt', 'reportedAt', 'updatedAt', 'assignedAt'];

  const payloadForCleanings = CreatePayload({startDate}, {endDate});
  let cleaningsJsonData = CallApi(accessToken, cleaningsApiUrl, "POST", payloadForCleanings);

  cleaningsJsonData = FormatUnixToFormattedDateTime(cleaningsJsonData, keysToConvert);

  OutputJsonToSheet(cleaningsJsonData, sheetId, "cleanings");
}



function ImportDelegateCleaningsAPIResponse(accessToken, sheetId, startDate, endDate) {
  const delegateCleaningsApiUrl = "https://api-cleaning.m2msystems.cloud/v3/search/delegate_cleanings";

  const keysToConvert = ['createdAt', 'startedAt', 'finishedAt', 'reportedAt', 'updatedAt', 'assignedAt'];

  const payloadFordelegateCleanings = CreatePayload({startDate}, {endDate});

  let delegateCleaningsJsonData = CallApi(accessToken, delegateCleaningsApiUrl, "POST", payloadFordelegateCleanings);

  delegateCleaningsJsonData = FormatUnixToFormattedDateTime(delegateCleaningsJsonData, keysToConvert);

  OutputJsonToSheet(delegateCleaningsJsonData, sheetId, "delegate_cleanings");
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
