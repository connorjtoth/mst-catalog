// content.js
chrome.runtime.onMessage.addListener( function (request, sender, sendResponse) {
  if ( request.message === 'clicked_browser_action' ) {
    var firstHref = document.querySelector('a[href^=\'http\']').getAttribute('href');
    console.log(firstHref);
  }
})