import acorn, { parseExpressionAt } from 'acorn';
import { stripLiteral } from 'strip-literal';
import path from 'node:path';
import { normalizePath } from '@rollup/pluginutils';
import FastGlob from 'fast-glob';
import MagicString from 'magic-string';

const PREFIX = '_glob_import';
const REGEX = /\bimport\.meta\.(glob)(?:<\w+>)?\s*\(/g;

interface ImportMatch {
    ast: acorn.Node;
    patterns: string[];
};

const GetLiteral = (element: acorn.Node) => {
    if (!element) {
        return;
    }
    let value = element['value'];
    if (typeof value !== 'string') {
        throw new Error('Expected glob to be a string but got ' + typeof value);
    }
    return value;
};

const GetMatches = (code: string) => {
    const matches = Array.from(stripLiteral(code).matchAll(REGEX));

    let importMatches: ImportMatch[] = [];
    for (let m in matches) {
        let match = matches[m];

        let ast = parseExpressionAt(code, match.index!, {
            ecmaVersion: 'latest',
            sourceType: 'module',
            ranges: true,
        });
        if (ast.type !== 'CallExpression') {
            continue;
        }

        let args: acorn.Node[] = ast['arguments'];
        if (!args) {
            throw new Error('You must specify at least one glob pattern');
        }

        // Only accept one argument
        if (args.length > 1) {
            throw new Error('Expected 1 argument, but got ' + args.length);
        }

        let argument: acorn.Node = args[0];

        let patterns = [];
        switch (argument.type) {
            case 'Literal':
                patterns.push(GetLiteral(argument));
                break;

            case 'ArrayExpression':
                argument['elements'].forEach((element: acorn.Node) => {
                    patterns.push(GetLiteral(element));
                });
                break;

            default:
                throw new Error('Expected argument to be a Literal or Array');
        }

        importMatches.push({ ast: ast, patterns: patterns });
    }
    return importMatches;
};

export default () => {
    return {
        name: 'import-meta-glob',
        transform: (code: string, id: string) => {
            if (!code.includes('import.meta.glob')) {
                return;
            }

            let s = new MagicString(code);

            let matches: ImportMatch[] = GetMatches(code);
            for (let m in matches) {
                let match: ImportMatch = matches[m];

                let imports: string[] = [];
                let modules: string[] = [];
                match.patterns.forEach((pattern: string) => {
                    let files = FastGlob.sync(pattern, {
                        dot: true,
                        cwd: path.dirname(id),
                        absolute: true,
                    })
                        .map((file) => normalizePath(file))
                        .sort();
                    files.forEach((file: string) => {
                        let moduleName = `${PREFIX}_${m}_${imports.length}`;
                        modules.push(moduleName);
                        imports.push(
                            `import * as ${moduleName} from '${file}'`
                        );
                    });
                });

                s.prepend(imports.join('\n') + '\n');
                s.overwrite(
                    match.ast.start,
                    match.ast.end,
                    `[` + modules.join(', ') + `]`
                );
            }

            return s.toString();
        },
    };
};
