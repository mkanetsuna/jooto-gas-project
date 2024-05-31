/**
 * 1. gcpのサービスアカウント（dx-878@m2m-core.iam.gserviceaccount.com）にGASのプロジェクトorスプシの権限を与える
 * 2. githubRepoに「ユーザ名/リポジトリパス」を入力（ex: mkanetsuna/dx-cleaningAPI-OutputSheet）
 * 3. スクリプトプロパティに以下のプロパティを作成
 *    {
 *     プロパティ：githubToken
 *     値：GitHubで発行したアクセストークン
 *    }
 * 4. PushToGitHub関数を実行
 */
function PushToGitHub() {
  const url="https://asia-northeast1-m2m-core.cloudfunctions.net/kanetsuna_gas_push_github";
  const scriptId = ScriptApp.getScriptId();
  const scriptProperties = PropertiesService.getScriptProperties();
  const githubToken = scriptProperties.getProperty('githubToken');
  const githubRepo =  'mkanetsuna/jooto-gas-project';
  const params = {
    script_id: scriptId,
    github_token: githubToken,
    github_repo: githubRepo
  };
  const sendUrl = url + '?' + CreateQueryString(params);
  UrlFetchApp.fetch(sendUrl, {
    method: 'get'
  });
}