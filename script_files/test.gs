function openDialog() {
  const html = HtmlService.createHtmlOutputFromFile('index')
    .setWidth(3000)
    .setHeight(1500);
  SpreadsheetApp.getUi().showModalDialog(html, 'My Web App');
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('My Menu')
    .addItem('Open Web App', 'openDialog')
    .addToUi();
}