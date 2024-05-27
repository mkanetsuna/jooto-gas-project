function getRecentEmails() {
  // 現在の日時から12分前の日時を取得
  const now = new Date();
  const twelveMinutesAgo = new Date(now.getTime() - 12 * 60 * 1000);

  // Gmailのインスタンスを取得
  const gmail = GmailApp.getInboxThreads();
  
  // 受信したメールの情報を格納する配列
  const emails = [];

  // スレッドをループ処理
  for (const thread of gmail) {
    // スレッド内の各メッセージを新しい順に取得
    const messages = thread.getMessages().reverse();
    
    // 過去のメールの本文を格納するための配列
    const previousBodies = [];
    
    // メッセージをループ処理
    for (const message of messages) {
      // メッセージの受信日時を取得
      const receivedDate = message.getDate();
      
      // 受信日時が12分以内の場合、メール情報を配列に追加
      if (receivedDate >= twelveMinutesAgo) {
        // メールの本文を取得
        let body = message.getPlainBody();
        
        // 定型文や引用文を除去するための正規表現パターン
        const patterns = [
          /^On.*wrote:$/gm, // "On [date], [name] wrote:" 形式の引用ヘッダー
          /^.*mailto:.*$/gm, // "mailto:" を含む行（メールアドレスのリンク）
          /^>.*$/gm, // ">" で始まる引用行
          /^From:.*$/gm, // "From:" で始まる行（元のメールのヘッダー）
          /^Sent:.*$/gm, // "Sent:" で始まる行（元のメールのヘッダー）
          /^To:.*$/gm, // "To:" で始まる行（元のメールのヘッダー）
          /^Cc:.*$/gm, // "Cc:" で始まる行（元のメールのヘッダー）
          /^Subject:.*$/gm, // "Subject:" で始まる行（元のメールのヘッダー）
          /^[-_*=~]{3,}$/gm, // "-"、"_"、"*"、"="、"~" などの記号が3つ以上連続する行（区切り線）
          /^[\s\S]*?[^\w\s]+-{2,}[\s\S]*?$/gm, // "--" を含む行（署名の区切り線）
          /^(regards|cheers|thanks|thank you|sincerely|best regards|best|best wishes|yours truly|kind regards)[\s\S]*?$/gim, // 一般的な締めの挨拶
          /^sent from my[\s\S]*?$/gim, // "Sent from my" で始まる行（モバイルデバイスからの送信）
          /\[cid:.*?\]/gm, // "[cid:...]" 形式の画像参照
        ];
        
        // 正規表現パターンを使用して定型文や引用文を除去
        for (const pattern of patterns) {
          body = body.replace(pattern, '');
        }
        
        // 過去のメールの本文と比較して、一致する部分を除去
        for (const previousBody of previousBodies) {
          body = body.replace(previousBody, '');
        }
        
        // 前後の空白と空行を取り除く
        body = body.trim().replace(/^\s*[\r\n]/gm, '');
        
        // 現在のメールの本文を過去のメールの本文の配列に追加
        previousBodies.push(body);
        
        emails.push({
          id: message.getId(),
          subject: message.getSubject(),
          body: body,
          sender: message.getFrom(),
          to: message.getTo(),
          cc: message.getCc(),
          bcc: message.getBcc(),
          replyTo: message.getReplyTo(),
          date: message.getDate(),
          threadId: thread.getId(),
          attachments: message.getAttachments().map(attachment => ({
            id: attachment.getId(),
            emailId: message.getId(),
            name: attachment.getName(),
            size: attachment.getSize(),
            type: attachment.getContentType()
          }))
        });
      }
    }
  }

  Logger.log(emails)
  return emails;
}

function insertEmailData(sheetId, emails) {
  const sheet = SpreadsheetApp.openById(sheetId);
  const emailSheet = sheet.getSheetByName('Email');
  const attachmentSheet = sheet.getSheetByName('Attachment');

  const emailData = [];
  const attachmentData = [];

  emails.reverse().forEach(email => {
    // 複合キーを使用してEmailシートにデータが存在するかチェック
    const emailRowValues = emailSheet.getDataRange().getValues();
    const emailExists = emailRowValues.some(row => row[0] === email.id && row[9] === email.threadId);

    if (!emailExists) {
      const emailRow = [        email.id,
        email.subject,
        email.body,
        email.sender,
        email.to,
        email.cc,
        email.bcc,
        email.replyTo,
        email.date,
        email.threadId,
        false
      ];
      emailData.unshift(emailRow);
    }

    email.attachments.forEach(attachment => {
      // 複合キーを使用してAttachmentシートにデータが存在するかチェック
      const attachmentRowValues = attachmentSheet.getDataRange().getValues();
      const attachmentExists = attachmentRowValues.some(row => row[0] === attachment.id && row[1] === attachment.emailId);

      if (!attachmentExists) {
        const attachmentRow = [
          attachment.id,
          attachment.emailId,
          attachment.name,
          attachment.size,
          attachment.type,
          false
        ];
        attachmentData.unshift(attachmentRow);
      }
    });
  });

  // Emailシートに新しいデータを追加
  if (emailData.length > 0) {
    emailSheet.insertRows(2, emailData.length);
    emailSheet.getRange(2, 1, emailData.length, emailData[0].length).setValues(emailData);
  }

  // Attachmentシートに新しいデータを追加
  if (attachmentData.length > 0) {
    attachmentSheet.insertRows(2, attachmentData.length);
    attachmentSheet.getRange(2, 1, attachmentData.length, attachmentData[0].length).setValues(attachmentData);
  }
}

function main() {
  const sheetId = '1B7-cfnlTA-QevFfNP5pwf7KeOdfB3HWAA12SMe_ym-8';
  const emails = getRecentEmails();
  insertEmailData(sheetId, emails);
}