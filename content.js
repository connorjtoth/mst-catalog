// content.js
function drawPopup( ) {

  // debounce for clicking on the popup
  var debounce = false;

  // flag for when the content part of the popup is clicked
  var contentClicked = false;

  // the page curtain that highlights the content of the popup
  var popup = document.createElement('div');
  
  // the CSS properties we want to set
  var popupStyles = {
    backgroundColor: 'black',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '150%',
    height: '150%',
    opacity: '.7'
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
    height: '50%',
    opacity: '1',
    borderRadius: '20px'
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
  popup.appendChild(content);
  document.body.appendChild(popup);
}


function createBubble(data)
{
  var bubble = document.createElement('div');
  bubble.className = 'lfjsbubble';
  bubble.style = 'width: 450px; position: absolute; top: 299.4px; left: 0px; display: block;';

  var closeButton = document.createElement('img');
  closeButton.id = 'lfjsbubbleclose';
  closeButton.title = 'Close';
  closeButton.src = '/js/lfjsimages/cancel.gif';
  bubble.appendChild(closeButton);

  var top = document.createElement('div');
  top.className = 'lfjsbubbletop';
  bubble.appendChild(top);

  var topRight = document.createElement('div');
  topRight.className = 'lfjsbubbletopright';
  bubble.appendChild(topRight);

  var  mainWrapper = document.createElement('div');
  mainWrapper.className = 'lfjsbubblemainwrapper';

  var main = document.createElement('div');
  main.className = 'lfjsbubblemain';

  var content = document.createElement('div');
  content.className = 'lfjsbubblecontent';

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

  content.appendChild(block);
  main.appendChild(content);
  mainWrapper.appendChild(main);
  bubble.appendChild(mainWrapper);

  var bottom = document.createElement('div');
  bottom.className = 'lfjsbubblebottom';
  bubble.appendChild(bottom);

  var bottomRight = document.createElement('div');
  bottomRight.className = 'lfjsbubblebottomright';
  bubble.appendChild(bottomRight);

  var tail = document.createElement('div');
  tail.className = 'lfjsbubbletail left';
  tail.style = {'right': '397.4px'};
  bubble.appendChild(tail);

  closeButton.addEventListener('click', function ( ) {
    bubble.style = 'display: none;';
    bubble.remove();
//    (function ( ) { return bubble.parentElement})().removeChild(bubble);
  })

  return bubble;
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
      
      // create a separate list of regular expressions where whitespace of
      // any kind can be used to separate the words
      var regExpNames = [];
      for ( var courseName of courseNames ) {
        var regExpName = courseName.replace(/\s+/gi, '[\\s+]');
        regExpNames.push(new RegExp('\(' + regExpName + '\)', 'i') );
      }

      // create a non-live list of all elements in the document
      var elements = document.querySelectorAll('*');

      for ( var element of elements ) {

        // for each element, we look at its children nodes
        for ( var childIndex = 0; childIndex < element.childNodes.length; childIndex++ ) {
          var child = element.childNodes[childIndex];
          
          // if the child is a text node, then we examine it further
          if ( child.nodeType === Node.TEXT_NODE ) {

            var childText = child.nodeValue;
            var replacementText = childText.replace(regExpNames[0], '$' + regExpNames[0]);

            // if we found a course dept+number then we continue
            if (childText !== replacementText) {

              // split the text at the course dept+number, (inclusive of delimeter)
              var splitText = childText.split(regExpNames[0]);

              // last represents the last element that was added into the element
              var last = null;

              // 
              for (var subIndex = splitText.length - 1; subIndex >= 0; subIndex-- ) {
                
                var subText = splitText[subIndex];
                
                var newTextNode = document.createTextNode(subText);

                var parentNode = null;
                if (subText.match(regExpNames[0])) {
                  
                  parentNode = document.createElement('a');
                  parentNode.href = '#';
                  
                  parentNode.addEventListener('click', function ( ) {

                    var bubble = createBubble( courseData[courseNames[0]] );
                    console.log(bubble);
                    console.log(this);
                    this.parentNode.insertBefore(bubble, this.nextSibling);
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

      console.log('All done!');








    });

  }


  
})