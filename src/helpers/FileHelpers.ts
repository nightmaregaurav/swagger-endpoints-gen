import * as fs from "fs";

export const createDirectoryIfNotExists = (path: string) => {
    if (!fs.existsSync(path)) fs.mkdirSync(path, {recursive: true});
}

export const createFileWithContent = (path: string, content: string) => {
    createDirectoryIfNotExists(path.substring(0, path.lastIndexOf("/")));
    if (fs.existsSync(path)) {
        fs.unlinkSync(path);
        console.log(`File ${path} already exists. Will overwrite it. Prefer using different classnames for models in same namespace.`);
    }
    fs.writeFileSync(path, content);
}
