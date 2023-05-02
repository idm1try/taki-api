export function omit(obj: any, props: string[]) {
    const result = { ...obj };
    props.forEach(function (prop) {
        delete result[prop];
    });
    return result;
}
