import { merge, set } from 'lodash'
import {
  componentToRGBNumber,
  gradientStopsToRgba,
  rgbaToHex,
} from './colorFormat'
import { decompose_2d_matrix } from './decompose'
import { splitWithWordCase, WordCaseType } from './wordFormat'

figma.showUI(__html__, { width: 480, height: 480 })

interface TextCssStyle {
  name: string
  groupName: string[]
  css: string
}
const FontStyle = {
  thin: 100,
  extrathin: 200,
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
} as const
function getLocalTextStyles(type: WordCaseType = 'camelCase') {
  let textStyles: TextStyle[] = figma.getLocalTextStyles()
  let result = textStyles
    .filter((text: TextStyle) => text.type === 'TEXT')
    .map((text: TextStyle) => {
      let fontWeight =
        FontStyle[
          text.fontName.style
            .replace(/\s/g, '')
            .toLocaleLowerCase() as keyof typeof FontStyle
        ] && 400

      let pushObj = {
        name: text.name,
        groupName: splitWithWordCase(text.name, '/', type),
        css: `
          font-size: ${text.fontSize};
          font-style: ${text.fontName.style};
          font-weight: ${fontWeight};
          letter-spacing: ${
            text.letterSpacing.unit === 'PERCENT'
              ? text.letterSpacing.value + '%'
              : text.letterSpacing.value + 'px'
          };
          line-height: ${
            text.lineHeight.unit === 'AUTO'
              ? 'auto'
              : text.lineHeight.unit === 'PERCENT'
              ? text.lineHeight.value + '%'
              : text.lineHeight.value + 'px'
          };
        `,
      } as TextCssStyle
      console.log('pushObj', pushObj)
      return pushObj
    })
}
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
