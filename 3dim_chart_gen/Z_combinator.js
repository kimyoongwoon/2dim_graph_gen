
function getCombinations(arr, selectNum) {
    const result = [];
    if (selectNum === 1) return arr.map((v) => [v]);
    arr.forEach((fixed, idx, origin) => {
        const rest = origin.slice(idx + 1);
        const combinations = getCombinations(rest, selectNum - 1);
        const attached = combinations.map((comb) => [fixed, ...comb]);
        result.push(...attached);
    });
    return result;
}

function generate3DGraphCombinations(dimensions) {
    const tDim = dimensions.find(d => d === 't');
    const mDims = dimensions.filter(d => d.startsWith('m'));
    const pDims = dimensions.filter(d => d.startsWith('p'));

    const result = [];

    pDims.forEach(p => {
        mDims.forEach(m => {
            result.push({ x: tDim, y: p, z: m });
        });
    });
    getCombinations(mDims, 2).forEach(([m1, m2]) => {
        result.push({ x: tDim, y: m1, z: m2 });
    });
    getCombinations(pDims, 2).forEach(([p1, p2]) => {
        mDims.forEach(m => {
            result.push({ x: p1, y: p2, z: m });
        });
    });
    pDims.forEach(p => {
        getCombinations(mDims, 2).forEach(([m1, m2]) => {
            result.push({ x: p, y: m1, z: m2 });
        });
    });
    getCombinations(mDims, 3).forEach(([m1, m2, m3]) => {
        result.push({ x: m1, y: m2, z: m3 });
    });

    return result;
}