export function exec(query: RegExp, stream: any) {
    query.lastIndex = stream.pos;
    return query.exec(stream.string);
}
