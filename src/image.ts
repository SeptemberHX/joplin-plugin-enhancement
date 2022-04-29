// code mainly comes from https://github.com/markdown-it/markdown-it/blob/master/lib/rules_inline/image.js
// Process ![image](<src> "title")

'use strict';

let normalizeReference = require('./utils').normalizeReference;
let isSpace = require('./utils').isSpace;


export default function (context) {
    return {
        plugin: function image_with_size(md, options) {
            const pluginId = context.pluginId;

            function image(state, silent) {
                var attrs,
                    code,
                    content,
                    label,
                    labelEnd,
                    labelStart,
                    pos,
                    ref,
                    res,
                    title,
                    token,
                    tokens,
                    start,
                    href = '',
                    oldPos = state.pos,
                    max = state.posMax;

                if (state.src.charCodeAt(state.pos) !== 0x21/* ! */) {
                    return false;
                }
                if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) {
                    return false;
                }

                labelStart = state.pos + 2;
                labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);

                // parser failed to find ']', so it's not a valid link
                if (labelEnd < 0) {
                    return false;
                }

                pos = labelEnd + 1;
                if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
                    //
                    // Inline link
                    //

                    // [link](  <href>  "title"  )
                    //        ^^ skipping these spaces
                    pos++;
                    for (; pos < max; pos++) {
                        code = state.src.charCodeAt(pos);
                        if (!isSpace(code) && code !== 0x0A) {
                            break;
                        }
                    }
                    if (pos >= max) {
                        return false;
                    }

                    // [link](  <href>  "title"  )
                    //          ^^^^^^ parsing link destination
                    start = pos;
                    res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
                    if (res.ok) {
                        href = state.md.normalizeLink(res.str);
                        if (state.md.validateLink(href)) {
                            pos = res.pos;
                        } else {
                            href = '';
                        }
                    }

                    // [link](  <href>  "title"  )
                    //                ^^ skipping these spaces
                    start = pos;
                    for (; pos < max; pos++) {
                        code = state.src.charCodeAt(pos);
                        if (!isSpace(code) && code !== 0x0A) {
                            break;
                        }
                    }

                    // [link](  <href>  "title"  )
                    //                  ^^^^^^^ parsing link title
                    res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
                    if (pos < max && start !== pos && res.ok) {
                        title = res.str;
                        pos = res.pos;

                        // [link](  <href>  "title"  )
                        //                         ^^ skipping these spaces
                        for (; pos < max; pos++) {
                            code = state.src.charCodeAt(pos);
                            if (!isSpace(code) && code !== 0x0A) {
                                break;
                            }
                        }
                    } else {
                        title = '';
                    }

                    if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
                        state.pos = oldPos;
                        return false;
                    }
                    pos++;
                } else {
                    //
                    // Link reference
                    //
                    if (typeof state.env.references === 'undefined') {
                        return false;
                    }

                    if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
                        start = pos + 1;
                        pos = state.md.helpers.parseLinkLabel(state, pos);
                        if (pos >= 0) {
                            label = state.src.slice(start, pos++);
                        } else {
                            pos = labelEnd + 1;
                        }
                    } else {
                        pos = labelEnd + 1;
                    }

                    // covers label === '' and label === undefined
                    // (collapsed reference link and shortcut reference link respectively)
                    if (!label) {
                        label = state.src.slice(labelStart, labelEnd);
                    }

                    ref = state.env.references[normalizeReference(label)];
                    if (!ref) {
                        state.pos = oldPos;
                        return false;
                    }
                    href = ref.href;
                    title = ref.title;
                }

                // ---------------------- width and height parsing starts -----------------------
                var width,
                    height;

                if (pos < max && state.src.charCodeAt(pos) === 0x7B/* { */) {
                    // [link](  <href>  "title"  ){  width=[width]  ,  height=[height]  }
                    //                                                                  ^ trying to get its pos
                    let sizeStrPos = ++pos;
                    for (; pos < max; pos++) {
                        code = state.src.charCodeAt(pos);
                        if (code == 0x7D/* } */) {
                            break;
                        }
                    }
                    if (pos >= max) {
                        return false;
                    }

                    // Use reg instead for convenience :)
                    let sizeStr = state.src.slice(sizeStrPos, pos++).replace(/\s+/g, '');
                    let widthReg = /width=(\d+)/;
                    let widthResult = sizeStr.match(widthReg);
                    if (widthResult && widthResult.length >= 2) {
                        width = widthResult[1];
                        if (state.src.charCodeAt(sizeStrPos + 6 + width.length) == 0x25/* % */) {
                            width += '%';
                        } else {
                            width += 'px';
                        }
                    }

                    let heightReg = /height=(\d+)/;
                    let heightResult = sizeStr.match(heightReg);
                    if (heightResult && heightResult.length >= 2) {
                        height = heightResult[1];
                        if (state.src.charCodeAt(sizeStrPos + 7 + height.length) == 0x25/* % */) {
                            height += '%';
                        } else {
                            height += 'px';
                        }
                    }
                }
                // ++++++++++++++++++++++ width and height parsing ends ++++++++++++++++++++++++++


                //
                // We found the end of the link, and know for a fact it's a valid link;
                // so all that's left to do is to call tokenizer.
                //
                if (!silent) {
                    content = state.src.slice(labelStart, labelEnd);

                    state.md.inline.parse(
                        content,
                        state.md,
                        state.env,
                        tokens = []
                    );

                    token = state.push('image', 'img', 0);
                    token.attrs = attrs = [['src', href], ['alt', '']];
                    token.children = tokens;
                    token.content = content;

                    if (title) {
                        attrs.push(['title', title]);
                    }

                    // ---------------------- width and height parsing starts -----------------------
                    if (width) {
                        attrs.push(['width', width]);
                    }

                    if (height) {
                        attrs.push(['height', height]);
                    }
                    token.attrs[token.attrIndex('alt')][1] = md.renderer.renderInline(token.children, options, state.env);
                    // ++++++++++++++++++++++ width and height parsing ends ++++++++++++++++++++++++++
                }

                state.pos = pos;
                state.posMax = max;
                return true;
            }

            // ---- add our new rule just before raw 'image' ruler instead of replacing it ----
            md.inline.ruler.before('image', 'image_size', image);
            // ++++++
        }
    }
}