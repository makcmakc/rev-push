// import { Tabs, Menu, Select, Modal, Dropdown, Autocomplete, StartRating, Accordion, Stepper, Notifications, Tooltip } from 'core'


// new Tabs({
//   el: '.tabs-container',
//   type: 'fade' | 'slide' | 'scale'
// })

// new Menu({
//   el: '.menu-container',
//   type: 'fade' | 'scale' | 'slideTop' | 'slideLeft' | 'sliderRight'
// })

// new SubMenu({
//   el: '.menu-container',
//   type: 'fade' | 'scale' | 'slideTop' | 'slideLeft' | 'sliderRight'
// })

// new Stepper({
//   el: '.menu-container',
//   type: 'fade' | 'scale' | 'slideTop' | 'slideLeft' | 'sliderRight'
// })

// new ShowMore({
//   el: '.menu-container',
//   type: 'fade' | 'scale' | 'slideTop' | 'slideLeft' | 'sliderRight'
// })

// new StartRating({
//   el: '.rating'
// })

// new Select({
//   el: '.select'
// })

// new Accordion({
//   el: '.accordion-container',
//   openAll: true,
//   duration: 250,
//   showMultiple: false,
//   collapse: true,

// })









import './style.scss'

import { StarRating } from "./starRating.js"
// import { Tabs } from "./tabs.js"

new StarRating({
  el: '.rating'
});






[].slice.call(document.querySelectorAll('.has-dropdown .nav-link')).forEach(function(el) {
  el.addEventListener('click', onClick, false)
})

function onClick(e){
  e.preventDefault()
  let el = this.parentNode
  el.classList.contains('expanded') ? hideSubMenu(el) : showSubMenu(el)
}

function showSubMenu(el){
  el.classList.add('expanded')
  document.addEventListener('click', function onDocClick(e) {
    e.preventDefault()
    if(el.contains(e.target)) {
      return
    }
    document.removeEventListener('click', onDocClick)
    hideSubMenu(el)
  })
}

function hideSubMenu(el){
  el.classList.remove('expanded')
}
