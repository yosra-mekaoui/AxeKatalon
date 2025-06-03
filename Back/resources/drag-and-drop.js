var args = arguments,
  element = args[0],
  offsetX = args[1],
  offsetY = args[2],
  doc = (element != null ? element.ownerDocument : document) || document;

// Default drop zone to the body
target = document.body;

// if a custom drop zone is provided, check for interactability
if (element != null) {
  for (var i = 0; ; ) {
    var box = element.getBoundingClientRect(),
      clientX = box.left + (offsetX || box.width / 2),
      clientY = box.top + (offsetY || box.height / 2),
      target = doc.elementFromPoint(clientX, clientY);

    if (target && element.contains(target)) break;

    if (++i > 1) {
      var ex = new Error("Element not interactable");
      ex.code = 15;
      throw ex;
    }

    element.scrollIntoView({
      behavior: "instant",
      block: "center",
      inline: "center"
    });
  }
}
// Create virtual input
var input = doc.createElement("INPUT");
input.setAttribute("type", "file");
input.setAttribute("multiple", "");
input.setAttribute("style", "position:fixed;z-index:2147483647;left:0;top:0;");
input.onchange = function(ev) {
  // Remove this virtual input
  input.parentElement.removeChild(input);
  // Prevent side effects
  ev.stopPropagation();
  
  // Prepare dataTransfer object that contains the files
  var dataTransfer = {
    constructor: DataTransfer,
    effectAllowed: "all",
    dropEffect: "none",
    types: ["Files"],
    files: input.files,
    setData: function setData() {},
    getData: function getData() {},
    clearData: function clearData() {},
    setDragImage: function setDragImage() {}
  };
  
  if (window.DataTransferItemList) {
    dataTransfer.items = Object.setPrototypeOf(
      Array.prototype.map.call(input.files, function(file) {
        return {
          constructor: DataTransferItem,
          kind: "file",
          type: file.type,
          getAsFile: function getAsFile() {
            return file;
          },
          getAsString: function getAsString(callback) {
            var reader = new FileReader();
            reader.onload = function(ev) {
              callback(ev.target.result);
            };
            reader.readAsText(file);
          }
        };
      }),
      {
        constructor: DataTransferItemList,
        add: function add() {},
        clear: function clear() {},
        remove: function remove() {}
      }
    );
  }
  // Attach dataTransfer to events and dispatch them to the drop zone
  ["dragenter", "dragover", "drop"].forEach(function(type) {
    var event = doc.createEvent("DragEvent");
    event.initMouseEvent(
      type,
      true,
      true,
      doc.defaultView,
      0,
      0,
      0,
      clientX,
      clientY,
      false,
      false,
      false,
      false,
      0,
      null
    );

    Object.setPrototypeOf(event, null);
    event.dataTransfer = dataTransfer;
    Object.setPrototypeOf(event, DragEvent.prototype);

    target.dispatchEvent(event);
  });
};

doc.documentElement.appendChild(input);
input.getBoundingClientRect(); /* force reflow for Firefox */
return input;
