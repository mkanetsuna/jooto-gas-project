//test
function createDatabase(sheetId='1B7-cfnlTA-QevFfNP5pwf7KeOdfB3HWAA12SMe_ym-8') {
  const sheet = SpreadsheetApp.openById(sheetId);
//sdfghjk
  // Emailシートの存在チェックと作成
  const emailSheet = sheet.getSheetByName('Email');
  const emailHeaders = ['id', 'subject', 'body', 'sender', 'to', 'cc', 'bcc', 'reply_to', 'date', 'thread_id', 'is_Jooto_import'];
  if (!emailSheet || !checkHeaders(emailSheet, emailHeaders)) {
    if (emailSheet) {
      sheet.deleteSheet(emailSheet);
    }
    const newEmailSheet = sheet.insertSheet('Email');
    newEmailSheet.getRange(1, 1, 1, emailHeaders.length).setValues([emailHeaders]);
    
    // is_Jooto_importカラムにチェックボックスの入力規則を設定
    const emailCheckboxRange = newEmailSheet.getRange(2, emailHeaders.length, newEmailSheet.getMaxRows() - 1, 1);
    const emailCheckboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    emailCheckboxRange.setDataValidation(emailCheckboxRule);
    
    // Emailシートのテーブルデザインを適用
    const emailTableRange = newEmailSheet.getRange(1, 1, newEmailSheet.getMaxRows(), emailHeaders.length);
    const emailStyleFinder = emailTableRange.createDeveloperMetadataFinder().withKey('tableStyle').withValue('email').withLocationType(SpreadsheetApp.DeveloperMetadataLocationType.ROW).find();
    if (emailStyleFinder.length > 0) {
      emailStyleFinder[0].getRange().applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    }
    emailTableRange.setBorder(true, true, true, true, true, true);
  }

  // Attachmentシートの存在チェックと作成
  const attachmentSheet = sheet.getSheetByName('Attachment');
  const attachmentHeaders = ['id', 'email_id', 'name', 'size', 'type', 'is_Jooto_import'];
  if (!attachmentSheet || !checkHeaders(attachmentSheet, attachmentHeaders)) {
    if (attachmentSheet) {
      sheet.deleteSheet(attachmentSheet);
    }
    const newAttachmentSheet = sheet.insertSheet('Attachment');
    newAttachmentSheet.getRange(1, 1, 1, attachmentHeaders.length).setValues([attachmentHeaders]);
    
    // is_Jooto_importカラムにチェックボックスの入力規則を設定
    const attachmentCheckboxRange = newAttachmentSheet.getRange(2, attachmentHeaders.length, newAttachmentSheet.getMaxRows() - 1, 1);
    const attachmentCheckboxRule = SpreadsheetApp.newDataValidation().requireCheckbox().build();
    attachmentCheckboxRange.setDataValidation(attachmentCheckboxRule);
    
    // Attachmentシートのテーブルデザインを適用
    const attachmentTableRange = newAttachmentSheet.getRange(1, 1, newAttachmentSheet.getMaxRows(), attachmentHeaders.length);
    const attachmentStyleFinder = attachmentTableRange.createDeveloperMetadataFinder().withKey('tableStyle').withValue('attachment').withLocationType(SpreadsheetApp.DeveloperMetadataLocationType.ROW).find();
    if (attachmentStyleFinder.length > 0) {
      attachmentStyleFinder[0].getRange().applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    }
    attachmentTableRange.setBorder(true, true, true, true, true, true);
  }
}