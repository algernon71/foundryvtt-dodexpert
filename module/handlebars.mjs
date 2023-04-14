
/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function () {
    var outStr = '';
    for (var arg in arguments) {
        if (typeof arguments[arg] != 'object') {
            outStr += arguments[arg];
        }
    }
    return outStr;
});

Handlebars.registerHelper('ifeq', function (a, b, options) {
    if (a == b) { return options.fn(this); }
    return options.inverse(this);
});

function objectSize(o) {
    if (o instanceof Array) {
        return o.length;
    }
    return Object.keys(o).length;
}

function remainingElements(size, offset) {
    if (!offset) {
        return size;
    }

    if (offset <= size) {
        return size - offset;
    }

    return 0;

}
function calcPadCount(size, count, offset) {
    const remainingCount = remainingElements(size, offset);
    if (remainingCount <= count) {
        return count - remainingCount;
    }

    return 0;

}

function pageFill(list, count, offset, options) {
    const size = objectSize(list);

    const padCount = calcPadCount(size, count, offset);
    let buf = '';
    for (let i = 0; i < padCount; ++i) {
        buf += options.fn(this);
    }
    return buf;
}


Handlebars.registerHelper('pagefill', function (list, count, offset, options) {
    return pageFill(list, count, offset, options);
});

Handlebars.registerHelper('includeListItem', function (i, offset, max, options) {

    if (i >= offset && i < (offset + max)) {
        return options.fn(this);
    }
    return '';
});

Handlebars.registerHelper('padlist', function (list, count, options) {
    return pageFill(list, count, 0, options);
});

Handlebars.registerHelper('times', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i) {
        block.data.index = i;
        block.data.first = i === 0;
        block.data.last = i === (n - 1);
        accum += block.fn(this);
    }
    return accum;
});

Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});

Handlebars.registerHelper('crossboxes', function (stat, max, current, total, options) {
    let buf = '';
    for (let i = 0; i < total; ++i) {
        if (i < max) {
            if (i < (max - current)) {
                buf += '<input type="checkbox" checked class="increase-' + stat + '">';
            } else {
                buf += '<input type="checkbox" class="deduct-' + stat + '">';

            }
        } else {
            buf += '<input type="checkbox" disabled>';

        }
    }
    return buf;
});