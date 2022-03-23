import { merge, set } from 'lodash'
import {
  componentToRGBNumber,
  gradientStopsToRgba,
  rgbaToHex,
} from './colorFormat'
import { decompose_2d_matrix } from './decompose'
import {
  disposeWhiteSpace,
  splitWithWordCase,
  WordCaseType,
} from './wordFormat'

figma.showUI(__html__, { width: 480, height: 480 })

function getLocalTextStyles(type: WordCaseType = 'camelCase') {
  let textStyles: TextStyle[] = figma.getLocalTextStyles()
  textStyles = textStyles.filter((text: TextStyle) => text.type === 'TEXT')
  const nameCase = disposeWhiteSpace(textStyles[0].name, type)
  console.log('nameCase', nameCase, textStyles[0], type)
}
let matrix = [
  [1, -2.0164275582601476e-8, 9.337079553972671e-9],
  [1.4901162970204496e-8, 0.30708909034729004, 0.3464554250240326],
  [0, 0, 1],
]
getLocalTextStyles()

function getBackgroundColor(
  type: WordCaseType = 'PascalCase',
  colorConfig: 'hex' | 'rgba' = 'hex'
) {
  const paintStyles = figma.getLocalPaintStyles()

  const backgroundColors = paintStyles
    .filter(
      (paint) =>
        (paint.paints?.length > 1 &&
          paint.paints.some(
            (color) =>
              color.type === 'SOLID' || color.type === 'GRADIENT_LINEAR'
          )) ||
        (paint.paints.length === 1 &&
          paint.paints.some((color) => color.type === 'GRADIENT_LINEAR'))
    )
    .map((paint: PaintStyle) => {
      return paint.paints.map((color) => {
        if (color.type === 'SOLID') {
        } else if (color.type === 'GRADIENT_LINEAR') {
          const gradientTransform = color.gradientTransform
          const matrixArray = [
            gradientTransform[0][0],
            gradientTransform[0][1],
            gradientTransform[0][2],
            gradientTransform[1][0],
            gradientTransform[1][1],
            gradientTransform[1][2],
          ] as [number, number, number, number, number, number]
          const decomposedMatrix = decompose_2d_matrix(matrixArray)
          const bgColor = `linear-gradient(${
            decomposedMatrix.deg
          }deg,${gradientStopsToRgba([...color.gradientStops])};`
          let pushObj = {
            name: paint.name.toLocaleLowerCase(),
            gradientStops: color.gradientStops,
            gradientTransform: color.gradientTransform,
            background: bgColor,
          } as any
          return pushObj
        }
      })
    })
    .filter((ii) => !!ii)
  console.log('backgroundColors', backgroundColors)
}
// background: linear-gradient(295.36deg, rgba(0, 0, 0, 0.4) 15.47%, rgba(5, 0, 255, 0) 59.09%, rgba(250, 199, 208, 0.65) 79.44%);

getBackgroundColor()
function getLocalSolidStyles(
  type: WordCaseType = 'PascalCase',
  colorConfig: 'hex' | 'rgba' = 'hex'
) {
  const paintStyles = figma.getLocalPaintStyles()

  return paintStyles
    .filter(
      (paint) => paint.paints?.length === 1 && paint.paints[0].type === 'SOLID'
    )
    .map((paint: PaintStyle) => {
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
          )},${componentToRGBNumber(
            currentColor.color.g
          )},${componentToRGBNumber(currentColor.color.b)},${
            currentColor.opacity
          })`,
          color: currentColor,
        } as any
        pushObj.groupName = splitWithWordCase(paint.name, '/', type)
        return pushObj
      }
    })
    .filter((ii) => ii)
    .reduce((prev, curr) => {
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
