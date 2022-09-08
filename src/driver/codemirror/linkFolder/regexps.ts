export const INLINE_LINK_REG = /(?<!\!)\[([^\[]*?)\]\((.*?)\)/g;
export const INLINE_IMAGE_REG =/!\[(.*)\]\((.+)\)(\{.*?\})?/g;
export const INLINE_FOOTNOTE_REG = /(?<!(^\s*))\[\^(.*?)\]/g;

export const BLOCK_IMAGE_REG = /^\s*!\[(.*)\]\((.+)\)(\{.*?\})?\s*$/;

// from https://regexr.com/3ciio
export const BLOCK_LINK_REG = /^\s*(\[((?:\[[^\]]*\]|[^\[\]])*)\]\([ \t]*()<?((?:\([^)]*\)|[^()\s])*?)>?[ \t]*((['"])(.*?)\6[ \t]*)?\))\s*$/;

export const CODE_BLOCK_START = /^\s*```\s*(\S+)\s*$/;
export const CODE_BLOCK_END = /^\s*```\s*$/;


export const HTML_MARK_REG = /<mark[^>]*?>(.*?)<\/mark>/g;
export const HTML_TAG_STYLE_REG = /style="(.*?)"/;

export const HTML_INS_REG = /<ins[^>]*?>(.*?)<\/ins>/g;
