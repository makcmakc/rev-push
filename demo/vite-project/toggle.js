import { error, exist } from './utils/error'

class Toggle {
  constructor(root, options = {}, ) {
    this.root = root instanceof Element ? root : document.querySelector( root )
    		exist( this.root, 'An invalid element/selector was given.' );
  } 

  // Show an element
  show(elem) {

    // Get the natural height of the element
    function getHeight() {
      elem.style.display = 'block'; // Make it visible
      let height = elem.scrollHeight + 'px'; // Get it's height
      elem.style.display = ''; //  Hide it again
      return height;
    };

    let height = getHeight(); // Get the natural height
    elem.classList.add('is-visible'); // Make the element visible
    elem.style.height = height; // Update the max-height

    // Once the transition is complete, remove the inline max-height so the content can scale responsively
    window.setTimeout(function () {
      elem.style.height = '';
    }, 350);

  };

  // Hide an element
  hide(elem) {

    // Give the element a height to change from
    elem.style.height = elem.scrollHeight + 'px';

    // Set the height back to 0
    window.setTimeout(function () {
      elem.style.height = '0';
    }, 1);

    // When the transition is complete, hide it
    window.setTimeout(function () {
      elem.classList.remove('is-visible');
    }, 350);

  };

  // Toggle element visibility
  toggle(elem) {

    // If the element is visible, hide it
    if (elem.classList.contains('is-visible')) {
      hide(elem);
      return;
    }

    // Otherwise, show it
    show(elem);
    
  };


}


  const anim = document.querySelector('.anim')
  // Listen for click events
  document.addEventListener('click', function (event) {

    // Make sure clicked element is our toggle
    if (!event.target.classList.contains('has-toggle')) return;

    // Prevent default link behavior
    event.preventDefault();

    // Get the content
    let content = document.querySelector(event.target.hash);
    if (!content) return;

    // Toggle the content
    toggle(content, 3000);

  }, false);