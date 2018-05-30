import $ from 'jquery'
import ClientSideValidations from '../ClientSideValidations'

ClientSideValidations.validators.numericality = function (element, options) {
  let $form, CHECKS, check, checkValue, fn, numberFormat, operator, val

  if (options.allow_blank === true && this.presence(element, {
    message: options.messages.numericality
  })) {
    return
  }

  $form = $(element[0].form)
  numberFormat = $form[0].ClientSideValidations.settings.number_format
  val = $.trim(element.val()).replace(new RegExp('\\' + numberFormat.separator, 'g'), '.')

  if (options.only_integer && !ClientSideValidations.patterns.numericality.only_integer.test(val)) {
    return options.messages.only_integer
  }

  if (!ClientSideValidations.patterns.numericality['default'].test(val)) {
    return options.messages.numericality
  }

  CHECKS = {
    greater_than: '>',
    greater_than_or_equal_to: '>=',
    equal_to: '==',
    less_than: '<',
    less_than_or_equal_to: '<='
  }

  for (check in CHECKS) {
    operator = CHECKS[check]
    if (!(options[check] != null)) {
      continue
    }
    checkValue = !isNaN(parseFloat(options[check])) && isFinite(options[check]) ? options[check] : $form.find('[name*=' + options[check] + ']').length === 1 ? $form.find('[name*=' + options[check] + ']').val() : void 0
    if ((checkValue == null) || checkValue === '') {
      return
    }
    fn = new Function('return ' + val + ' ' + operator + ' ' + checkValue) // eslint-disable-line no-new-func
    if (!fn()) {
      return options.messages[check]
    }
  }

  if (options.odd && !(parseInt(val, 10) % 2)) {
    return options.messages.odd
  }

  if (options.even && (parseInt(val, 10) % 2)) {
    return options.messages.even
  }
}
