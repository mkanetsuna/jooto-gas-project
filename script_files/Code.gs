// ボタンが押されたときに呼び出される関数
function OnButtonClick() {
    const labelName = "未検査"; // 処理対象のラベル名
    const formattedResponse = FetchAndProcessEmailsByLabel(labelName);
    Logger.log(formattedResponse); // ログに出力
    return formattedResponse;
  }
  
  // 特定のラベルが付いたメールを取得して処理する関数
  function FetchAndProcessEmailsByLabel(labelName) {
    const label = GmailApp.getUserLabelByName(labelName);
    const threads = label.getThreads();
    const emailList = [];
  
    threads.forEach(function(thread) {
      const messages = thread.getMessages();
      messages.forEach(function(message) {
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
  
        RemoveLabel(message, label);
      });
    });
  
    const jsonResponse = ConvertToJson(emailList);
    Logger.log(jsonResponse);
    const formattedResponse = FormatJsonResponse(jsonResponse);
    Logger.log(formattedResponse);
    return JSON.parse(formattedResponse);
  }
  
  // メッセージからラベルを削除する関数
  function RemoveLabel(message, label) {
    message.getThread().removeLabel(label);
  }
  
  // メールの情報リストをJSON形式に変換する関数
  function ConvertToJson(emailList) {
    return JSON.stringify(emailList);
  }
  
  // JSONレスポンスを指定された形式に変換する関数
  function FormatJsonResponse(jsonResponse) {
    const emailList = JSON.parse(jsonResponse);
    const formattedList = emailList.map(email => {
      const body = email.body ? email.body : email.plainBody;
      const bodyContent = ExtractBodyContent(body);
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
  if (body) {
    const match = body.match(/<div dir="ltr">([^<]+)<\/div>/);
    if (match) {
      return match[1];
    } else {
      const pTagMatch = body.match(/<p[^>]*>(.*?)<\/p>/);
      if (pTagMatch) {
        const pTagContent = pTagMatch[1];
        const textMatch = pTagContent.match(/>([^<]+)</);
        if (textMatch) {
          return textMatch[1];
        } else {
          const plainTextMatch = pTagContent.match(/^[^<]+/);
          if (plainTextMatch) {
            return plainTextMatch[0];
          }
        }
      }
    }
  }
  return "";
}