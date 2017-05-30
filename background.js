
onButtonClicked = function ( tab ) {
  
  let queryInfo = { active: true, currentWindow: true };
  
  chrome.tabs.query( queryInfo, queryCallback );
}

queryCallback = function ( tabs ) {
  
  let activeTab = tabs[0];
  let message = { 'message': 'clicked_browser_action' };

  chrome.tabs.sendMessage( activeTab.id, message );
}


chrome.browserAction.onClicked.addListener( onButtonClicked );