export default function (element, options) {
  let message

  message = this.presence(element, options)

  if (message) {
    if (options.allow_blank === true) {
      return
    }
    return message
  }

  if (options.with && !new RegExp(options.with.source, options.with.options).test(element.val())) {
    return options.message
  }

  if (options.without && new RegExp(options.without.source, options.without.options).test(element.val())) {
    return options.message
  }
}
