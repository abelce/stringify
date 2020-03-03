function stringify(data, replacer = null, space = '') {
    const toString = Object.prototype.toString;
    const types = {
        '[object String]': 'string',
        '[object Number]': 'number',
        '[object Undefined]': 'undefined',
        '[object Null]': 'null',
        '[object Function]': 'function',
        '[object Array]': 'array',
        '[object Boolean]': 'bool',
        '[object Symbol]': 'symbol',
        '[object BigInt]': 'bigInt',
        '[object Object]': 'object',
        '[object RegExp]': 'regexp',
        '[object Date]': 'date',
        '[object Set]': 'set',
        '[object Map]': 'map',
    };

    /**
     * 
     * @param {*} data 
     * 获取数据类型
     */
    const getType = data => {
        return types[toString.call(data)];
    }

    /**
     * 
     * @param {*} key 
     * @param {*} value 
     * 
     * 处理stringify的replacer
     * 如果是函数，直接调用函数，
     * 如果是数组：没有key时或者包含key时返回数据本身，否者返回undefined;
     */
    const replacerCallback = function (key = '', value) {
        let type = getType(replacer);
        switch (type) {
            case 'function':
                return replacer(key, value);
            case 'array':
                return ('' === key || replacer.includes(key)) ?
                    value :
                    undefined;
            default:
                return value;
        }
    }

    /**
     * 获取填充字符串
     */
    const getSpaceStr = function () {
        if (getType(space) === 'number') {
            return Array(space).fill(' ').join('');
        }
        if (getType(space) === 'string') {
            return space;
        }
        return '';
    }
    // 初始化填充字符串;
    const spaceStr = getSpaceStr();
    const needBeautify = spaceStr.length > 0 ? true : false;
    // 获取填充的字符串
    const getPadStr = (level) => "\n" + Array(level).fill(spaceStr).join('');
    // 格式化字符串
    const formatResult = function (data, level = 0) {
        if (!needBeautify || 0 === level) {
            return data;
        }
        return getPadStr(level) + data;
    }

    /**
     * 
     * @param {*} data 
     * @param {*} level 
     * 格式化对象
     */
    const formatObject = function (data, level = 0) {
        if (data.length === 0) {
            return formatResult('{}', level);
        }
        return formatResult('{', level) +
            data.map(item => formatResult(item, level + 1))
            + ((needBeautify && level === 0) ? "\n" : '') + 
            formatResult('}', level);
    }

    /**
     * 
     * @param {*} data : 数据本身
     * @param {*} level: 数据所在的嵌套层数 
     * 格式化数组
     */
    const formArray = function(data, level = 0) {
        if (data.length === 0) {
            return formatResult('[]', level);
        }
        const res = ('['
        +  data.map(item => formatResult(item, level + 1))
        + ((needBeautify && level === 0) ? "\n" : '') + 
        formatResult(']', level));
        
        const reg = new RegExp(getPadStr(level + 1) + getPadStr(level + 1), 'g');
        const newStr = getPadStr(level + 1);
        return res.replace(reg, newStr);
    }

    /**
     * 
     * @param {*} key : 数据的键
     * @param {*} origin ： 数据的值
     * @param {*} level ： 数据在原始数据中的嵌套层数
     */
    const translate = function (key, origin, level) {
        let data = replacerCallback(key, origin);
        switch (getType(data)) {
            case 'bool':
                return `${data}`;
            case 'string':
                return `"${data}"`;
            case 'number':
                if (data == Infinity || isNaN(data)) {
                    return 'null';
                }
                return `${data}`;
            case 'undefined':
            case 'function':
            case 'symbol':
                return 'undefined';
            case 'null':
                return 'null';
            case 'bigInt':
                throw new TypeError('BigInt can not seriallied');
            case 'array':
                const result = data.map((item, index) => {
                    let res = translate('', item, level + 1);
                    switch (res) {
                        case 'undefined':
                            return 'null';
                        default:
                            return res;
                    }
                });
                return formArray(result, level);
            default:
                if ('toJSON' in data) {
                    return data.toJSON();
                }
                let res = [];
                for (let [key, value] of Object.entries(data)) {
                    if ('symbol' === getType(key)) {
                        continue;
                    }
                    let tmp = translate(key, value, level + 1);
                    if ('undefined' === tmp) {
                        continue;
                    }
                    // 对象需要格式化是，value前面有一个空格
                    res.push(`"${key}":${needBeautify ? ' ' : ''}${tmp}`);
                }
                return formatObject(res, level);
        }
    }
    return translate('', data, 0);
}
const data = {
    a: 2,
    b: {
        y: 'y',
    },
    c: Symbol('foo'),
    [Symbol.for('foo')]: 'd',
    e: function(){},
    x: [
        {
            y: 'y',
            a: '3'
        },
        {
            p: 'p',
            q: 'q',
        },
        undefined,
        null,
        NaN,
        "foo",
        new Set([1]),
        new WeakSet(),
        new Map([{a: 1}]),
        new WeakMap([[{a:1}, 2]]),
        function(){},
    ],
};
const replacer = function (key, value) {
    if (typeof value === 'number') {
        return 2 * value;
    }
    return value;
}

console.log(stringify(data));
console.log(JSON.stringify(data));
console.log(stringify(data, replacer));
console.log(JSON.stringify(data, replacer));
console.log(stringify(data, ['a', 'x']));
console.log(JSON.stringify(data, ['a', 'x']));
console.log(stringify(data, ['a', 'x'], '--'));
console.log(JSON.stringify(data, ['a', 'x'], '--'));