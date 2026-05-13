/**
 * Google Apps Script backend for Allen County Justice Watch.
 * Deploy this code as a Web App (execute as Me, access to Anyone).
 */

function doPost(e) {
  if (!e || !e.postData) {
     return ContentService.createTextOutput(JSON.stringify({ success: false, error: "No post data received" }))
          .setMimeType(ContentService.MimeType.JSON);
  }
  var content = JSON.parse(e.postData.contents);
  var action = content.action;
  
  // Basic Auth simulation (placeholder)
  if (!content.token && action !== 'setup') {
     return ContentService.createTextOutput(JSON.stringify({ success: false, error: "unauthorized" }))
          .setMimeType(ContentService.MimeType.JSON);
  }
  
  try {
    switch (action) {
      case 'setup':
        setupSheets();
        return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Sheets set up successfully." }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'getRecords':
        return ContentService.createTextOutput(JSON.stringify({ success: true, data: getRecords(content.sheet) }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'getComments':
        return ContentService.createTextOutput(JSON.stringify({ success: true, data: getRecords("Comments") }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'addRecord':
        addRecord(content.sheet, content.row);
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'addComment':
        addRecord("Comments", { postId: content.postId, author: 'Anonymous', comment: content.comment, timestamp: new Date().toLocaleDateString() });
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'updateRecord':
        updateRecord(content.sheet, content.id, content.updates);
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'upvotePost':
        upvotePost(content.postId);
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      case 'deleteRecord':
        deleteRecord(content.sheet, content.id);
        return ContentService.createTextOutput(JSON.stringify({ success: true }))
          .setMimeType(ContentService.MimeType.JSON);
      default:
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Invalid action" }))
          .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Setup Posts sheet
  if (!ss.getSheetByName("Posts")) {
    var sheet = ss.insertSheet("Posts");
    sheet.appendRow(["id", "title", "content", "category", "author", "tags", "timestamp", "upvotes"]);
  }
  
  // Setup Upvotes sheet
  if (!ss.getSheetByName("Upvotes")) {
    var sheet = ss.insertSheet("Upvotes");
    sheet.appendRow(["id", "postId", "userId"]);
  }

  // Setup Comments sheet
  if (!ss.getSheetByName("Comments")) {
    var sheet = ss.insertSheet("Comments");
    sheet.appendRow(["postId", "author", "comment", "timestamp"]);
  }
}

function getRecords(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) throw "Sheet not found: " + sheetName;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var headers = data[0];
  var results = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    results.push(row);
  }
  return results;
}

function addRecord(sheetName, row) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var headers = sheet.getDataRange().getValues()[0];
  var newRow = headers.map(function(h) { return row[h] || ""; });
  sheet.appendRow(newRow);
}

function updateRecord(sheetName, id, updates) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  // Find row by 'id' column (assuming it's column 0)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) { 
      for (var j = 0; j < data[0].length; j++) {
        if (updates.hasOwnProperty(data[0][j])) {
          sheet.getRange(i + 1, j + 1).setValue(updates[data[0][j]]);
        }
      }
      return;
    }
  }
  throw "Record not found";
}

function deleteRecord(sheetName, id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1);
      return;
    }
  }
  throw "Record not found";
}

function upvotePost(postId) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Posts");
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] == postId) {
      var currentUpvotes = data[i][7] || 0; // column index 7 is upvotes
      sheet.getRange(i + 1, 8).setValue(parseInt(currentUpvotes) + 1);
      return;
    }
  }
  throw "Post not found";
}
