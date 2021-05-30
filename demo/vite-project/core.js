import { Tabs, Menu, Select, Modal, Dropdown, Autocomplete, StartRating, Accordion, Stepper, Notifications, Tooltip } from 'core'


new Tabs({
  el: '.tabs-container',
  type: 'fade' | 'slide' | 'scale'
})

new Menu({
  el: '.menu-container',
  type: 'fade' | 'scale' | 'slideTop' | 'slideLeft' | 'sliderRight'
})

new StartRating({
  el: '.rating'
})

new Select({
  el: '.select'
})

new Accordion({
  el: '.accordion-container',
  openAll: true,
  duration: 250,
  showMultiple: false,
  collapse: true,

})
