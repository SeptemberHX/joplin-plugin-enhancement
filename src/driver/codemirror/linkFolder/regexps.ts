export const INLINE_LINK_REG = /(?<!\!)\[([^\[]*?)\]\((.*?)\)/g;
export const INLINE_IMAGE_REG =/\!\[([^\[]*?)\]\((.*?)\)(\{.*?\})?/g;
export const INLINE_FOOTNOTE_REG = /(?<!(^\s*))\[\^(.*?)\]/g;

export const BLOCK_IMAGE_REG = /^\s*\!\[([^\[]*?)\]\((.*?)\)(\{.*?\})?\s*$/;
export const BLOCK_LINK_REG = /^\s*(?<!\!)\[([^\[]*?)\]\((.*?)\)\s*$/;
