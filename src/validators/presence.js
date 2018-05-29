export default function (element, options) {
  if (/^\s*$/.test(element.val() || '')) {
    return options.message
  }
}
