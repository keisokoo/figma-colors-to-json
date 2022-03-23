export type WordCaseType = 'PascalCase' | 'camelCase' | 'snake_case'
export function firstLetterToUpperCase(txt: string) {
  return txt.charAt(0).toUpperCase() + txt.substring(1)
}
export function firstLetterToLowerCase(txt: string) {
  return txt.charAt(0).toLocaleLowerCase() + txt.substring(1)
}
export function WhiteSpaceToPascalCase(text: string) {
  return text.replace(/\w+/g, firstLetterToUpperCase).replace(/\s/g, '')
}
export function whiteSpaceToCamelCase(text: string) {
  return firstLetterToLowerCase(
    text.replace(/\w+/g, firstLetterToUpperCase).replace(/\s/g, '')
  )
}
export function white_space_to_snake_case(text: string) {
  return text.replace(/\w+/g, firstLetterToLowerCase).replace(/\s/g, '_')
}
const handleWhiteSpaceWordCase = new Map<
  WordCaseType,
  (text: string) => string
>([
  ['PascalCase', WhiteSpaceToPascalCase],
  ['camelCase', whiteSpaceToCamelCase],
  ['snake_case', white_space_to_snake_case],
])
export function splitWithWordCase(
  text: string,
  splitWord: string,
  type: WordCaseType
): string[] {
  if (!text.includes(splitWord))
    return [handleWhiteSpaceWordCase.get(type)(text)]
  return text
    .split(splitWord)
    .map((text) => handleWhiteSpaceWordCase.get(type)(text))
}
export function disposeWhiteSpace(text: string, type: WordCaseType) {
  return handleWhiteSpaceWordCase.get(type)(text)
}
