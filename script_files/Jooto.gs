function GetBoardTasks(apiKey, boardId, page, perPage, order, categoryIds, assigneeId, deadlineSince, deadlineUntil, followed, archived, status) {
  const baseUrl = "https://api.jooto.com/v1";
  const path = "boards/" + boardId + "/tasks";
  const urlParams = {};
  if (order)
    urlParams.order = order;
  if (status)
    urlParams.status = status;
  if (page)
    urlParams.page = page;
  if (perPage)
    urlParams.per_page = perPage;
  if (categoryIds)
    urlParams.category_ids = categoryIds.join(",");
  if (assigneeId)
    urlParams.assignee_id = assigneeId;
  if (deadlineSince)
    urlParams.deadline_since = deadlineSince;
  if (deadlineUntil)
    urlParams.deadline_until = deadlineUntil;
  if (followed)
    urlParams.followed = followed.toString();
  if (archived)
    urlParams.archived = archived.toString();
  if (status)
    urlParams.status = status;

  const url = MakeUrl(baseUrl, path, urlParams);
  return SendRequest(url, "GET", apiKey);
}

function AddTaskComment(apiKey, taskId, content) {
  const baseUrl = "https://api.jooto.com/v1";
  const path = `tasks/${taskId}/comments`;
  const url = MakeUrl(baseUrl, path);

  const payload = {
    "content": content
  };

  return SendRequest(url, "POST", apiKey, payload);
}

function UpdateTask(apiKey, boardId, taskId, taskData) {
  const baseUrl = "https://api.jooto.com/v1";
  const path = `boards/${boardId}/tasks/${taskId}`;
  const url = MakeUrl(baseUrl, path);

  return SendRequest(url, "PATCH", apiKey, taskData);
}



function MakeUrl(baseUrl, path, params) {
  let url = baseUrl + "/" + path;
  if (params) {
    const query = Object.keys(params)
      .map(function(key) {
        return encodeURIComponent(key) + "=" + encodeURIComponent(params[key]);
      })
      .join("&");
    url += "?" + query;
  }
  return url;
}



function SendRequest(url, method, apiKey, payload, headers) {
  if (!headers) {
    headers = {
      "X-Jooto-Api-Key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
  }

  const options = {
    method: method,
    headers: headers
  };

  if (payload)
    options.payload = JSON.stringify(payload);

  const response = UrlFetchApp.fetch(url, options);
  Utilities.sleep(1000);
  return JSON.parse(response.getContentText());
}

/**
 * 与えられたキーワード引数をもとに、データを表すオブジェクトを作成する関数
 * @param {...Object} kwargs - キーワード引数。データに含めるキーと値のペア。
 * @return {Object} - データを表すオブジェクト
 */
function CreateData() {
  const data = {};
  for (let i = 0; i < arguments.length; i++) {
    const key = arguments[i][0];
    const value = arguments[i][1];
    if (value !== undefined && value !== null)
      data[key] = value;
  }
  return data;
}



/**
 * Jooto APIからのタスクのリストを整形して、IDと説明だけを抽出する関数
 * @param {Object} tasksResponse - getBoardTasks関数の戻り値
 * @return {Object} - 整形されたタスクのリスト
 */
function ExtractTaskIdAndDescriptionFromBoardTasks(tasksResponse) {
  const tasks = tasksResponse.tasks || [];
  const extractedTasks = tasks.map(task => ({
    id: String(task.id),
    description: task.description
  }));
  Logger.log(extractedTasks)
  return extractedTasks;
}

function FormatDateTime(dateTimeString) {
  const dateTime = new Date(dateTimeString);

  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, '0');
  const day = String(dateTime.getDate()).padStart(2, '0');
  const hours = String(dateTime.getHours()).padStart(2, '0');
  const minutes = String(dateTime.getMinutes()).padStart(2, '0');
  const seconds = String(dateTime.getSeconds()).padStart(2, '0');

  const formattedDateTime = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;

  return formattedDateTime;
}

function FormatCommentContent(receivedTime, body, subject, senderName) {
  const formattedContent = `
--------------------
送信者: ${senderName}
件名: ${subject}
受信時間: ${FormatDateTime(receivedTime)}
--------------------
${body}
--------------------
`;
  return formattedContent;
}

function ProcessModels(emailModel, taskModel) {

  // 1. emailModelの各オブジェクトにキー「taskId」と「description」を追加
  const updatedEmailModel = emailModel.map(emailObj => ({
    ...emailObj,
    taskId: null,
    description: null
  }));

  // 2. それぞれのモデルの各オブジェクトにおける「emailModel.threadId」と「taskModel.description」の一致を検査
  for (const emailObj of updatedEmailModel)
    for (const taskObj of taskModel)
      if (taskObj.description === emailObj.threadId) {
        // 2.1. emailModel.description = taskModel.description
        emailObj.description = taskObj.description;
        // 2.2. emailModel.taskId = taskModel.id
        emailObj.taskId = taskObj.id;
        break;
      }

  // タスクによる処理をされたemailModelを返す
  return updatedEmailModel;
}

function GetTaskComments(apiKey="5e9a1e40b5b25e323222013c798aa080", taskId=26672290, queryParams={page:1, per_page:10, order:"desc"}) {
  const baseUrl = "https://api.jooto.com/v1";
  const path = `tasks/${taskId}/comments`;
  const url = MakeUrl(baseUrl, path, queryParams);
  Logger.log(SendRequest(url, "GET", apiKey))

  return SendRequest(url, "GET", apiKey);
}

function GetTaskCommentsIds(apiKey="5e9a1e40b5b25e323222013c798aa080", taskId=26672290, queryParams={page:1, per_page:10, order:"desc"}) {
  const baseUrl = "https://api.jooto.com/v1";
  const path = `tasks/${taskId}/comments`;
  const url = MakeUrl(baseUrl, path, queryParams);
  
  const response = SendRequest(url, "GET", apiKey);
  Logger.log(response);

  const commentIds = response.comments.map(comment => String(comment.id));
  Logger.log(commentIds);

  return commentIds;
}

function CreateTask(apiKey, boardId, taskData) {
  const baseUrl = "https://api.jooto.com/v1";
  const path = `boards/${boardId}/tasks`;
  const url = MakeUrl(baseUrl, path);

  return SendRequest(url, "POST", apiKey, taskData);
}

function ProcessAndCreateTasks(apiKey, boardId, listId, emailModel, taskModel) {
  Logger.log("ProcessAndCreateTasks : " + listId);
  const models = ProcessModels(emailModel, taskModel);

  const threadMap = new Map();

  models.forEach(obj => {
    const threadId = obj.threadId;
    if (!threadMap.has(threadId)) {
      threadMap.set(threadId, []);
      const taskData = {
        "name": `${obj.subject ? obj.subject : "件名なし"}`,
        "description": `${obj.threadId}`,
        "list_id": `${listId}`
      };
      Logger.log("ProcessAndCreateTasks : taskdataちゃんと入っているか確認  " + JSON.stringify(taskData));
      const taskResponse = CreateTask(apiKey, boardId, taskData);
      obj.taskId = taskResponse.id;
    }
    threadMap.get(threadId).push(obj);
  });

  threadMap.forEach(thread => {
    const taskId = thread[0].taskId;
    thread.forEach(obj => {
      AddTaskComment(apiKey, taskId, FormatCommentContent(obj.receivedTime, obj.body, obj.subject, obj.senderName));
    });
  });
}

// テスト関数
function TestExtractTaskIdAndDescriptionFromBoardTasks() {
  const taskId = 26672290;
  const apiKey = "5e9a1e40b5b25e323222013c798aa080";
  const boardId = 1083747;
  const listId = 4873927;
  const tasksResponse = GetBoardTasks(apiKey, boardId);
  console.log(tasksResponse)
  const taskModel = ExtractTaskIdAndDescriptionFromBoardTasks(tasksResponse);
  
  const emailModel = OnButtonClick();

  ProcessAndCreateTasks(apiKey, boardId, listId, emailModel, taskModel)
}