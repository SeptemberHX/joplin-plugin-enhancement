
/**
 * Because this plugin supports both CodeMirror 5 and CodeMirror 6,
 * we need to be able to dynamic-require some packages that are only available
 * in CodeMirror 6.
 * 
 * Normal imports fail in older versions of Joplin where these libraries aren't
 * available and perhaps in some cases while using CodeMirror 5.
 */

import type * as CodeMirrorView from '@codemirror/view';
import type * as CodeMirrorState from '@codemirror/state';
import type * as CodeMirrorLanguage from '@codemirror/language';

export function requireCodeMirrorView() {
    return require('@codemirror/view') as typeof CodeMirrorView;
}

export function requireCodeMirrorState() {
    return require('@codemirror/state') as typeof CodeMirrorState;
}

export function requireCodeMirrorLanguage() {
    return require('@codemirror/language') as typeof CodeMirrorLanguage;
}
