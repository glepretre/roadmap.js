import './style.css';

export class Roadmap {
    constructor(config) {
        this.config = config;
        this.data = config.data;
        this.epicColors = config.epicColors || {};
        
        this.mountPoint = typeof config.mountPoint === 'string' 
            ? document.querySelector(config.mountPoint) 
            : (config.mountPoint || document.body);
            
        this.locale = config.locale || 'en-US';
        this.monthFormat = config.monthFormat || 'short';
        
        const defaultTranslations = {
            weekPrefix: 'W',
            weekOf: 'Week of',
            labelColumn: 'Milestones / Epics',
            durationWeeks: 'weeks',
            durationMonths: 'months',
            epicsCount: 'EPICS',
            idLabel: 'ID',
            taskLabel: 'Task',
            emptyTasks: 'No tasks defined for this EPIC.',
            startPrefix: 'Start:',
            durationPrefix: 'Duration:',
            epicPrefix: 'EPIC',
            lastUpdated: 'Last Updated',
            legend: 'This roadmap is a living document used for project planning and tracking. Estimates are based on current knowledge and are subject to change as development progresses.'
        };
        
        this.translations = { ...defaultTranslations, ...(config.translations || {}) };
    }

    renderSkeleton() {
        this.mountPoint.innerHTML = `
            <header>
                <h1 id="roadmap-title">Loading...</h1>
                <div class="last-updated">${this.translations.lastUpdated} : <strong>${this.config.lastUpdated || ''}</strong></div>
            </header>
            <div class="container">
                <div id="roadmap" class="roadmap-grid"></div>
            </div>
            <div class="legend">${this.translations.legend || ''}</div>
            <div id="epics-details-container" class="epics-details"></div>
            <footer class="roadmap-footer">
                Powered by <a href="https://github.com/glepretre/roadmap.js" target="_blank" rel="noopener noreferrer"><b>Roadmap.js</b></a>
            </footer>
        `;
        this.titleElement = this.mountPoint.querySelector('#roadmap-title');
        this.roadmapContainer = this.mountPoint.querySelector('#roadmap');
        this.detailsContainer = this.mountPoint.querySelector('#epics-details-container');
    }

    init() {
        this.renderSkeleton();

        if (this.titleElement && this.data.name) {
            this.titleElement.textContent = this.data.name;
        }

        let minDate = null;
        let maxDate = null;

        const allEpics = this.data.milestones.flatMap(m => m.epics || []);

        if (allEpics.length === 0) return;

        allEpics.forEach(epic => {
            const start = new Date(epic.start);
            if (!minDate || start < minDate) minDate = new Date(start);

            let durationWeeks = epic.duration.value;
            if (epic.duration.unit === 'months') durationWeeks *= 4.345;

            const end = new Date(start);
            end.setDate(end.getDate() + (durationWeeks * 7));
            if (!maxDate || end > maxDate) maxDate = new Date(end);
        });

        const day = minDate.getDay();
        const diff = minDate.getDate() - (day === 0 ? 6 : day - 1); // Adjust when day is sunday
        minDate.setDate(diff);
        minDate.setHours(0, 0, 0, 0);

        const totalWeeks = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24 * 7));

        if (this.roadmapContainer) {
            this.roadmapContainer.innerHTML = '';
            this.renderTimeline(minDate, totalWeeks);
            this.renderData(minDate);
            this.renderCurrentDate(minDate, totalWeeks);
        }
        
        if (this.detailsContainer) {
            this.detailsContainer.innerHTML = '';
            this.renderEpicTables();
        }
    }

    getISOWeek(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    renderTimeline(minDate, totalWeeks) {
        const header = document.createElement('div');
        header.className = 'timeline-header';

        const labelCol = document.createElement('div');
        labelCol.className = 'label-column';
        labelCol.textContent = this.translations.labelColumn;
        header.appendChild(labelCol);

        const weeksCont = document.createElement('div');
        weeksCont.className = 'weeks-container';
        weeksCont.style.position = 'relative';

        const months = [];
        let currentMonth = null;

        for (let i = 0; i < totalWeeks; i++) {
            const d = new Date(minDate);
            d.setDate(d.getDate() + (i * 7));

            if (!currentMonth || currentMonth.month !== d.getMonth()) {
                if (currentMonth) {
                    currentMonth.endWeek = i;
                }
                const rawLabel = d.toLocaleDateString(this.locale, { month: this.monthFormat, year: 'numeric' });
                const uppercaseLabel = rawLabel.toUpperCase();
                
                currentMonth = {
                    month: d.getMonth(),
                    startWeek: i,
                    label: uppercaseLabel
                };
                months.push(currentMonth);
            }

            const weekLabel = document.createElement('div');
            weekLabel.className = 'week-label';
            weekLabel.textContent = this.translations.weekPrefix + this.getISOWeek(d);
            weekLabel.title = this.translations.weekOf + ' ' + d.toLocaleDateString(this.locale);
            weeksCont.appendChild(weekLabel);
        }
        if (currentMonth) {
            currentMonth.endWeek = totalWeeks;
        }

        months.forEach(m => {
            const marker = document.createElement('div');
            marker.className = 'month-marker';
            marker.style.left = (m.startWeek * 40) + 'px';
            marker.style.width = ((m.endWeek - m.startWeek) * 40) + 'px';
            marker.title = m.label;

            const monthLabel = document.createElement('div');
            monthLabel.className = 'month-label';
            monthLabel.textContent = m.label;
            monthLabel.title = m.label;
            marker.appendChild(monthLabel);
            weeksCont.appendChild(marker);
        });

        header.appendChild(weeksCont);
        this.roadmapContainer.appendChild(header);
    }

    renderData(minDate) {
        const weekWidth = 40;

        const unitTranslation = {
            'weeks': this.translations.durationWeeks,
            'months': this.translations.durationMonths
        };

        (this.data.milestones || []).forEach(ms => {
            const block = document.createElement('div');
            block.className = 'milestone-block';

            const msLabel = document.createElement('div');
            msLabel.className = 'milestone-label';
            msLabel.textContent = ms.name;
            block.appendChild(msLabel);

            const msContent = document.createElement('div');
            msContent.className = 'milestone-content';

            (ms.epics || []).forEach(epic => {
                const row = document.createElement('div');
                row.className = 'epic-row';

                const nameCol = document.createElement('div');
                nameCol.className = 'epic-name';
                nameCol.textContent = `${this.translations.epicPrefix} ${epic.id} - ${epic.name}`;
                row.appendChild(nameCol);

                const epicsCont = document.createElement('div');
                epicsCont.className = 'epics-container';

                const start = new Date(epic.start);
                const offsetWeeks = (start - minDate) / (1000 * 60 * 60 * 24 * 7);

                let durationWeeks = epic.duration.value;
                if (epic.duration.unit === 'months') durationWeeks *= 4.345;

                const bar = document.createElement('div');
                bar.className = 'epic-bar';
                bar.style.left = (offsetWeeks * weekWidth) + 'px';
                bar.style.width = (durationWeeks * weekWidth) + 'px';
                bar.textContent = epic.name;
                bar.style.backgroundColor = this.epicColors[epic.id] || '#94a3b8';

                const unitTransl = unitTranslation[epic.duration.unit] || epic.duration.unit;
                bar.title = `${this.translations.epicPrefix} ${epic.id}: ${epic.name}\n${this.translations.startPrefix} ${new Date(epic.start).toLocaleDateString(this.locale)}\n${this.translations.durationPrefix} ${epic.duration.value} ${unitTransl}`;

                epicsCont.appendChild(bar);
                row.appendChild(epicsCont);
                msContent.appendChild(row);
            });

            block.appendChild(msContent);
            this.roadmapContainer.appendChild(block);
        });
    }

    renderCurrentDate(minDate, totalWeeks) {
        const currentDate = new Date();
        const toUtcDay = date => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
        const elapsedDays = (toUtcDay(currentDate) - toUtcDay(minDate)) / (1000 * 60 * 60 * 24);

        if (elapsedDays < 0 || elapsedDays >= totalWeeks * 7) return;

        const marker = document.createElement('div');
        marker.className = 'current-date-marker';
        marker.style.left = `calc(var(--sidebar-width) + ${(elapsedDays / 7) * 40}px)`;

        this.roadmapContainer.appendChild(marker);
    }

    renderEpicTables() {
        if (!this.detailsContainer) return;
        
        this.detailsContainer.style.display = 'block';

        (this.data.milestones || []).forEach(ms => {
            const section = document.createElement('div');
            section.className = 'milestone-section';

            const header = document.createElement('div');
            header.className = 'milestone-header-section';
            
            const title = document.createElement('h2');
            title.textContent = ms.name;
            
            const badge = document.createElement('span');
            badge.className = 'milestone-header-badge';
            badge.textContent = `${(ms.epics || []).length} ${this.translations.epicsCount}`;
            
            header.appendChild(title);
            header.appendChild(badge);
            
            section.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'epics-details';

            (ms.epics || []).forEach(epic => {
                const color = this.epicColors[epic.id] || '#94a3b8';
                const card = document.createElement('div');
                card.className = 'epic-card';

                const cardHeader = document.createElement('div');
                cardHeader.className = 'epic-card-header';
                cardHeader.style.backgroundColor = color;
                
                const cardTitle = document.createElement('span');
                cardTitle.textContent = epic.name;
                
                const cardId = document.createElement('span');
                cardId.className = 'epic-card-id';
                cardId.textContent = `${this.translations.epicPrefix} ${epic.id}`;
                
                cardHeader.appendChild(cardTitle);
                cardHeader.appendChild(cardId);
                
                card.appendChild(cardHeader);

                const body = document.createElement('div');
                body.className = 'epic-card-body';

                if (epic.tasks && epic.tasks.length > 0) {
                    const table = document.createElement('table');
                    table.className = 'task-table';
                    
                    const thead = document.createElement('thead');
                    const trHead = document.createElement('tr');
                    
                    const thId = document.createElement('th');
                    thId.style.width = '60px';
                    thId.textContent = this.translations.idLabel;
                    
                    const thTask = document.createElement('th');
                    thTask.textContent = this.translations.taskLabel;
                    
                    trHead.appendChild(thId);
                    trHead.appendChild(thTask);
                    thead.appendChild(trHead);
                    table.appendChild(thead);
                    
                    const tbody = document.createElement('tbody');
                    epic.tasks.forEach(task => {
                        const tr = document.createElement('tr');
                        if (task.done === true) tr.className = 'task-done';
                        tr.addEventListener('click', () => {
                            task.done = task.done !== true;
                            tr.classList.toggle('task-done', task.done);
                        });
                        
                        const tdId = document.createElement('td');
                        tdId.className = 'task-id';
                        tdId.textContent = task.roadmap_id || task.id || '';
                        
                        const tdTitle = document.createElement('td');
                        tdTitle.textContent = task.title;
                        
                        tr.appendChild(tdId);
                        tr.appendChild(tdTitle);
                        tbody.appendChild(tr);
                    });
                    
                    table.appendChild(tbody);
                    body.appendChild(table);
                } else {
                    const empty = document.createElement('div');
                    empty.className = 'empty-tasks';
                    empty.textContent = this.translations.emptyTasks;
                    body.appendChild(empty);
                }

                card.appendChild(body);
                grid.appendChild(card);
            });

            section.appendChild(grid);
            this.detailsContainer.appendChild(section);
        });
    }
}
