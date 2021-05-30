function outsideClick(event, notelem)	{
  notelem = $(notelem); // jquerize (optional)
  // check outside click for multiple elements
  var clickedOut = true, i, len = notelem.length
  for (i = 0; i < len; i++)  {
    if (event.target == notelem[i] || notelem[i].contains(event.target)) {
      clickedOut = false
    }
  }
  if (clickedOut) return true
  else return false
}

// Usage
// var modal = document.getElementById("modal");
// window.addEventListener('click', function(e) {
//    if (outsideClick(e, modal)) {
//    		// close modal
//    }
// });