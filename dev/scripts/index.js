var getJSON = require('./get-json.js');

function getUrlVars() {
    var vars = {};
    window.location.href.replace(/[#&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
        vars[key] = decodeURIComponent(value);
    });
    return vars;
}

// Debounce function
function debounce(fn, delay) {
  var timer = null;
  return function() {
    var context = this,
        args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function() {
      fn.apply(context, args);
    }, delay);
  };
}

// Loader func
function loader(loading) {
  var readerContainer = document.getElementById('reader-container');
  var waitingContainer = document.getElementById('waiting-container');
  if (loading) {
    readerContainer.style.display = 'none';
    waitingContainer.style.display = 'block';
  } else {
    readerContainer.style.display = 'block';
    waitingContainer.style.display = 'none';
  }
}

// Loaded via <script> tag, create shortcut to access PDF.js exports.
var pdfjsLib = window['pdfjs-dist/build/pdf'];

// The workerSrc property shall be specified.
pdfjsLib.GlobalWorkerOptions.workerSrc = '/scripts/pdf.worker.js';

var pdfDoc = null,
    pageNum = 1,
    pageRendering = false,
    pageNumPending = null,
    canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
    var box = document.getElementById('inputs')
    var width = box.offsetWidth;

    var viewport = page.getViewport({scale: width / page.getViewport({ scale: 1.0 }).width}); // Math.min(window.innerWidth, window.innerHeight) / page.getViewport({scale: 1.0}).width 
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      } else {
        loader(pageRendering);
      }
    });
  });

  // Update page counters
  document.getElementById('page_num').textContent = num;
}

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

/**
 * Displays previous page.
 */
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

/**
 * Displays next page.
 */
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

// Resize page
var resizeTimeout;
window.addEventListener('resize', debounce(function() {
  if (resizeTimeout) {
    window.cancelAnimationFrame(resizeTimeout);
  }
  resizeTimeout = window.requestAnimationFrame(function() {
    renderPage(pageNum);
  });
},100));


function displayDoc(json,docuri) {
  if (json.hasOwnProperty(docuri)) {
    loader(true);
    document.getElementById('no-data').style.display = 'none';
    document.getElementById('data-received').style.display = 'block';
    document.getElementById('inputs').style.display = 'block';
    document.getElementById('document-title').innerHTML = json[docuri].name;
    var url = json[docuri].url;
    /**
     * Asynchronously downloads PDF.
     */
    pdfjsLib.getDocument(url).promise.then(function(pdfDoc_) {
      pdfDoc = pdfDoc_;
      document.getElementById('page_count').textContent = pdfDoc.numPages;

      // Initial/first page rendering
      pageNum = 1;
      renderPage(pageNum);
    });
  }
} 

function createLink(json, key, list) {
      var link = document.createElement('a');
      link.href = '/#doc=' + key;
      link.textContent = json[key].name;
      link.setAttribute("key", key)
      link.onclick = function () {
        displayDoc(json, link.getAttribute("key"));
      }
      var item = document.createElement('li');
      item.appendChild(link);
      list.appendChild(item);
}

// Get document list
getJSON('/documents.json', function (error, json) {
  if (error) console.error(error);
  var listContainer = document.getElementById('list');
  var list = document.createElement('ul');
  for (var key in json) {
    if (json[key].public) {
      createLink(json, key, list)
    }
  }
  listContainer.appendChild(list);

  var vars = getUrlVars();
  var docuri = '';
  if (vars.hasOwnProperty('livre')) {
    docuri = vars.livre;
  }
  if (vars.hasOwnProperty('doc')) {
    docuri = vars.doc;
  }
  if (docuri != '') {
    loader(true);
    displayDoc(json, docuri);
  }
});