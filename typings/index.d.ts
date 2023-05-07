interface ImportMetaGlob {
    (path: string|string[]): object[];
}

declare global {
    interface ImportMeta {
        glob: ImportMetaGlob;
    }
}

declare const _default: () => {
    name: string;
    transform: (code: string, id: string) => string;
};
export default _default;
