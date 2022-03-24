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
function getLocalTextStyles(type: WordCaseType = 'PascalCase') {
  let textStyles: TextStyle[] = figma.getLocalTextStyles()
  return textStyles
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
        `.replace(/\s/g, ''),
      } as TextCssStyle
      return pushObj
    })
    .reduce((prev, curr) => {
      let groupNames = curr.groupName.map((item) => {
        return item.replace(/\./g, '')
      })
      let groupObject = set({}, groupNames.join('.'), curr.css)
      prev = merge(prev, groupObject)
      return prev
    }, {} as any)
}
function getAllStyles(
  type: WordCaseType = 'PascalCase',
  colorConfig: 'hex' | 'rgba' = 'hex'
) {
  let textStyles = getLocalTextStyles(type)
  let colorStyles = getLocalSolidStyles(type, colorConfig)
  return {
    typography: textStyles,
    colors: colorStyles,
  }
}
function extractLinearGradientColor(
  name: string,
  type: WordCaseType,
  currentColor: GradientPaint
) {
  const gradientTransform = currentColor.gradientTransform
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
  }deg,${gradientStopsToRgba([...currentColor.gradientStops])};`
  let pushObj = {
    name: name.toLocaleLowerCase(),
    gradientStops: currentColor.gradientStops,
    gradientTransform: currentColor.gradientTransform,
    background: bgColor,
    type: currentColor.type,
    groupName: splitWithWordCase(name, '/', type),
  } as any
  return pushObj
}
function extractSolidColor(
  name: string,
  type: WordCaseType,
  currentColor: SolidPaint
) {
  let pushObj = {
    name: name.toLocaleLowerCase(),
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
    groupName: splitWithWordCase(name, '/', type),
  } as any
  return pushObj
}
function extractSolidBackgroundColor(
  name: string,
  type: WordCaseType,
  currentColor: SolidPaint
) {
  let pushObj = {
    name: name.toLocaleLowerCase(),
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
    groupName: splitWithWordCase(name, '/', type),
  } as any
  return pushObj
}

function getBackgroundColor(type: WordCaseType = 'PascalCase') {
  const paintStyles = figma.getLocalPaintStyles()
  // background: linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)),
  const backgroundColors = paintStyles
    .filter(
      (paint) =>
        (paint.paints?.length > 1 &&
          paint.paints.some(
            (color) => color.type === 'SOLID' || color.type.includes('GRADIENT')
          )) ||
        (paint.paints.length === 1 &&
          paint.paints.some((color) => color.type.includes('GRADIENT')))
    )
    .map((paint: PaintStyle) => {
      return paint.paints.map((color) => {
        if (color.type === 'SOLID') {
          return color
          // return extractSolidColor(paint.name, type, color)
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
            type: color.type,
          } as any
          return pushObj
        } else if (color.type === 'GRADIENT_RADIAL') {
          const gradientTransform = color.gradientTransform
          const matrixArray = [
            Math.round(gradientTransform[0][0]),
            Math.round(gradientTransform[0][1]),
            Math.round(gradientTransform[0][2]),
            Math.round(gradientTransform[1][0]),
            Math.round(gradientTransform[1][1]),
            Math.round(gradientTransform[1][2]),
          ] as [number, number, number, number, number, number]
          const decomposedMatrix = decompose_2d_matrix(matrixArray)
          console.log(
            'decomposedMatrix',
            decomposedMatrix,
            color.gradientTransform
          )
          return color
        } else {
          return color
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
        return extractSolidColor(paint.name, type, currentColor)
      }
    })
    .filter((ii) => ii)
    .reduce((prev, curr) => {
      let groupNames = curr.groupName.map((item) => {
        return item.replace(/\./g, '')
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
  text: JSON.stringify(getAllStyles()),
})

figma.ui.onmessage = (msg) => {
  if (msg.type === 'cancel') {
    figma.closePlugin()
  }
  if (msg.type === 'getColors') {
    figma.ui.postMessage({
      type: 'colors',
      text: JSON.stringify(getAllStyles(msg.wordCase, msg.colorConfig)),
    })
  }
}
