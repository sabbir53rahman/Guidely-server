import fs from "fs";
import path from "path";

function fixDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      fixDir(full);
      continue;
    }

    if (!file.endsWith(".js")) continue;

    let content = fs.readFileSync(full, "utf8");

    // Replace your existing content.replace block with this:
    content = content.replace(
      /(?:from|import)\s+["'](\.\.?\/[^"']+)["']/g,
      (match, p1) => {
        // If it already ends in .js, return the match unchanged
        if (p1.endsWith(".js")) return match;

        const importPath = path.resolve(path.dirname(full), p1);

        // First check if a .js file exists
        let isFileJs = false;
        try {
          isFileJs = fs.statSync(`${importPath}.js`).isFile();
        } catch {
          // Ignore error
        }

        if (isFileJs) {
          return match.replace(p1, `${p1}.js`);
        }

        // Check if the imported path is a directory (meaning it needs /index.js)
        let isDir = false;
        try {
          isDir = fs.statSync(importPath).isDirectory();
        } catch {
          // Ignore error
        }

        if (isDir) {
          return match.replace(p1, `${p1}/index.js`);
        }

        // Otherwise, append .js as fallback
        return match.replace(p1, `${p1}.js`);
      },
    );

    fs.writeFileSync(full, content);
  }
}

fixDir("./dist");
