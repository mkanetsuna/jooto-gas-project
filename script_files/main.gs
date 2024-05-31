/**
 * 関数一覧:
 * 1. main()
 * 2. GetOperationsAPICount(accessToken, payloadForCount)
 * 3. ImportOperationsAPIResponse(accessToken, sheetId, totalPages, pageSize)
 * 4. ImportPlacementsAPIResponse(accessToken, sheetId)
 * 5. ImportStatusAPIResponse(accessToken, sheetId)
 * 6. ImportCheckinAPIResponse(accessToken, sheetId)
 * 
 * 補助関数(subroutine.gs):
 * - CreatePayload(...args)
 * - TransformData(data, keyName1, keyName2)
 * - FlattenObject(obj, parent = '', res = {})
 * - OutputJsonToSheet(jsonData, sheetId, sheetName)
 * - CallApi(accessToken, apiUrl, method, payload=null)
 * - GetToken()
 * - GetColumnDataByHeader(searchString, sheetId, sheetName)
 */



function main() {
  PushToGitHub();

  const accessToken = GetToken();
  const sheetId = "1YvHj-CY6i64VlK4m7BMCK9cCrBHepYZG-qDec1YnFeo";
  const startDate = "2024-05-19";
  const endDate = "2024-05-19";
  const filter = "normalCleaning";
  const payloadForCount = CreatePayload({startDate}, {endDate},{filter});

  const operationsApiCount = GetOperationsAPICount(accessToken, payloadForCount);
  const fullSizeCount = operationsApiCount.count;
  const pageSize = 1000;
  const totalPages = Math.ceil(fullSizeCount / pageSize);
  
  Utilities.sleep(3000); // 3秒待機
  GetUsersAPIResponse(accessToken);
  //Utilities.sleep(3000); // 3秒待機
  //ImportDelegateCleaningsAPIResponse(accessToken, sheetId, startDate, endDate)
  //ImportCleaningsAPIResponse(accessToken, sheetId, startDate, endDate);
  /*Utilities.sleep(3000); // 3秒待機
  ImportOperationsAPIResponse(accessToken, sheetId, totalPages, pageSize, startDate, endDate, filter);
  Utilities.sleep(3000); // 3秒待機
  ImportPlacementsAPIResponse(accessToken, sheetId);
  Utilities.sleep(3000); // 3秒待機
  ImportCheckinAPIResponse(accessToken, sheetId);
  Utilities.sleep(3000); // 3秒待機*/

  //ImportStatusAPIResponse(accessToken, sheetId);
  //Utilities.sleep(3000); // 3秒待機
}



function GetOperationsAPICount(accessToken, payloadForCount) {
  const countApiUrl = "https://api-cleaning.m2msystems.cloud/v4/operations/count";
  const apiResponse = CallApi(accessToken, countApiUrl, "POST", payloadForCount);
  return apiResponse.count;
}


//だめ
function GetUsersAPIResponse(accessToken) {
  const usersApiUrl = "https://api.m2msystems.cloud/users/find_by_company_id?statuses=Active";
  const jsonData = CallApi(accessToken, usersApiUrl, "GET", authHeader="");
  return jsonData;
}



function ImportOperationsAPIResponse(accessToken, sheetId, totalPages, pageSize, startDate, endDate, filter) {
  const operationsApiUrl = "https://api-cleaning.m2msystems.cloud/v4/operations/search";

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const isCurrentPage1 = (currentPage === 1);
    const payloadForOperations = CreatePayload({startDate}, {endDate}, {filter}, {page:currentPage}, {pageSize});
    const jsonData = CallApi(accessToken, operationsApiUrl, "POST", payloadForOperations);

    OutputJsonToSheet(jsonData, sheetId, "operations", isCurrentPage1);
  }
}



function ImportPlacementsAPIResponse(accessToken, sheetId) {
  const placementsApiUrl = "https://api-cleaning.m2msystems.cloud/v4/placements/find_by_ids";

  const placementIds = GetColumnDataByHeader("placementId", sheetId, "operations");
  const payloadForPlacements = CreatePayload({placementIds});

  const jsonData = CallApi(accessToken, placementsApiUrl, "POST", payloadForPlacements);
  const flatData = jsonData.placements.map(item => FlattenObject(item));

  OutputJsonToSheet(flatData, sheetId, "placements");
}



function ImportStatusAPIResponse(accessToken, sheetId) {
  const statusApiUrl = "https://api-cleaning.m2msystems.cloud/v4/cleaning/status";

  const cleaningIds = GetColumnDataByHeader("id", sheetId, "operations");
  const payloadForStatus = CreatePayload({cleaningIds});

  const jsonData = CallApi(accessToken, statusApiUrl, "POST", payloadForStatus);
  const transformedData = TransformData(jsonData, "cleaningId", "status");

  OutputJsonToSheet(transformedData, sheetId, "status");
}



function ImportCheckinAPIResponse(accessToken, sheetId) {
  const placementsApiUrl = "https://api-cleaning.m2msystems.cloud/v4/cleanings/checkin";

  const cleaningIds = GetColumnDataByHeader("id", sheetId, "operations");
  const payloadForCleanings = CreatePayload({cleaningIds});

  const jsonData = CallApi(accessToken, placementsApiUrl, "POST", payloadForCleanings);
  const transformedData = TransformCheckinData(jsonData);

  OutputJsonToSheet(transformedData, sheetId, "checkin");
}



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




/*function ImportPhotoToursAPIResponse() {
  const accessToken = GetToken();
  const photoToursApiUrl = "https://api-cleaning.m2msystems.cloud/v3/photo_tours/by_company_id/1";
  const sheetId = "1YvHj-CY6i64VlK4m7BMCK9cCrBHepYZG-qDec1YnFeo";
  const sheetName = "photo_tours";
  const jsonData = CallApi(accessToken, photoToursApiUrl, "GET");
  
  OutputJsonToSheet(jsonData, sheetId, sheetName);
}*/