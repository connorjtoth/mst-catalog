// content.js
var fourDigits = '(\\d{4})';
var orPart = '\\s+\\(?or\\s+' + fourDigits + '\\)?';
var andPart = '\\s*\\,?\\s*(and|\\&)?\\s*' + fourDigits;
var digitsRegex = '(' + fourDigits + '(' + orPart + '|' + andPart + ')*)';

var fourDigitRE = /\d{4}/;
var orPart = /\s+\(?or\s+\d{4}\)?/;
var andPart = /\s*\,?(and|\&)?\s+\d{4}/;
var altogether = new RegExp('(' + fourDigitRE.source + '(' + orPart.source + '|' + andPart.source + ')*)', 'i' );
//(\d{4}(\s+\(?or\s+\d{4}\)?|\s*\,?(and|\&)?\s+\d{4})*)

var regexAddendum = digitsRegex;


function drawPopup ( contentChild, canRemove ) {

  // default value for canRemove is true
  if ( canRemove === undefined ) {
    canRemove = true;
  }

  // debounce for clicking on the popup
  var debounce = false;

  // flag for when the content part of the popup is clicked
  var contentClicked = false;

  // the page curtain that highlights the content of the popup
  var popup = document.createElement('div');
  
  // the CSS properties we want to set
  var popupStyles = {
    backgroundColor: 'rgba(0,0,0,0.7)',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '150%',
    height: '150%',
  };

  // update the style of the popup element
  Object.assign(popup.style, popupStyles);

  // main content to be shown
  var content = document.createElement('div');

  var contentStyles = {
    backgroundColor: 'white',
    position: 'fixed',
    top: '25%',
    left: '25%',
    width: '50%',
    borderRadius: '20px',
    padding: '20px'
  };

  // update the style of the content element
  Object.assign(content.style, contentStyles);

  // function to execute if content is clicked
  var onContentClicked = function ( ) {
    contentClicked = true;
  }

  // function to execute when any part of popup is clicked
  // (including the content part)
  var onPopupClicked = function ( ) {
    if ( !debounce ) {
      debounce = true;

      // if it was only the curtain that was clicked
      // then destroy/remove the popup
      if ( !contentClicked ) {
        popup.remove();
      }

      // reset flags
      contentClicked = false;
      debounce = false;
    }
  }

  // attach the functions to listeners if canRemove = true
  // i.e. allow the bubble to be removed by clicking the 
  // curtain surrounding the content
  if ( canRemove === true ) {
    content.addEventListener('click', onContentClicked);
    popup.addEventListener('click', onPopupClicked);
  }

  // put the popup together
  content.appendChild(contentChild);
  popup.appendChild(content);
  document.body.appendChild(popup);

  return popup;
}

function createCourseBlock ( data ) {

  let titleString = data.course_name,
      descString = data.description;

  let block = document.createElement('div'),
      blockTitle = document.createElement('p'),
      titleEm = document.createElement('em'),
      titleStrong = document.createElement('strong'),
      blockDesc = document.createElement('p'),
      titleText = document.createTextNode(titleString),
      descText = document.createTextNode(descString);

  block.className = 'courseblock';
  blockTitle.className = 'courseblocktitle';
  blockDesc.className = 'courseblockdesc';

  // create the block title
  block.appendChild(blockTitle)
    .appendChild(titleEm)
    .appendChild(titleStrong)
    .appendChild(titleText);

  // create the description
  block.appendChild(blockDesc)
    .appendChild(descText);
  
  return block;
}


function loadJSON ( fileUrl, callback ) {

  // use the XMLHttpRequest API
  var xobj = new XMLHttpRequest( );

  // ensures we get back a JSON file
  xobj.overrideMimeType('application/json');

  // initialize request file at fileUrl
  xobj.open('GET', fileUrl, true);

  // when the requested file is ready we send it to the callback function
  xobj.onreadystatechange = function ( ) {
    if ( xobj.readyState == 4 && xobj.status == '200' ) {
      callback(xobj.responseText);
    }
  };

  // send request
  xobj.send(null);
}



/* createNotice
 
  Creates a splash popup to notify user that the extension is busy working.
  The notice will not automatically be removed and must have .remove() called
  on it when it is time to remove it.

  Preconditions: document must be loaded
  Postconditions: returns reference to notice which has been appended as child
    to <body> element of document
*/
function createNotice ( ) {

  let TITLE_TEXT   = 'Missouri S&T Catalog Assist',
      MESSAGE_TEXT = 'Updating S&T Catalog Page.\nPlease wait...';

  let titleElement = document.createElement('h2'),
      msgElement = document.createElement('p'),
      strongElement = document.createElement('strong'),
      boxElement = document.createElement('div'),
      titleText = document.createTextNode(TITLE_TEXT),
      msgText = document.createTextNode(MESSAGE_TEXT);

  //create the title element
  boxElement.appendChild(titleElement)
    .appendChild(strongElement)
    .appendChild(titleText);

  // create message element
  boxElement.appendChild(msgElement)
    .appendChild(msgText);

  return drawPopup(boxElement);
}

function traverseSplitText ( splitText, element, child, nameIndex, courseData, deptNames, searchRegex ) {
  
  let last = null;
  let childIndexDelta = 0;
  let activeSplitTextRegex = new RegExp('^(' + searchRegex.source + '|' + fourDigitRE.source + ')$', 'i');

  for (let subText of splitText) {
    
    let newTextNode = document.createTextNode(subText);

    let parentNode = null;
    if ( subText.match(activeSplitTextRegex) ) { 
    
      let dept = deptNames[nameIndex];
      let num = subText.match( new RegExp(fourDigits, 'i'))[0];
      let key = dept + ' ' + num;

      parentNode = document.createElement('a');
      parentNode.href = '#courseinventory-';

      parentNode.addEventListener('click', function ( ) {
        console.log(key);
        var block = createCourseBlock(courseData[key]);
        var popup = drawPopup(block);
        console.log(this);
      });

      parentNode.appendChild(newTextNode);
    }

    // if the node we are pushing is not the parentNode,
    // ensure newTextNode is selected 
    var temp = parentNode;
    if (parentNode === null) {
      temp = newTextNode;
    }

    // if no element has been inserted yet, we must replace the current child
    if (last === null) {
      element.replaceChild(temp, child);
    }

    // otherwise, we must push it before the last element placed
    else {
      element.insertBefore(temp, last.nextSibling);
      childIndexDelta++;
    }

    last = temp;
  }
  return childIndexDelta;
}

function delayedOnJSONDataLoaded ( response ) {
  var notice = createNotice ( );
  window.setTimeout(function ( ) {
    onJSONDataLoaded(response);
    notice.remove();
  }, 200);
}


function onJSONDataLoaded ( response ) {

  console.log('data loaded');

  // create a JSON object with details about all courses offered
  var jsonData = JSON.parse(response);

  // create a separate list of only the Dept + Course Numbers exactly as
  // used as the keys in courseData
  var courseData = jsonData.courses;
  var courseNames = Object.keys(courseData);

  // list of strings used as prefixes for each department
  var deptNames = jsonData.departments;
  
  // list of regexps where any whitespace can separate words
  var regExpDeptNames = [];

  for ( var deptName of deptNames ) {
    var newRegExpDeptName = deptName.replace(/\s+/, '\\s+');
    regExpDeptNames.push(newRegExpDeptName);
  }

  // create a non-live list of all elements in the document
  var elements = document.body.querySelectorAll('*');

  // look through each element
  for ( var element of elements ) {
    
    // only elements to consider are those which are not already hyperlinks
    if ( element.tagName === 'A' && element.href !== '' ) {
      continue;
    }

    // look through each department name
    for ( let nameIndex = 0; nameIndex < deptNames.length; nameIndex++ ) {
      
      // for each element, look at its children nodes
      for ( var childIndex = 0; childIndex < element.childNodes.length; childIndex++ ) {
        var child = element.childNodes[childIndex];
      
        // if the child is a text node, then examine it further
        if ( child.nodeType === Node.TEXT_NODE ) {

          var childText = child.nodeValue;
          var splitText = [];

          var searchRegex = new RegExp( regExpDeptNames[nameIndex] + '\\s+' + regexAddendum, 'i');
          
          // if we found a course dept + number then we continue
          let result = childText.match(searchRegex);

          if ( result !== null ) {

            let resultString = result[0];
            let resultStart = result.index;
            let resultEnd = resultStart + resultString.length;
            
            let nums = resultString.match(new RegExp(fourDigitRE.source, 'gi'));

            let splitPoints = [0, resultStart];

            for ( let num of nums ) {
              let firstIndex = resultStart + resultString.indexOf(num);
              splitPoints.push(firstIndex);
              splitPoints.push(firstIndex + 4);
            }

            if ( splitPoints.length >= 2 ) {
              splitPoints.splice(2, 1);
            }
            
            splitPoints.push(resultEnd);

            let lastPoint = splitPoints[0];
            for ( let point of splitPoints ) {
              if (point == splitPoints[0]) continue;
              splitText.push(childText.slice(lastPoint, point));
              lastPoint = point;
            }
            splitText.push(childText.slice(resultEnd));

            
            console.log(splitText.join('') === childText);

            
            childIndex += traverseSplitText(splitText, element, child, nameIndex, courseData, deptNames, searchRegex )
            childIndex--;
            
          }
        }
      }
    }
  }
  console.log('All done!');
}


function chromeMessageListener ( request, sender, sendResponse ) {

  // this code only executes if the extension button is pressed
  if ( request.message === 'clicked_browser_action' ) {

    let dataURL = chrome.extension.getURL('courses.json');
    loadJSON(dataURL, delayedOnJSONDataLoaded);
  }
}


chrome.runtime.onMessage.addListener(chromeMessageListener);