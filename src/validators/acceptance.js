export default function (element, options) {
  let ref

  switch (element.attr('type')) {
    case 'checkbox':
      if (!element.prop('checked')) {
        return options.message
      }
      break
    case 'text':
      if (element.val() !== (((ref = options.accept) != null ? ref.toString() : void 0) || '1')) {
        return options.message
      }
  }
}
