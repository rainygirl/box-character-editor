(() => {
    let mode = {
        draw: false,
        lineType: 0,
        previous: {
            'keydown': {},
            'keyup': {}
        },
        previousStart: 0,
    };

    const $ = function(target) {
            return document.getElementById(target)
        },
        maxColumn = 76,
        maxRow = 25,
        allLineChar = ['─│┌┐┘└├┬┤┴┼', '━┃┏┓┛┗┣┳┫┻╋'],
        prevConnectedIndex = [0, 2, 5, 6, 7, 9, 10],
        nextConnectedIndex = [0, 3, 4, 7, 8, 9, 10],
        prevLineConnectedIndex = [1, 2, 3, 6, 7, 8, 10],
        nextLineConnectedIndex = [1, 4, 5, 6, 8, 9, 10];

    let lineChar,
        prevLineConnectedChar,
        nextLineConnectedChar,
        prevConnectedChar,
        nextConnectedChar,
        isMouseDown = false,
        row = 0,
        column = 0;

    const textarea = document.getElementById('textarea'),
        initLine = (index) => {
            mode.lineType = index;
            lineChar = allLineChar[index];
            prevLineConnectedChar = prevLineConnectedIndex.map(d => lineChar[d]);
            nextLineConnectedChar = nextLineConnectedIndex.map(d => lineChar[d]);
            prevConnectedChar = prevConnectedIndex.map(d => lineChar[d]);
            nextConnectedChar = nextConnectedIndex.map(d => lineChar[d]);

            index === 1 ? $('mode_line').classList.add('b') : $('mode_line').classList.remove('b');
        },
        length2bytes = (d) => {
            return d.split('').map((d) => {
                return isDoubleChar(d) ? 2 : 1
            }).reduce((p, a) => p + a, 0);
        },
        initDraw = (isDraw) => {
            mode.draw = isDraw;
            isDraw ? $('mode_draw').classList.add('b') : $('mode_draw').classList.remove('b');
            isDraw ? initLine(0) : $('mode_line').classList.remove('b');

            mode.previous = {
                    'keydown': {},
                    'keyup': {}
                },
                mode.previousStart = 0;
            isMouseDown = false;

            const splitV = textarea.value.split('\n');
            let v;
            if (mode.draw) {
                v = splitV.map((d) => {
                    const realLength = length2bytes(d)

                    if (realLength > maxColumn) {
                        const pickle = d.split('');
                        let sliced = [];
                        pickle.reduce((p, d, i, arr) => {
                            sliced.push(d);

                            if (i == pickle.length - 1) {
                                arr.splice(1);
                                return sliced;
                            }
                            if (p >= maxColumn + (isDoubleChar(d) ? 0 : 1)) {
                                p = 0;
                                sliced.push('\n');
                            }
                            return p + (isDoubleChar(d) ? 2 : 1);
                        }, 0);
                        sliced = sliced.join('')
                        const lastLength = sliced.split('\n').at(-1).split('').map((d) => {
                            return isDoubleChar(d) ? 2 : 1
                        }).reduce((p, a) => p + a, 0);
                        return sliced + (lastLength < maxColumn ? (' '.repeat(maxColumn - lastLength)) : '');
                    }
                    return d + (realLength < maxColumn ? (' '.repeat(maxColumn - realLength)) : '');
                });

                if (v.length < 50)
                    for (let i = 50 - v.length; i > 0; i--) v.push(' '.repeat(76));
                textarea.value = v.join('\n');
            } else {
                v = splitV.map((d) => d.replace(/\s+$/, ""));
                textarea.value = v.join('\n').replace(/\s+$/, "");
            }
            let newss = (row > 1 ? v.slice(0, row - 1).join('\n').length : -1) + column;
            if (newss < 0) newss = 0;

            textarea.selectionStart = newss;
            textarea.selectionEnd = newss;
        },
        isArrowKey = (e) => {
            return e.key.indexOf('Arrow') === 0;
        },
        isDoubleChar = (s) => {
            return s.charCodeAt() > 255;
        },
        toggle = (target) => {
            switch (target) {
                case 'line':
                    mode.draw && initLine(mode.lineType === 0 ? 1 : 0);
                    break;
                case 'draw':
                    initDraw(!mode.draw);
                    break;
            }
        },
        altKeyHandler = (e) => {
            return metaKeyHandler(e);
        },
        metaKeyHandler = (e) => {
            switch (e.key) {
                case 's':
                    event.preventDefault();
                    if (e.type !== 'keydown') return;
                    mode.draw && toggle('draw');
                    textarea.select();
                    document.execCommand('copy');
                    alert('클립보드에 복사되었습니다');
                    textarea.blur();
                    break;
                case 'd':
                    event.preventDefault();
                    if (e.type !== 'keydown') return;
                    toggle('draw');
                    break;
                case 'b':
                    event.preventDefault();
                    if (e.type !== 'keydown') return;
                    toggle('line');
                    break;
            }
        },
        moveCaret = (e, s) => {
            e.target.selectionStart = s;
            e.target.selectionEnd = s + 1;
            e.target.setSelectionRange(e.target.selectionStart, e.target.selectionEnd, "forward")
        },
        keyHandler = (e) => {
            if (e.metaKey) {
                metaKeyHandler(e);

                return;
            } else if (e.altKey) {
                altKeyHandler(e);
                return;
            }
            const v = e.target.value;
            if (v === undefined) return;

            let ss = e.target.selectionStart,
                se = e.target.seletionEnd || ss;

            row = v.substring(0, ss).split('\n').length;

            const splitV = v.split('\n'),
                previousLinesValue = splitV.slice(0, row - 1).join('\n');

            column = ss - previousLinesValue.length + (row == 1 ? 1 : 0);

            let realColumn = splitV.slice(row - 1, row)[0].substring(0, column - 1).split('').map((d) => {
                return isDoubleChar(d) ? 2 : 1
            }).reduce((p, a) => p + a, 0);

            $('row').innerText = row;
            $('column').innerText = (realColumn + 1);

            if (mode.draw) {

                const getSameColumnChar = (rowOffset, colOffset = 0) => {
                        if (row + rowOffset < 1) return;
                        if (row + rowOffset > splitV.length) return;
                        return splitV.slice(row + rowOffset - 1, row + rowOffset)[0].split('').reduce((p, d, i, arr) => {
                            if (realColumn + colOffset === p) {
                                arr.splice(1);
                                return d;
                            }
                            return p + (isDoubleChar(d) ? 2 : 1);
                        }, 0)
                    },
                    changeLine = (sliceOffset, insertString) => {
                        e.target.value = e.target.value.substring(0, ss + sliceOffset[0]) + insertString + e.target.value.substring(ss + sliceOffset[1], v.length);
                    }

                const prevChar = e.target.value.substring(ss - 1, ss), // 커서 기준 앞 글자
                    prev2Char = e.target.value.substring(ss - 2, ss - 1), // 커서 기준 앞앞 글자
                    prevLineChar = getSameColumnChar(-1),
                    nextLineChar = getSameColumnChar(1),
                    prevLinePrevChar = getSameColumnChar(-1, -2),
                    nextLinePrevChar = getSameColumnChar(1, -2),
                    isPrevLineConnected = prevLineConnectedChar.includes(prevLineChar),
                    isNextLineConnected = nextLineConnectedChar.includes(nextLineChar),
                    isBothLineConnected = isPrevLineConnected && isNextLineConnected;

                let nextChar = e.target.value.substring(ss, ss + 1), // 커서 기준 뒤 글자
                    next2Char = e.target.value.substring(ss + 1, ss + 2), // 커서 기준 뒤뒤 글자
                    isPrevConnected = prevConnectedChar.includes(prevChar);

                if (e.type === 'keydown') {

                    switch (e.key) {
                        case 'Escape':
                            toggle('draw');
                            break;
                        case 'ArrowLeft':
                            if (realColumn < 2) {
                                e.preventDefault();
                                return;
                            }
                            (() => {
                                let insertString = lineChar[0],
                                    sliceOffset = [-1, isDoubleChar(nextChar) ? 1 : 2],
                                    move = 0;

                                const isPrev2Connected = prevConnectedChar.includes(prev2Char),
                                    isNext2Connected = nextConnectedChar.includes(next2Char),
                                    isPrevLinePrevConnected = prevLineConnectedChar.includes(prevLinePrevChar),
                                    isNextLinePrevConnected = nextLineConnectedChar.includes(nextLinePrevChar),
                                    isBothLinePrevConnected = isPrevLinePrevConnected && isNextLinePrevConnected;

                                if (isPrev2Connected)
                                    insertString = lineChar[isBothLinePrevConnected ? 10 : (isPrevLinePrevConnected ? 9 : (isNextLinePrevConnected ? 7 : 0))]
                                else
                                    insertString = lineChar[isBothLinePrevConnected ? 6 : (isPrevLinePrevConnected ? 5 : (isNextLinePrevConnected ? 2 : 0))]

                                if (isNext2Connected)
                                    insertString += lineChar[isBothLineConnected ? 10 : (isPrevLineConnected ? 9 : (isNextLineConnected ? 7 : 0))]
                                else
                                    insertString += lineChar[isBothLineConnected ? 8 : (isPrevLineConnected ? 4 : (isNextLineConnected ? 3 : 0))]

                                if (!isDoubleChar(prevChar)) {
                                    sliceOffset[0] -= 1;
                                    move = -1;
                                    if (isDoubleChar(prev2Char)) {
                                        move = 0;
                                        insertString = ' ' + insertString;
                                    }
                                }

                                changeLine(sliceOffset, insertString);
                                ss += move - 1;
                                moveCaret(e, ss);
                            })();
                            break;
                        case 'ArrowRight':
                            if (realColumn >= maxColumn - 1) {
                                e.preventDefault();
                                return;
                            }
                            (() => {
                                let insertString = lineChar[0],
                                    sliceOffset = [0, 4];

                                const prevLineNext2Char = getSameColumnChar(-1, 2),
                                    nextLineNext2Char = getSameColumnChar(1, 2),
                                    next3Char = e.target.value.substring(ss + 2, ss + 3),
                                    isPrevLineNext2Connected = prevLineConnectedChar.includes(prevLineNext2Char),
                                    isNextLineNext2Connected = nextLineConnectedChar.includes(nextLineNext2Char),
                                    isBothLineNext2Connected = isPrevLineNext2Connected && isNextLineNext2Connected,
                                    isNext3Connected = nextConnectedChar.includes(next3Char);

                                if (isPrevConnected)
                                    insertString = lineChar[isBothLineConnected ? 10 : (isPrevLineConnected ? 9 : (isNextLineConnected ? 7 : 0))]
                                else
                                    insertString = lineChar[isBothLineConnected ? 6 : (isPrevLineConnected ? 5 : (isNextLineConnected ? 2 : 0))]

                                if (isNext3Connected)
                                    insertString += lineChar[isBothLineNext2Connected ? 10 : (isPrevLineNext2Connected ? 9 : (isNextLineNext2Connected ? 7 : 0))]
                                else
                                    insertString += lineChar[isBothLineNext2Connected ? 8 : (isPrevLineNext2Connected ? 4 : (isNextLineNext2Connected ? 3 : 0))]

                                if (isDoubleChar(nextChar)) sliceOffset[1] -= 1;

                                if (isDoubleChar(next2Char)) sliceOffset[1] -= 1;

                                if ((!isDoubleChar(nextChar) && isDoubleChar(next2Char)) || (!isDoubleChar(next2Char) && isDoubleChar(next3Char)))
                                    insertString += ' ';

                                changeLine(sliceOffset, insertString);
                                moveCaret(e, ss)

                            })();
                            break;
                        case 'ArrowUp':
                            if (row === 1) {
                                e.preventDefault();
                                return;
                            }
                        case 'ArrowDown':
                            if (e.key === 'ArrowDown' && row >= maxRow) {
                                e.preventDefault();
                                return;
                            }
                            (() => {

                                const previousKey = mode.previous[e.type].key,
                                    isPushedBack = mode.previous['keydown'].realColumn - realColumn === 1;

                                if ((['ArrowUp', 'ArrowDown'].includes(previousKey) && isPushedBack) ||
                                    (!isDoubleChar(nextChar) && isDoubleChar(next2Char))) {

                                    const clearChar = ' '.repeat(isPushedBack && isDoubleChar(next2Char) ? 4 : 3);

                                    changeLine([0, 2], clearChar);
                                    if (isPushedBack) {
                                        ss += 1;
                                        realColumn += 1;
                                    }
                                    nextChar = ' ';
                                    next2Char = ' ';
                                    isPrevConnected = false;
                                }

                                let sliceOffset = [0, isDoubleChar(nextChar) ? 1 : 2],
                                    insertString = lineChar[1];

                                const isNext2Connected = nextConnectedChar.includes(next2Char),
                                    isNextConnected = nextConnectedChar.includes(nextChar);

                                if (isPrevConnected && isNext2Connected) {
                                    if ((isPrevLineConnected && isNextLineConnected) || (isPrevLineConnected && e.key === 'ArrowDown') || (isNextLineConnected && e.key === 'ArrowUp'))
                                        insertString = lineChar[10];
                                    else
                                        insertString = lineChar[{
                                            'ArrowUp': 9,
                                            'ArrowDown': 7
                                        } [e.key]];
                                } else if (isPrevConnected)
                                    insertString = lineChar[{
                                        'ArrowDown': isPrevLineConnected ? 8 : 3,
                                        'ArrowUp': isNextLineConnected ? 8 : 4
                                    } [e.key]];
                                else if (isNext2Connected)
                                    insertString = lineChar[{
                                        'ArrowDown': isPrevLineConnected ? 6 : 2,
                                        'ArrowUp': isNextLineConnected ? 6 : 5
                                    } [e.key]];


                                if (!isDoubleChar(nextChar) && isDoubleChar(next2Char)) {
                                    sliceOffset[1] -= 1;
                                    insertString += ' ';
                                }
                                changeLine(sliceOffset, insertString);
                                moveCaret(e, ss);
                            })();
                            break;
                        default:
                            e.preventDefault();
                            break;
                    }

                } else if (e.type === 'keyup') {
                    switch (e.key) {
                        case 'ArrowUp':
                        case 'ArrowDown':

                            (() => {
                                let move = 0,
                                    clearChar = '',
                                    sliceOffset = [0, 0];
                                if (mode.previous['keydown'].realColumn - realColumn === 1 && isDoubleChar(nextChar)) {
                                    move = 1;
                                    sliceOffset = [0, 2];

                                    clearChar = ' ' + lineChar[1] + (isDoubleChar(next2Char) ? ' ' : '');

                                } else {
                                    if (lineChar.split('').includes(nextChar)) {
                                        sliceOffset = [0, 1];
                                        const isNext2Connected = nextConnectedChar.includes(next2Char),
                                            isNextConnected = nextConnectedChar.includes(nextChar);

                                        if (isPrevConnected && isNext2Connected) {
                                            if (isBothLineConnected)
                                                clearChar = lineChar[10];
                                            else if (isPrevLineConnected)
                                                clearChar = lineChar[isBothLineConnected ? 10 : 9];
                                            else if (isNextLineConnected)
                                                clearChar = lineChar[isBothLineConnected ? 10 : 7];
                                            else
                                                clearChar = lineChar[0];
                                        } else if (isPrevConnected)
                                            clearChar = lineChar[isBothLineConnected ? 8 : (isPrevLineConnected ? 4 : 3)];
                                        else if (isNext2Connected)
                                            clearChar = lineChar[isBothLineConnected ? 6 : (isPrevLineConnected ? 5 : 2)];
                                        else if (isNextConnected)
                                            clearChar = nextChar;

                                    } else {
                                        sliceOffset = [0, isDoubleChar(nextChar) ? 1 : 2];
                                        clearChar = lineChar[1]
                                    }

                                    if (!isDoubleChar(nextChar) && isDoubleChar(next2Char))
                                        clearChar += ' ';
                                }

                                if (clearChar !== '')
                                    changeLine(sliceOffset, clearChar);

                                ss += move;
                                moveCaret(e, ss);
                            })();

                            break;
                        case 'ArrowRight':
                        case 'ArrowLeft':
                            moveCaret(e, ss);
                            break;
                    }
                }

                if (isArrowKey(e)) {
                    mode.previous[e.type] = {
                        row: row,
                        column: column,
                        realColumn: realColumn,
                        key: e.key,
                        ss: ss
                    };
                    mode.previousStart = ss;
                }
            }
        }

    initLine(0);

    document.addEventListener('keyup', keyHandler);
    document.addEventListener('keydown', keyHandler);
    textarea.addEventListener('blur', (e) => {
        if (mode.draw) toggle('draw');
    });
    textarea.addEventListener('mousedown', (e) => {
        if (!mode.draw) return;
        if (isMouseDown) e.preventDefault();
        isMouseDown = true;
    });

})();