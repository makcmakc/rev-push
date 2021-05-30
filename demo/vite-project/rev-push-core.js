export class StarRating {
  constructor(options) {
    this.options = options

    const { el } = this.options
    this.$el = document.querySelector(el)

    this.stars = []
    this.disabled
    this.defaultRating = null
    this.currentRating = 0
    this.disable = false
    this.enable = true
    this.currentRating = null

    this.maxStars()
    this.showDefaultRating()

    this.onrate = function (rating) {}  
  }


  attr(name, d) {
    let a = this.$el.getAttribute(name)
    return (a ? a : d)
  }

  maxStars() {
    let max = parseInt(this.attr('data-stars', 5))
    this.disabled = typeof this.$el.getAttribute('disabled') != 'undefined'
    this.defaultRating = parseFloat(this.attr('data-default-rating', 0))
    this.currentRating = -1

    this.$el.style.display = 'inline-block';

    for (let s = 0; s < max; s++) {
      let n = document.createElement('span')
      n.className = 'star'
      n.addEventListener('click', this.starClick)

      if (s > 0)
        this.stars[s - 1].appendChild(n);
      else
        this.$el.appendChild(n)

      this.stars.push(n)
    }
  }

  disable() {
    this.$el.setAttribute('disabled', '')
    this.disabled = true
  }

  enable() {
    this.$el.removeAttribute('disabled')
    this.disabled = false
  }

  setCurrentRating(rating) {
    this.currentRating = rating
    this.$el.setAttribute('data-rating', this.currentRating)
    this.showCurrentRating()
  }

  setDefaultRating(rating) {
    this.defaultRating = rating
    this.$el.setAttribute('data-default-rating', this.defaultRating)
    this.showDefaultRating()
  }

  showDefaultRating() {
    this.defaultRating = parseFloat(this.attr('data-default-rating', 0))
    this.showRating(this.defaultRating)
  }

  showRating(r) {
    this.clearRating()
    for (let i = 0; i < this.stars.length; i++) {
      if (i >= r)
        break
      if (i === Math.floor(r) && i !== r)
        this.stars[i].classList.add('half')

      this.stars[i].classList.add('active')
    }    
  }

  clearRating() {
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i].classList.remove('active')
      this.stars[i].classList.remove('half')
    }
  }

  starClick(e) {
    if (this.disabled) return

    if (e.target) {
      
    }
  }  
}
 
