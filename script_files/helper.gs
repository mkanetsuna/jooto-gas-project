function CreateQueryString(params) {
  return Object.keys(params)
    .map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
    })
    .join('&');
}

function ConvertUnixToUTC(jsonData, keys) {
  jsonData.forEach(item => {
    keys.forEach(key => {
      if (item.hasOwnProperty(key) && item[key]) {
        let date = new Date(item[key] * 1000); // Unixタイムをミリ秒に変換
        item[key] = date.toISOString(); // UTC形式に変換
      }
    });
  });
  return jsonData;
}