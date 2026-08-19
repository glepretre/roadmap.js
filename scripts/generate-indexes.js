import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function getProjects() {
    return fs.readdirSync(path.resolve(rootDir, 'projects'), { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

export function generateIndexes(projects) {
    const rootIndexPath = path.resolve(rootDir, 'index.html');
    const distDir = path.resolve(rootDir, 'dist');
    const distIndexPath = path.resolve(distDir, 'index.html');

    if (!fs.existsSync(rootIndexPath)) return;

    let html = fs.readFileSync(rootIndexPath, 'utf-8');

    const projectsListHtml = projects.map(project => {
        const dataJsonPath = path.resolve(rootDir, 'projects', project, 'data.json');
        let name = project;
        let description = '';
        let themeColor = '';

        if (fs.existsSync(dataJsonPath)) {
            try {
                const data = JSON.parse(fs.readFileSync(dataJsonPath, 'utf-8'));
                name = data.name || project;
                description = data.description || '';
                themeColor = data.themeColor || '';
            } catch (e) {
                console.warn(`Could not parse data.json for project ${project}`);
            }
        }

        const styleAttr = themeColor ? ` style="--project-color: ${themeColor};"` : '';

        return `
          <a href="/projects/${project}/roadmap.html" class="project-card" data-project="${project}"${styleAttr}>
            <div class="project-content">
                <div class="project-info">
                    <span class="project-name">${name}</span>
                    <span class="project-desc">${description}</span>
                </div>
                <div class="project-action">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                </div>
            </div>
        </a>`;
    }).join('\n\n');

    const startMarker = '<!-- PROJECTS_START -->';
    const endMarker = '<!-- PROJECTS_END -->';
    const markerRegex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`);
    const updatedHtml = html.replace(markerRegex, `${startMarker}\n${projectsListHtml}\n        ${endMarker}`);

    // Update source index for dev
    fs.writeFileSync(rootIndexPath, updatedHtml);

    // Update dist index with relative links if dist exists
    if (fs.existsSync(distDir)) {
        let distHtml = updatedHtml;
        projects.forEach(project => {
            const regex = new RegExp(`/projects/${project}/roadmap\\.html`, 'g');
            distHtml = distHtml.replace(regex, `./${project}/index.html`);
        });
        fs.writeFileSync(distIndexPath, distHtml);
    }

    console.log('Project indexes updated.');
}

// Run if called directly
if (process.argv[1] === __filename) {
    generateIndexes(getProjects());
}
