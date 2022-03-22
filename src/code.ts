import { merge, set } from 'lodash'

figma.showUI(__html__, { width: 480, height: 480 })
function componentToRGBNumber(c: number) {
  return Math.round(c * 255)
}
function componentToHex(c: number) {
  var hex = (componentToRGBNumber(c) | (1 << 8)).toString(16).slice(1)
  return hex.length == 1 ? '0' + hex : hex
}

function rgbaToHex(r: number, g: number, b: number, a?: number) {
  let hex = '#' + componentToHex(r) + componentToHex(g) + componentToHex(b)
  let alpha = a ? String(a) : '1'
  alpha =
    alpha === '1'
      ? ''
      : ((Number(alpha) * 255) | (1 << 8)).toString(16).slice(1)
  return hex + alpha
}
function firstLetterToUpperCase(txt: string) {
  return txt.charAt(0).toUpperCase() + txt.substring(1)
}
function firstLetterToLowerCase(txt: string) {
  return txt.charAt(0).toLocaleLowerCase() + txt.substring(1)
}

function getLocalSolidStyles(
  type: 'PascalCase' | 'camelCase' | 'snake_case' = 'PascalCase',
  colorConfig: 'hex' | 'rgba' = 'hex'
) {
  let colors: any[] = []
  const paintStyles = figma.getLocalPaintStyles()
  paintStyles.map((paint: PaintStyle) => {
    const currentColor = paint.paints[0]
    if (currentColor.type === 'SOLID') {
      let pushObj = {
        name: paint.name.toLocaleLowerCase(),
        hex: rgbaToHex(
          currentColor.color.r,
          currentColor.color.g,
          currentColor.color.b,
          currentColor.opacity
        ),
        rgba: `rgba(${componentToRGBNumber(
          currentColor.color.r
        )},${componentToRGBNumber(currentColor.color.g)},${componentToRGBNumber(
          currentColor.color.b
        )},${currentColor.opacity})`,
        color: currentColor,
      } as any
      if (paint.name.includes('/')) {
        pushObj.groupName = paint.name
          .replace(/\w+/g, firstLetterToUpperCase)
          .replace(/\s/g, '')
          .split('/')
        if (type === 'camelCase') {
          pushObj.groupName = pushObj.groupName.map((name) => {
            return firstLetterToLowerCase(name)
          })
        } else if (type === 'snake_case') {
          pushObj.groupName = paint.name
            .replace(/\w+/g, firstLetterToLowerCase)
            .replace(/\s/g, '_')
            .split('/')
        }
      }
      colors.push(pushObj)
    }
  })
  let result = colors.reduce((prev, curr) => {
    let groupNames = curr.groupName.map((item) => {
      return item.replaceAll('.', '')
    })
    let groupObject = set(
      {},
      groupNames.join('.'),
      colorConfig === 'rgba' ? curr.rgba : curr.hex
    )
    prev = merge(prev, groupObject)
    return prev
  }, {} as any)

  return result
}

figma.ui.postMessage({
  type: 'colors',
  text: JSON.stringify(getLocalSolidStyles()),
})

figma.ui.onmessage = (msg) => {
  if (msg.type === 'cancel') {
    figma.closePlugin()
  }
  if (msg.type === 'getColors') {
    figma.ui.postMessage({
      type: 'colors',
      text: JSON.stringify(getLocalSolidStyles(msg.wordCase, msg.colorConfig)),
    })
  }
}
