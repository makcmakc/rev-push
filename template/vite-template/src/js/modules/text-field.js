import { $ } from "../utils/dom"

const $textFields = $(document).findAll('.text-field')

if ($textFields) {
  $textFields.forEach(tf => {
    const $clearBtn = tf.querySelector('.text-field__clear')
    const $input = tf.querySelector('.text-field__input')

    $($input).on('input', () => {
      if ($($input).value !== '') {
        if ($clearBtn) {
          $($clearBtn).css({ display: 'flex' })
          $($clearBtn).on('click', () => {
            $input.value = null
            $($clearBtn).css({ display: 'none' })
            $($input).focus()
          })
        }
      }

      if ($($input).value === '' || $($input).value === ' ') {
        $($clearBtn).css({ display: 'none' })
      }      
    })
  })
}


// Vanilla 
// const $textFields = document.querySelectorAll('.text-field')

// if ($textFields) {
//   $textFields.forEach(tf => {
//     const $clearBtn = tf.querySelector('.text-field__clear')
//     const $input = tf.querySelector('.text-field__input')

//     $input.addEventListener('input', () => {
//       if ($input.value !== '') {
          // if ($clearBtn) {
          //   $clearBtn.style.display = 'flex'

          //   $clearBtn.addEventListener('click', () => {
          //     $input.value = null
          //     $clearBtn.style.display = 'none'
          //     $input.focus()
          //   })
          // }
//       }

//       if ($input.value === '' || $input.value === ' ') {
//         $clearBtn.style.display = 'none'
//       }      
//     })
//   })
// }
