// ボタンが押されたときに呼び出される関数
function OnButtonClick() {
  const senderEmail = "i.masayak6207@gmail.com";
  const formattedResponse = FetchAndProcessEmails(senderEmail);//メール取得
  Logger.log(formattedResponse); // ログに出力
  return formattedResponse;
}

// 特定の送信者からのメールを取得して処理する関数
function FetchAndProcessEmails(senderEmail) {
  const threads = GmailApp.search(`from:${senderEmail}`);
  const emailList = [];
  const inspectedMessages = PropertiesService.getUserProperties().getProperty('inspectedMessages') || '';

  threads.forEach(function(thread) {
    const messages = thread.getMessages();
    messages.forEach(function(message) {
      if (!inspectedMessages.includes(message.getId())) {
        const attachments = message.getAttachments().map(attachment => {
          return {
            name: attachment.getName(),
            contentType: attachment.getContentType(),
            size: attachment.getSize(),
            data: attachment.getBytes()
          };
        });

        emailList.push({
          messageId: message.getId(),
          threadId: message.getThread().getId(),
          subject: message.getSubject(),
          body: message.getBody(),
          senderName: message.getFrom(),
          receivedTime: message.getDate(),
          attachments: attachments
        });
        MarkMessageAsInspected(message);
      }
    });
  });

  const jsonResponse = ConvertToJson(emailList);
  Logger.log(jsonResponse);
  const formattedResponse = FormatJsonResponse(jsonResponse);
  Logger.log(formattedResponse);
  return JSON.parse(formattedResponse);
}

// メッセージを検査済みとしてマークする関数
function MarkMessageAsInspected(message) {
  const inspectedMessages = PropertiesService.getUserProperties().getProperty('inspectedMessages') || '';
  const newInspectedMessages = inspectedMessages ? inspectedMessages + ',' + message.getId() : message.getId();
  PropertiesService.getUserProperties().setProperty('inspectedMessages', newInspectedMessages);
}

// メールの情報リストをJSON形式に変換する関数
function ConvertToJson(emailList) {
  return JSON.stringify(emailList);
}

// JSONレスポンスを指定された形式に変換する関数
function FormatJsonResponse(jsonResponse) {
  const emailList = JSON.parse(jsonResponse);
  const formattedList = emailList.map(email => {
    const bodyContent = ExtractBodyContent(email.body);
    return {
      messageId: email.messageId,
      threadId: email.threadId,
      subject: email.subject,
      body: bodyContent,
      senderName: email.senderName,
      receivedTime: email.receivedTime,
      attachments: email.attachments
    };
  });
  return JSON.stringify(formattedList);
}

// メール本文からHTMLタグを取り除いて内容を抽出する関数
function ExtractBodyContent(body) {
  const div = HtmlService.createHtmlOutput(body).getContent();
  const match = div.match(/<div dir="ltr">([^<]+)<\/div>/);
  return match ? match[1] : "";
}
/*
// フォーマットされたJSONレスポンスをシートにエクスポートする関数
function exportToSheet(sheet, formattedList) {
  const data = formattedList.map(email => [email.messageId, email.threadId, email.subject, email.body]);
  const range = sheet.getRange(5, 2, data.length, 4); // B5, C5, D5, E5 から開始
  range.setValues(data);
}
*/