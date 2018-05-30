import $ from 'jquery'
import ClientSideValidations from './ClientSideValidations'
import './validators/numericality'

// import acceptanceValidator from './validators/acceptance'
// import formatValidator from './validators/format'
// import presenceValidator from './validators/presence'

let initializeOnEvent, validateElement, validateForm, validatorsFor

$.fn.disableClientSideValidations = function () {
  ClientSideValidations.disable(this)
  return this
}

$.fn.enableClientSideValidations = function () {
  this.filter(ClientSideValidations.selectors.forms).each(function () {
    return ClientSideValidations.enablers.form(this)
  })
  this.filter(ClientSideValidations.selectors.inputs).each(function () {
    return ClientSideValidations.enablers.input(this)
  })
  return this
}

$.fn.resetClientSideValidations = function () {
  this.filter(ClientSideValidations.selectors.forms).each(function () {
    return ClientSideValidations.reset(this)
  })
  return this
}

$.fn.validate = function () {
  this.filter(ClientSideValidations.selectors.forms).each(function () {
    return $(this).enableClientSideValidations()
  })
  return this
}

$.fn.isValid = function (validators) {
  let obj
  obj = $(this[0])
  if (obj.is('form')) {
    return validateForm(obj, validators)
  } else {
    return validateElement(obj, validatorsFor(this[0].name, validators))
  }
}

validatorsFor = (name, validators) => {
  if (validators.hasOwnProperty(name)) {
    return validators[name]
  }
  name = name.replace(/\[(\w+_attributes)\]\[[\da-z_]+\](?=\[(?:\w+_attributes)\])/g, '[$1][]')

  const captures = name.match(/\[(\w+_attributes)\].*\[(\w+)\]$/)

  if (captures) {
    for (const validatorName in validators) {
      if (validatorName.match('\\[' + captures[1] + '\\].*\\[\\]\\[' + captures[2] + '\\]$')) {
        name = name.replace(/\[[\da-z_]+\]\[(\w+)\]$/g, '[][$1]')
      }
    }
  }
  return validators[name] || {}
}

validateForm = (form, validators) => {
  form.trigger('form:validate:before.ClientSideValidations')
  let valid = true
  form.find(ClientSideValidations.selectors.validate_inputs).each(function () {
    if (!$(this).isValid(validators)) {
      valid = false
    }
    return true
  })
  if (valid) {
    form.trigger('form:validate:pass.ClientSideValidations')
  } else {
    form.trigger('form:validate:fail.ClientSideValidations')
  }
  form.trigger('form:validate:after.ClientSideValidations')
  return valid
}

validateElement = (element, validators) => {
  let afterValidate, destroyInputName, executeValidators, failElement, local, passElement, remote
  element.trigger('element:validate:before.ClientSideValidations')
  passElement = () => {
    return element.trigger('element:validate:pass.ClientSideValidations').data('valid', null)
  }
  failElement = (message) => {
    element.trigger('element:validate:fail.ClientSideValidations', message).data('valid', false)
    return false
  }
  afterValidate = () => {
    return element.trigger('element:validate:after.ClientSideValidations').data('valid') !== false
  }
  executeValidators = (context) => {
    let fn, i, kind, len, ref, valid, validator

    valid = true
    for (kind in context) {
      fn = context[kind]
      if (validators[kind]) {
        ref = validators[kind]
        for (i = 0, len = ref.length; i < len; i++) {
          validator = ref[i]

          let message = fn.call(context, element, validator)
          if (message) {
            valid = failElement(message)
            break
          }
        }
        if (!valid) {
          break
        }
      }
    }
    return valid
  }
  if (element.attr('name').search(/\[([^\]]*?)\]$/) >= 0) {
    destroyInputName = element.attr('name').replace(/\[([^\]]*?)\]$/, '[_destroy]')
    if ($("input[name='" + destroyInputName + "']").val() === '1') {
      passElement()
      return afterValidate()
    }
  }
  if (element.data('changed') === false) {
    return afterValidate()
  }
  element.data('changed', false)
  local = ClientSideValidations.validators.local
  remote = ClientSideValidations.validators.remote
  if (executeValidators(local) && executeValidators(remote)) {
    passElement()
  }
  return afterValidate()
}

if ((window.Turbolinks != null) && window.Turbolinks.supported) {
  initializeOnEvent = window.Turbolinks.EVENTS != null ? 'page:change' : 'turbolinks:load'
  $(document).on(initializeOnEvent, () => $(ClientSideValidations.selectors.forms).validate())
} else {
  $(() => $(ClientSideValidations.selectors.forms).validate())
}

window.ClientSideValidations = ClientSideValidations

export default {
  ClientSideValidations
}
