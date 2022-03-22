figma.showUI(__html__);
function componentToRGBNumber(c) {
    return Math.round(c * 255);
}
function componentToHex(c) {
    var hex = (componentToRGBNumber(c) | (1 << 8)).toString(16).slice(1);
    return hex.length == 1 ? '0' + hex : hex;
}
function rgbaToHex(r, g, b, a) {
    let hex = '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
    let alpha = a ? String(a) : '1';
    alpha =
        alpha === '1'
            ? ''
            : ((Number(alpha) * 255) | (1 << 8)).toString(16).slice(1);
    return hex + alpha;
}
const paintStyles = figma.getLocalPaintStyles();
let colors = [];
paintStyles.map((paint) => {
    const currentColor = paint.paints[0];
    if (currentColor.type === 'SOLID') {
        const name = paint.name.toLocaleLowerCase().replace(/\s/g, '');
        let pushObj = {
            name: paint.name.toLocaleLowerCase(),
            hex: rgbaToHex(currentColor.color.r, currentColor.color.g, currentColor.color.b, currentColor.opacity),
            rgba: `rgba(${componentToRGBNumber(currentColor.color.r)},${componentToRGBNumber(currentColor.color.g)},${componentToRGBNumber(currentColor.color.b)},${currentColor.opacity})`,
            color: currentColor,
        };
        if (name.includes('/')) {
            pushObj.groupName = paint.name
                .toLocaleLowerCase()
                .replace(/\s/g, '')
                .split('/');
        }
        colors.push(pushObj);
    }
});
figma.ui.postMessage({ type: 'colors', text: JSON.stringify(colors) });
figma.ui.onmessage = (msg) => {
    figma.closePlugin();
};
