// content.js
var fourDigits = '\\d{4}';
var orPart = '\\s+\\(?or\\s+' + fourDigits + '\\)?';
var andPart = '\\s*\\,?(and|\\&)?\\s+' + fourDigits;
var digitsRegex = '(' + fourDigits + '(' + orPart + '|' + andPart + ')*)';

var fourDigitRE = /\d{4}/;
var orPart = /\s+\(?or\s+\d{4}\)?/;
var andPart = /\s*\,?(and|\&)?\s+\d{4}/;
var altogether = new RegExp('(' + fourDigitRE.source + '(' + orPart.source + '|' + andPart.source + ')*)', 'i' );
//(\d{4}(\s+\(?or\s+\d{4}\)?|\s*\,?(and|\&)?\s+\d{4})*)
console.log(altogether.source);
console.log(digitsRegex);
var regexAddendum = digitsRegex;

function getRelevantNumbers ( regexResult ) {

  var nums = [];
  nums = regexResult.match(fourDigitRE.source, 'gi');
  return nums;
}

function drawPopup( contentChild ) {

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

  // attach the functions to listeners
  content.addEventListener('click', onContentClicked);
  popup.addEventListener('click', onPopupClicked);

  // put the popup together
  content.appendChild(contentChild);
  popup.appendChild(content);
  document.body.appendChild(popup);

  return popup;
}

function createCourseBlock(data) {
  
  var block = document.createElement('div');
  block.className = 'courseblock';

  var blockTitle = document.createElement('p');
  blockTitle.className = 'courseblocktitle';

  var titleEmphasis = document.createElement('em');

  var titleBolding = document.createElement('strong');

  var titleString = data['course_name'];

  var titleText = document.createTextNode(titleString);
  titleBolding.appendChild(titleText);
  titleEmphasis.appendChild(titleBolding);
  blockTitle.appendChild(titleEmphasis);
  block.appendChild(blockTitle);

  var blockDesc = document.createElement('p');
  blockDesc.className = 'courseblockdesc';

  var descString = data['description'];

  var descText = document.createTextNode(descString);
  blockDesc.appendChild(descText);
  block.appendChild(blockDesc);

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


chrome.runtime.onMessage.addListener( function (request, sender, sendResponse) {

  // this code only executes if the extension button is pressed
  if ( request.message === 'clicked_browser_action' ) { 

    // load the course data
    loadJSON(chrome.extension.getURL('courses.json'), function ( response ) {

      console.log('data loaded');

      // create a JSON object with details about all courses offered
      var courseData = JSON.parse(response);

      // create a separate list of only the Dept + Course Numbers exactly as
      // used as the keys in courseData
      var courseNames = Object.keys(courseData);

      // create a list of only the prefixes used by each department
      var deptNames = [];
      var regExpDeptNames = [];
      
      // create a separate list of regular expressions where whitespace of
      // any kind can be used to separate the words
      var regExpNames = [];
      for ( var courseName of courseNames ) {

        var newDeptName = '';
        var newRegExpDeptname = '';
        for (word of courseName.split(' ')) {
          if (word.match(/\d/)) {
            break;
          }
          if (newDeptName !== '') {
            newDeptName += ' ';
            newRegExpDeptname += '\\s+'
          }
          newDeptName += word;
          newRegExpDeptname += word;
        }

        if (!deptNames.includes(newDeptName)) {
          deptNames.push(newDeptName);
          regExpDeptNames.push(newRegExpDeptname);
        }
        
        // replace spaces with arbitrary whitespace
        var regExpName = courseName.replace(/\s+/gi, '[\\s+]');

        // create a capturing case-insensitive regular expression version
        // of the courseName and push it to the list
        var captureRegExpName = new RegExp('\(' + regExpName + '\)', 'i');
        regExpNames.push(captureRegExpName);
      }


      // create a non-live list of all elements in the document
      var elements = document.querySelectorAll('*');

      // look through each element
      for ( var element of elements ) {
        
        for ( let nameIndex = 0; nameIndex < deptNames.length; nameIndex++ ) {
        
        // for each element, we look at its children nodes
        for ( var childIndex = 0; childIndex < element.childNodes.length; childIndex++ ) {
          var child = element.childNodes[childIndex];
          
            // if the child is a text node, then we examine it further
            if ( child.nodeType === Node.TEXT_NODE ) {

              if ( element.tagName === 'A' && element.href !== '') {
                continue;
              }
              var childText = child.nodeValue;
              var splitText = [];

              var searchRegex = new RegExp( regExpDeptNames[nameIndex] + '\\s+' + regexAddendum, 'i');
              
              // if we found a course dept + number then we continue
              let result = childText.match(searchRegex);
              if ( result !== null ) {

                let resultString = result[0];
                let resultStart = result.index;
                let resultEnd = result.index + resultString.length;
                
                let nums = getRelevantNumbers(resultString);

                let splitPoints = [0, resultStart];
                
                for (let num of nums) {
                  let firstIndex = resultStart + resultString.indexOf(num);

                  splitPoints.push(firstIndex);
                  splitPoints.push(firstIndex + 4);
                }
                if (splitPoints.length > 2)
                  splitPoints.splice(2,1);
                
                splitPoints.push(resultEnd);

                for (let pointIndex = 1; pointIndex < splitPoints.length; pointIndex++) {
                  let lastPoint = splitPoints[pointIndex - 1];
                  let point = splitPoints[pointIndex];
                  splitText.push(childText.slice(lastPoint, point));
                }

                splitText.push(childText.slice(resultEnd));

                console.log(splitText.join('') === childText);

                
                var last = null;

                
                for (let subIndex = splitText.length - 1; subIndex >= 0; subIndex-- ) {
                  
                  let subText = splitText[subIndex];
                  
                  let newTextNode = document.createTextNode(subText);

                  let parentNode = null;
                  if ( subText.match(new RegExp('^' + searchRegex.source + '$', 'i')) 
                    || subText.match(new RegExp('^' + fourDigitRE.source + '$', 'i')) ) {

                    let dept = deptNames[nameIndex];
                    let num = subText.match( new RegExp(fourDigits, 'i'))[0];
                    let key = dept + ' ' + num;


                    parentNode = document.createElement('a');
                    parentNode.href = '#';

                    parentNode.addEventListener('click', function ( ) {
                      console.log(key);
                      var block = createCourseBlock(courseData[key]);
                      var popup = drawPopup(block);
                      console.log(this);
                    });

                    parentNode.appendChild(newTextNode);
                  }

                  // if we have already inserted an element, we relate to last
                  // if not, we must first replace the current child

                  var temp = parentNode;
                  if (parentNode === null) {
                    temp = newTextNode;
                  }

                  if (last === null) { 
                    element.replaceChild(temp, child);
                    last = temp;
                  }
                  else {
                    element.insertBefore(temp, last);
                    last = temp;
                    childIndex++;
                  }
                }
              }
            }
          }
        }
      }

      console.log('All done!');

    });

  }
  
})