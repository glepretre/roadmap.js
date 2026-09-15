import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProjects, generateIndexes } from './generate-indexes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function buildStandalone(project) {
    const distProjectDir = path.resolve(rootDir, 'dist', project);
    const libraryJsPath = path.resolve(rootDir, 'dist/roadmap.umd.cjs');
    const libraryCssPath = path.resolve(rootDir, 'dist/roadmap.css');

    if (!fs.existsSync(libraryJsPath) || !fs.existsSync(libraryCssPath)) {
        console.error('Build the library first before running this script.');
        process.exit(1);
    }

    if (!fs.existsSync(distProjectDir)) {
        fs.mkdirSync(distProjectDir, { recursive: true });
    }

    const libraryJs = fs.readFileSync(libraryJsPath, 'utf-8');
    const libraryCss = fs.readFileSync(libraryCssPath, 'utf-8');

    let html = fs.readFileSync(path.resolve(rootDir, 'projects', project, 'roadmap.html'), 'utf-8');

    const injection = `
    <style>\n${libraryCss}\n    </style>
    <script>\n${libraryJs}\n    </script>`;

    // Inject the library CSS and JS right after the <head> tag so client styles can override it
    if (html.includes('<head>')) {
        html = html.replace('<head>', `<head>\n${injection}`);
    } else {
        html = injection + html;
    }

    // Read the data.json to embed it directly
    const dataJsonPath = path.resolve(rootDir, 'projects', project, 'data.json');
    let dataJson = '{}';
    if (fs.existsSync(dataJsonPath)) {
        dataJson = fs.readFileSync(dataJsonPath, 'utf-8');
    }

    // Remove the module script tag that imports the src folder and replace with the UMD class + init logic
    const scriptRegex = /<script type="module" id="app-script">([\s\S]*?)<\/script>/i;
    const match = html.match(scriptRegex);
    
    if (match) {
        let scriptContent = match[1];
        // Replace the import statement with the global object reference
        scriptContent = scriptContent.replace(/import { Roadmap } from '.*?';/g, 'const Roadmap = window.RoadmapGen.Roadmap;');
        
        // Embed the JSON data to avoid CORS issues on file:// protocol
        scriptContent = scriptContent.replace(
            /fetch\('data\.json'\)\s*\.then\(.*?\)\s*\.then\(data => {/gs,
            `Promise.resolve(${dataJson.trim()}).then(data => {`
        );
        
        // Replace the original module script with a standard script containing the modified content
        html = html.replace(scriptRegex, `<script>${scriptContent}</script>`);
    }

    fs.writeFileSync(path.resolve(distProjectDir, 'index.html'), html);
    fs.copyFileSync(path.resolve(rootDir, 'projects', project, 'data.json'), path.resolve(distProjectDir, 'data.json'));
    
    console.log(`Generated standalone HTML for ${project}`);
}

const projects = getProjects();
projects.forEach(project => buildStandalone(project));
generateIndexes(projects);
