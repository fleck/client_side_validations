import $ from 'jquery'

const ClientSideValidations = {
  callbacks: {
    element: {
      after: (element, eventData) => {},
      before: (element, eventData) => {},
      fail: (element, message, addError, eventData) => addError(),
      pass: (element, removeError, eventData) => removeError()
    },
    form: {
      after: (form, eventData) => {},
      before: (form, eventData) => {},
      fail: (form, eventData) => {},
      pass: (form, eventData) => {}
    }
  },
  enablers: {
    form: function (form) {
      let $form, binding, event, ref
      $form = $(form)
      form.ClientSideValidations = {
        settings: $form.data('clientSideValidations'),
        addError: (element, message) => ClientSideValidations
          .formBuilders[form.ClientSideValidations.settings.html_settings.type]
          .add(element, form.ClientSideValidations.settings.html_settings, message),
        removeError: (element) => ClientSideValidations
          .formBuilders[form.ClientSideValidations.settings.html_settings.type]
          .remove(element, form.ClientSideValidations.settings.html_settings)
      }
      ref = {
        'submit.ClientSideValidations': (eventData) => {
          if (!$form.isValid(form.ClientSideValidations.settings.validators)) {
            eventData.preventDefault()
            eventData.stopImmediatePropagation()
          }
        },
        'ajax:beforeSend.ClientSideValidations': function (eventData) {
          if (eventData.target === this) {
            $form.isValid(form.ClientSideValidations.settings.validators)
          }
        },
        'form:validate:after.ClientSideValidations': (eventData) => {
          ClientSideValidations.callbacks.form.after($form, eventData)
        },
        'form:validate:before.ClientSideValidations': (eventData) => {
          ClientSideValidations.callbacks.form.before($form, eventData)
        },
        'form:validate:fail.ClientSideValidations': (eventData) => {
          ClientSideValidations.callbacks.form.fail($form, eventData)
        },
        'form:validate:pass.ClientSideValidations': (eventData) => {
          ClientSideValidations.callbacks.form.pass($form, eventData)
        }
      }
      for (event in ref) {
        binding = ref[event]
        $form.on(event, binding)
      }
      return $form.find(ClientSideValidations.selectors.inputs).each(function () {
        return ClientSideValidations.enablers.input(this)
      })
    },
    input: function (input) {
      let $form, $input, binding, event, form, ref
      $input = $(input)
      form = input.form
      $form = $(form)
      ref = {
        'focusout.ClientSideValidations': function () {
          $(this).isValid(form.ClientSideValidations.settings.validators)
        },
        'change.ClientSideValidations': function () {
          $(this).data('changed', true)
        },
        'element:validate:after.ClientSideValidations': function (eventData) {
          ClientSideValidations.callbacks.element.after($(this), eventData)
        },
        'element:validate:before.ClientSideValidations': function (eventData) {
          ClientSideValidations.callbacks.element.before($(this), eventData)
        },
        'element:validate:fail.ClientSideValidations': function (eventData, message) {
          let element
          element = $(this)
          ClientSideValidations.callbacks.element.fail(element, message, function () {
            return form.ClientSideValidations.addError(element, message)
          }, eventData)
        },
        'element:validate:pass.ClientSideValidations': function (eventData) {
          let element
          element = $(this)
          ClientSideValidations.callbacks.element.pass(element, function () {
            return form.ClientSideValidations.removeError(element)
          }, eventData)
        }
      }
      for (event in ref) {
        binding = ref[event]
        $input.filter(':not(:radio):not([id$=_confirmation])').each(function () {
          return $(this).attr('data-validate', true)
        }).on(event, binding)
      }
      $input.filter(':checkbox').on('change.ClientSideValidations', function () {
        $(this).isValid(form.ClientSideValidations.settings.validators)
      })
      return $input.filter('[id$=_confirmation]').each(function () {
        let confirmationElement, element, ref1, results
        confirmationElement = $(this)
        element = $form.find('#' + (this.id.match(/(.+)_confirmation/)[1]) + ':input')
        if (element[0]) {
          ref1 = {
            'focusout.ClientSideValidations': () => {
              element.data('changed', true).isValid(form.ClientSideValidations.settings.validators)
            },
            'keyup.ClientSideValidations': () => {
              element.data('changed', true).isValid(form.ClientSideValidations.settings.validators)
            }
          }
          results = []
          for (event in ref1) {
            binding = ref1[event]
            results.push($('#' + (confirmationElement.attr('id'))).on(event, binding))
          }
          return results
        }
      })
    }
  },
  formBuilders: {
    'ActionView::Helpers::FormBuilder': {
      add: (element, settings, message) => {
        let form, inputErrorField, label, labelErrorField
        form = $(element[0].form)
        if (element.data('valid') !== false && (form.find("label.message[for='" + (element.attr('id')) + "']")[0] == null)) {
          inputErrorField = $(settings.input_tag)
          labelErrorField = $(settings.label_tag)
          label = form.find("label[for='" + (element.attr('id')) + "']:not(.message)")
          if (element.attr('autofocus')) {
            element.attr('autofocus', false)
          }
          element.before(inputErrorField)
          inputErrorField.find('span#input_tag').replaceWith(element)
          inputErrorField.find('label.message').attr('for', element.attr('id'))
          labelErrorField.find('label.message').attr('for', element.attr('id'))
          labelErrorField.insertAfter(label)
          labelErrorField.find('label#label_tag').replaceWith(label)
        }
        return form.find("label.message[for='" + (element.attr('id')) + "']").text(message)
      },
      remove: (element, settings) => {
        let errorFieldClass, form, inputErrorField, label, labelErrorField
        form = $(element[0].form)
        errorFieldClass = $(settings.input_tag).attr('class')
        inputErrorField = element.closest('.' + (errorFieldClass.replace(/ /g, '.')))
        label = form.find("label[for='" + (element.attr('id')) + "']:not(.message)")
        labelErrorField = label.closest('.' + errorFieldClass)
        if (inputErrorField[0]) {
          inputErrorField.find('#' + (element.attr('id'))).detach()
          inputErrorField.replaceWith(element)
          label.detach()
          return labelErrorField.replaceWith(label)
        }
      }
    }
  },
  patterns: {
    numericality: {
      'default': new RegExp('^[-+]?[0-9]*\\.?[0-9]+([eE][-+]?[0-9]+)?$'),
      only_integer: new RegExp('^[+-]?\\d+$')
    }
  },
  selectors: {
    inputs: ':input:not(button):not([type="submit"])[name]:visible:enabled',
    validate_inputs: ':input:enabled:visible[data-validate]',
    forms: 'form[data-client-side-validations]'
  },
  validators: {
    all: () => $.extend({}),
    local: {
      absence: (element, options) => {
        if (!/^\s*$/.test(element.val() || '')) {
          return options.message
        }
      },
      presence: presenceValidator,
      acceptance: acceptanceValidator,
      format: formatValidator,
      length: function (element, options) {
        let CHECKS, blankOptions, check, fn, message, operator, tokenizedLength, tokenizer
        tokenizer = options.js_tokenizer || "split('')"
        tokenizedLength = new Function('element', 'return (element.val().' + tokenizer + " || '').length")(element) // eslint-disable-line no-new-func
        CHECKS = {
          is: '==',
          minimum: '>=',
          maximum: '<='
        }
        blankOptions = {}
        blankOptions.message = options.is ? options.messages.is : options.minimum ? options.messages.minimum : void 0
        message = this.presence(element, blankOptions)
        if (message) {
          if (options.allow_blank === true) {
            return
          }
          return message
        }
        for (check in CHECKS) {
          operator = CHECKS[check]
          if (!options[check]) {
            continue
          }
          fn = new Function('return ' + tokenizedLength + ' ' + operator + ' ' + options[check]) // eslint-disable-line no-new-func
          if (!fn()) {
            return options.messages[check]
          }
        }
      },
      exclusion: function (element, options) {
        let lower, message, upper
        message = this.presence(element, options)
        if (message) {
          if (options.allow_blank === true) {
            return
          }
          return message
        }
        if (options['in']) {
          const results = []

          options['in'].forEach((option) => {
            results.push(option.toString())
          })

          if (results.indexOf(element.val()) >= 0) {
            return options.message
          }
        }
        if (options.range) {
          lower = options.range[0]
          upper = options.range[1]
          if (element.val() >= lower && element.val() <= upper) {
            return options.message
          }
        }
      },
      inclusion: function (element, options) {
        let lower, message, option, upper
        message = this.presence(element, options)
        if (message) {
          if (options.allow_blank === true) {
            return
          }
          return message
        }
        if (options['in']) {
          const results = []
          for (let i = 0, len = options['in'].length; i < len; i++) {
            option = options['in'][i]
            results.push(option.toString())
          }

          if (results.indexOf(element.val()) >= 0) return

          return options.message
        }
        if (options.range) {
          lower = options.range[0]
          upper = options.range[1]
          if (element.val() >= lower && element.val() <= upper) {
            return
          }
          return options.message
        }
      },
      confirmation: (element, options) => {
        let confirmationValue, value
        value = element.val()
        confirmationValue = $('#' + (element.attr('id')) + '_confirmation').val()
        if (!options.case_sensitive) {
          value = value.toLowerCase()
          confirmationValue = confirmationValue.toLowerCase()
        }
        if (value !== confirmationValue) {
          return options.message
        }
      },
      uniqueness: (element, options) => {
        let form, matches, name, namePrefix, nameSuffix, valid, value
        name = element.attr('name')
        if (/_attributes\]\[\d/.test(name)) {
          matches = name.match(/^(.+_attributes\])\[\d+\](.+)$/)
          namePrefix = matches[1]
          nameSuffix = matches[2]
          value = element.val()
          if (namePrefix && nameSuffix) {
            form = element.closest('form')
            valid = true
            form.find(':input[name^="' + namePrefix + '"][name$="' + nameSuffix + '"]').each(function () {
              if ($(this).attr('name') !== name) {
                if ($(this).val() === value) {
                  valid = false
                  return $(this).data('notLocallyUnique', true)
                } else {
                  if ($(this).data('notLocallyUnique')) {
                    return $(this).removeData('notLocallyUnique').data('changed', true)
                  }
                }
              }
            })
            if (!valid) {
              return options.message
            }
          }
        }
      }
    },
    remote: {}
  },
  disable: (target) => {
    let $target
    $target = $(target)
    $target.off('.ClientSideValidations')
    if ($target.is('form')) {
      return ClientSideValidations.disable($target.find(':input'))
    } else {
      $target.removeData('valid')
      $target.removeData('changed')
      return $target.filter(':input').each(function () {
        return $(this).removeAttr('data-validate')
      })
    }
  },
  reset: function (form) {
    let $form, key
    $form = $(form)
    ClientSideValidations.disable(form)
    for (key in form.ClientSideValidations.settings.validators) {
      form.ClientSideValidations.removeError($form.find("[name='" + key + "']"))
    }
    return ClientSideValidations.enablers.form(form)
  }
}

export default ClientSideValidations
