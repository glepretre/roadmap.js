//#region src/roadmap.js
var e = class {
	constructor(e) {
		this.config = e, this.data = e.data, this.epicColors = e.epicColors || {}, this.mountPoint = typeof e.mountPoint == "string" ? document.querySelector(e.mountPoint) : e.mountPoint || document.body, this.locale = e.locale || "en-US", this.monthFormat = e.monthFormat || "short";
		let t = {
			weekPrefix: "W",
			weekOf: "Week of",
			labelColumn: "Milestones / Epics",
			durationWeeks: "weeks",
			durationMonths: "months",
			epicsCount: "EPICS",
			idLabel: "ID",
			taskLabel: "Task",
			emptyTasks: "No tasks defined for this EPIC.",
			startPrefix: "Start:",
			durationPrefix: "Duration:",
			epicPrefix: "EPIC",
			lastUpdated: "Last Updated",
			legend: "This roadmap is a living document used for project planning and tracking. Estimates are based on current knowledge and are subject to change as development progresses."
		};
		this.translations = {
			...t,
			...e.translations || {}
		};
	}
	renderSkeleton() {
		this.mountPoint.innerHTML = `
            <header>
                <h1 id="roadmap-title">Loading...</h1>
                <div class="last-updated">${this.translations.lastUpdated} : <strong>${this.config.lastUpdated || ""}</strong></div>
            </header>
            <div class="container">
                <div id="roadmap" class="roadmap-grid"></div>
            </div>
            <div class="legend">${this.translations.legend || ""}</div>
            <div id="epics-details-container" class="epics-details"></div>
            <footer class="roadmap-footer">
                Powered by <a href="https://github.com/glepretre/roadmap.js" target="_blank" rel="noopener noreferrer"><b>Roadmap.js</b></a>
            </footer>
        `, this.titleElement = this.mountPoint.querySelector("#roadmap-title"), this.roadmapContainer = this.mountPoint.querySelector("#roadmap"), this.detailsContainer = this.mountPoint.querySelector("#epics-details-container");
	}
	init() {
		this.renderSkeleton(), this.titleElement && this.data.name && (this.titleElement.textContent = this.data.name);
		let e = null, t = null, n = this.data.milestones.flatMap((e) => e.epics || []);
		if (n.length === 0) return;
		n.forEach((n) => {
			let r = new Date(n.start);
			(!e || r < e) && (e = new Date(r));
			let i = n.duration.value;
			n.duration.unit === "months" && (i *= 4.345);
			let a = new Date(r);
			a.setDate(a.getDate() + i * 7), (!t || a > t) && (t = new Date(a));
		});
		let r = e.getDay(), i = e.getDate() - (r === 0 ? 6 : r - 1);
		e.setDate(i), e.setHours(0, 0, 0, 0);
		let a = Math.ceil((t - e) / 6048e5);
		this.roadmapContainer && (this.roadmapContainer.innerHTML = "", this.renderTimeline(e, a), this.renderData(e)), this.detailsContainer && (this.detailsContainer.innerHTML = "", this.renderEpicTables());
	}
	getISOWeek(e) {
		let t = new Date(Date.UTC(e.getFullYear(), e.getMonth(), e.getDate())), n = t.getUTCDay() || 7;
		t.setUTCDate(t.getUTCDate() + 4 - n);
		let r = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
		return Math.ceil(((t - r) / 864e5 + 1) / 7);
	}
	renderTimeline(e, t) {
		let n = document.createElement("div");
		n.className = "timeline-header";
		let r = document.createElement("div");
		r.className = "label-column", r.textContent = this.translations.labelColumn, n.appendChild(r);
		let i = document.createElement("div");
		i.className = "weeks-container", i.style.position = "relative";
		let a = [], o = null;
		for (let n = 0; n < t; n++) {
			let t = new Date(e);
			if (t.setDate(t.getDate() + n * 7), !o || o.month !== t.getMonth()) {
				o && (o.endWeek = n);
				let e = t.toLocaleDateString(this.locale, {
					month: this.monthFormat,
					year: "numeric"
				}).toUpperCase();
				o = {
					month: t.getMonth(),
					startWeek: n,
					label: e
				}, a.push(o);
			}
			let r = document.createElement("div");
			r.className = "week-label", r.textContent = this.translations.weekPrefix + this.getISOWeek(t), r.title = this.translations.weekOf + " " + t.toLocaleDateString(this.locale), i.appendChild(r);
		}
		o && (o.endWeek = t), a.forEach((e) => {
			let t = document.createElement("div");
			t.className = "month-marker", t.style.left = e.startWeek * 40 + "px", t.style.width = (e.endWeek - e.startWeek) * 40 + "px", t.title = e.label;
			let n = document.createElement("div");
			n.className = "month-label", n.textContent = e.label, n.title = e.label, t.appendChild(n), i.appendChild(t);
		}), n.appendChild(i), this.roadmapContainer.appendChild(n);
	}
	renderData(e) {
		let t = {
			weeks: this.translations.durationWeeks,
			months: this.translations.durationMonths
		};
		(this.data.milestones || []).forEach((n) => {
			let r = document.createElement("div");
			r.className = "milestone-block";
			let i = document.createElement("div");
			i.className = "milestone-label", i.textContent = n.name, r.appendChild(i);
			let a = document.createElement("div");
			a.className = "milestone-content", (n.epics || []).forEach((n) => {
				let r = document.createElement("div");
				r.className = "epic-row";
				let i = document.createElement("div");
				i.className = "epic-name", i.textContent = `${this.translations.epicPrefix} ${n.id} - ${n.name}`, r.appendChild(i);
				let o = document.createElement("div");
				o.className = "epics-container";
				let s = (new Date(n.start) - e) / 6048e5, c = n.duration.value;
				n.duration.unit === "months" && (c *= 4.345);
				let l = document.createElement("div");
				l.className = "epic-bar", l.style.left = s * 40 + "px", l.style.width = c * 40 + "px", l.textContent = n.name, l.style.backgroundColor = this.epicColors[n.id] || "#94a3b8";
				let u = t[n.duration.unit] || n.duration.unit;
				l.title = `${this.translations.epicPrefix} ${n.id}: ${n.name}\n${this.translations.startPrefix} ${new Date(n.start).toLocaleDateString(this.locale)}\n${this.translations.durationPrefix} ${n.duration.value} ${u}`, o.appendChild(l), r.appendChild(o), a.appendChild(r);
			}), r.appendChild(a), this.roadmapContainer.appendChild(r);
		});
	}
	renderEpicTables() {
		this.detailsContainer && (this.detailsContainer.style.display = "block", (this.data.milestones || []).forEach((e) => {
			let t = document.createElement("div");
			t.className = "milestone-section";
			let n = document.createElement("div");
			n.className = "milestone-header-section";
			let r = document.createElement("h2");
			r.textContent = e.name;
			let i = document.createElement("span");
			i.className = "milestone-header-badge", i.textContent = `${(e.epics || []).length} ${this.translations.epicsCount}`, n.appendChild(r), n.appendChild(i), t.appendChild(n);
			let a = document.createElement("div");
			a.className = "epics-details", (e.epics || []).forEach((e) => {
				let t = this.epicColors[e.id] || "#94a3b8", n = document.createElement("div");
				n.className = "epic-card";
				let r = document.createElement("div");
				r.className = "epic-card-header", r.style.backgroundColor = t;
				let i = document.createElement("span");
				i.textContent = e.name;
				let o = document.createElement("span");
				o.className = "epic-card-id", o.textContent = `${this.translations.epicPrefix} ${e.id}`, r.appendChild(i), r.appendChild(o), n.appendChild(r);
				let s = document.createElement("div");
				if (s.className = "epic-card-body", e.tasks && e.tasks.length > 0) {
					let t = document.createElement("table");
					t.className = "task-table";
					let n = document.createElement("thead"), r = document.createElement("tr"), i = document.createElement("th");
					i.style.width = "60px", i.textContent = this.translations.idLabel;
					let a = document.createElement("th");
					a.textContent = this.translations.taskLabel, r.appendChild(i), r.appendChild(a), n.appendChild(r), t.appendChild(n);
					let o = document.createElement("tbody");
					e.tasks.forEach((e) => {
						let t = document.createElement("tr");
						e.done === !0 && (t.className = "task-done"), t.addEventListener("click", () => {
							e.done = e.done !== !0, t.classList.toggle("task-done", e.done);
						});
						let n = document.createElement("td");
						n.className = "task-id", n.textContent = e.roadmap_id || e.id || "";
						let r = document.createElement("td");
						r.textContent = e.title, t.appendChild(n), t.appendChild(r), o.appendChild(t);
					}), t.appendChild(o), s.appendChild(t);
				} else {
					let e = document.createElement("div");
					e.className = "empty-tasks", e.textContent = this.translations.emptyTasks, s.appendChild(e);
				}
				n.appendChild(s), a.appendChild(n);
			}), t.appendChild(a), this.detailsContainer.appendChild(t);
		}));
	}
};
//#endregion
export { e as Roadmap };
