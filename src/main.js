
import plugin from "../plugin.json";
import styles from "./styles.scss";

const fs = acode.require("fsOperation");
const settings = acode.require("settings");
const SideButton = acode.require("sideButton");
const alert = acode.require("alert");

class BMWindow {
	static #signalShow = new Event("show");
	static #signalHide = new Event("hide");
	static #signalDebug = new Event("debug");
	
	#panel = tag("section", { className: "mnbm-window" });
	#content = null;
	#debug = tag("button", { className: "mnbm-debug", innerText: "<>", dataset: { action: "debug" } });
	
	debugMode(mode) { this.#debug.style.display = !!mode ? "block" : "none" }
	
	constructor () {
		this.panel.innerHTML = `
			<div class="mnbm-content">
				<header class="mnbm-header">
					<span class="mnbm-drag"> </span>
					<button class="mnbm-close"> X </button>
				</header>
				<article class="mnbm-body">
					<div class="mnbm-container"> </div>
				</article>
			</div>
			<div class="mnbm-bg"> </div>
		`;
		this.panel.querySelector(".mnbm-header").prepend(this.#debug);
		this.debugMode(false);
		this.panel.querySelector(".mnbm-drag").addEventListener("touchmove", async (e) => this.#onTouchMoved(e));
		this.panel.querySelector(".mnbm-bg").addEventListener("touchmove", async (e) => this.#onTouchMoved(e));
		this.panel.querySelector(".mnbm-close").addEventListener("click", (e) => this.hide());
		this.#debug.addEventListener("click", (e) => this.panel.dispatchEvent(BMWindow.#signalDebug));
	}
	
	show() {
		this.visible = true;
		this.panel.dispatchEvent(BMWindow.#signalShow);
	}
	
	hide() {
		this.visible = false;
		this.panel.dispatchEvent(BMWindow.#signalHide);
	}
	
	attachContent(...wc) {
		const h = this.panel.querySelector(".mnbm-header");
		const x = h.querySelector(".mnbm-close");
		const c = this.panel.querySelector(".mnbm-container")
		wc.forEach((v) => {
			h.append(v.controlPanel);
			c.append(v.list);
			v.visible = false;
		})
		h.append(x);
	}
	
	hasContent(wc) { return wc.closest(".mnbm-window") == this.panel }
	
	setContent(wc) {
		if (this.#content) this.#content.visible = false;
		this.#content = wc;
		wc.visible = true;
	}
	
	async #onTouchMoved(event) {
		const x = ((event.touches[0].clientX + this.panel.offsetWidth / 2 - 16) / (this.panel.offsetWidth * 2));
		//const x = (event.touches[0].clientX / (this.panel.offsetWidth * 2));
		const y = ((event.touches[0].clientY + this.panel.offsetHeight / 2 - 16) / (this.panel.offsetHeight * 2));
		this.panel.style.left = x * 100 +  "%";
		this.panel.style.top = y * 100 + "%";
	}
	
	get panel() { return this.#panel }
	
	get visible() { return this.panel.isConnected }
	
	set visible(x) {
		if (x && !this.visible) {
			document.body.append(this.panel);
			return;
		};
		if (!x && this.visible) this.panel.remove();
	}
}

class BMWContent {
	#controlPanel = tag("span", { className: "mnbm-control-panel" });
	#list = tag("ul", { className: "mnbm-list" });
	#visible = false;
	
	get controlPanel() { return this.#controlPanel }
	
	get list() { return this.#list }
	
	get visible() { return this.#visible }
	
	set visible(x) {
		this.controlPanel.style.display = x ? "flex" : "none";
		this.list.style.display = x ? "list-item" : "none";
		this.#visible = x;
	}
}

class Debugger extends BMWContent {
	
	constructor () {
		super();
		this.controlPanel.innerHTML = `
			<button class="mnbm-debug-data" data-action="data"> Data </button>
			<button class="mnbm-debug-buffer" data-action="buffer"> Buffer </button>
			<button class="mnbm-debug-file" data-action="file"> File </button>
			<button class="mnbm-debug-array" data-action="array"> Array </button>
			<button class="mnbm-debug-tree" data-action="tree"> Tree </button>
			<button class="mnbm-debug-clear" data-action="clear"> Clear </button>
		`;
		this.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "erase":
					this.unLog(target.parentElement);
					return;
			}
		});
	}
	
	log(...logs) {
		logs.forEach((log) => {
			const li = tag("li", {
				className: "mnbm-item",
				prefixNode: tag("p", { className: "mnbm-prefix", innerText: this.list.childElementCount }),
				textNode: tag("p", { className: "mnbm-text", innerText: JSON.stringify(log) })
			});
			li.append(li.prefixNode, li.textNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
			li.textNode.scrollLeft = 100000;
			this.list.append(li);
		});
		this.align();
	}
	
	unLog(itm) {
		let e = itm.nextElementSibling;
		let i = parseInt(itm.prefixNode.innerText);
		itm.remove();
		while (e) {
			e.prefixNode.innerText = i;
			e = e.nextElementSibling;
			i += 1;
		}
		this.align();
	}
	
	align() {
		if (this.list.childElementCount == 0) return;
		this.list.lastElementChild.prefixNode.style.width = "auto";
		const w = this.list.lastElementChild?.prefixNode.offsetWidth;
		let e = this.list.firstElementChild;
		while (e) {
			e.prefixNode.style.width = w + "px";
			e = e.nextElementSibling;
		}
	}
}

const debugManager = new Debugger();

class BookmarkManager extends BMWContent {
	
	constructor () {
		super();
		this.controlPanel.innerHTML = `
			<button class="mnbm-toggle" data-action="toggle"> ⇌ </button>
			<button class="mnbm-save" data-action="save"> ↑ </button>
			<button class="mnbm-load" data-action="load"> ↓ </button>
			<button class="mnbm-file" data-action="file"> ≡ </button>
		`;
		
		this.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			const event = new CustomEvent("bmclick", { detail: {
				action: target.dataset.action,
				row: parseInt(target.parentElement.prefixNode.innerText) - 1
			} });
			this.list.dispatchEvent(event);
		});
	}
	
	#newItem(row) {
		const li = tag("li", {
			className: "mnbm-item",
			prefixNode: tag("p", { className: "mnbm-prefix", dataset: { action: "select" }, innerText: (row ?? 0) + 1 }),
			textNode: tag("p", { className: "mnbm-text", dataset: { action: "select" }, innerText: editorManager.activeFile.session.getLine(row ?? 0) })
		});
		li.append(li.prefixNode, li.textNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
		return li;
	}
	
	addRow(row, to) {
		const idx = this.list.childElementCount;
		this.list.append(this.#newItem(row));
		if (to != idx) this.#moveItem(idx, to); 
		if (this.visible) this.align();
	}
	
	#moveItem(bgn, fnsh) {
		const chn = this.list.children;
		this.list.insertBefore(chn.item(bgn), chn.item(fnsh));
	}
	
	#setItemRow(itm, row) {
		itm.prefixNode.innerText = row + 1;
		itm.textNode.innerText = editorManager.activeFile.session.getLine(row);
	}
	
	removeRow(idx) { this.list.children.item(idx).remove() }
	
	makeList(array) {
		const newList = [];
		array.forEach((i) => { newList.push(this.#newItem()) });
		this.list.innerHTML = ""
		this.list.append(...newList);
		if (this.visible) this.editList(array);
	}
	
	editList(array) {
		const chn = this.list.children;
		for (let i = 0; i < array.length; i++) { this.#setItemRow(chn.item(i), array[i]) }
		this.align();
	}
	
	align() {
		if (this.list.childElementCount == 0) return;
		this.list.lastElementChild.prefixNode.style.width = "auto";
		const w = this.list.lastElementChild.prefixNode.offsetWidth;
		let e = this.list.firstElementChild;
		while (e) {
			e.prefixNode.style.width = w + "px";
			e = e.nextElementSibling;
		}
	}
}

class RegexManager extends BMWContent {
	
	constructor() {
		super();
		this.controlPanel.innerHTML = `
			<button class="mnbm-back" data-action="back"> ≪ </button>
			<button class="mnbm-regex-add" data-action="regex-add"> (+.*) </button>
		`;
		this.controlPanel.lastElementChild.addEventListener("click", (e) => { this.addRegex() });
		
		this.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "erase":
					target.parentElement.remove();
					return;
			}
		});
		this.list.addEventListener("dbclick", (e) => {
			const target = e.target.closest(".mnbm-item");
			if (!target) return;
			
			if (target.disabled) {
				target.style.opacity = 1;
				target.disabled = false;
				return;
			};
			target.style.opacity = 0.5;
			target.disabled = true;
		});
	}
	
	addRegex(rgx = "", sm = "") {
		const li = tag("li", {
			className: "mnbm-item",
			disabled: false,
			regexNode: tag("input", { placeholder: "RegEx: e.g com\\.termux", value: rgx }),
			sliceNode: tag("input", { placeholder: "SliceMatch: e.g ::", value: sm })
		});
		li.append(li.regexNode, li.sliceNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
		this.list.append(li);
	}
	
	getRegex() {
		const arr = [];
		for (let e of this.list.children) { arr.push([e.regexNode.value, e.sliceNode.value]) }
		return arr;
	}
	
	format(x) {
		for (let e of this.list.children) {
			if (e.disabled) return;
			const r = new RegExp(e.regexNode.value);
			if (x.search(r) > -1) x = x.split(e.sliceNode.value).pop(); // r.test(x)
		}
		return x;
	}
}

class DataManager extends BMWContent{
	static #signalToggle = new Event("bmtoggle");
	
	#regexManager = new RegexManager();
	#focus = null;
	
	get regexManager() { return this.#regexManager }
	
	constructor () {
		super();
		// <button class="mnbm-check-files" data-action="check-files"> (...) </button>
		this.controlPanel.innerHTML = `
			<button class="mnbm-back" data-action="back"> ≪ </button>
			<button class="mnbm-regex-visible" data-action="regex-visible"> (.*) </button>
		`;
		this.controlPanel.lastElementChild.addEventListener("click", (e) => { this.controlPanel.dispatchEvent(DataManager.#signalToggle) });
		this.regexManager.controlPanel.firstElementChild.addEventListener("click", (e) => { this.controlPanel.dispatchEvent(DataManager.#signalToggle) });
	}
	
	mapRoot(paths, idx) {
		if (paths.length == 0) return null;
		let path = "";
		while (paths[idx][0] != idx) {
			path = paths[idx][1] + path;
			idx = paths[idx][0];
		}
		return paths[idx][1] + path;
	}
	
	addFile(id, loc, fn) {
		loc = decodeURIComponent(loc);
		const arrLoc = this.pathSplit(loc);
		const folder = this.#getFolder(this.list, arrLoc, 0, true);
		const file = this.#newFile(id, fn);
		folder.append(file);
		this.sortFolder(folder, folder.parentElement, this.list);
	}
	
	#newFolder(path) { return tag("ul", { className: "mnbm-folder", "path": path, innerText: this.regexManager.format(path) }) }
	
	#newFile(id, name) {
		const li = tag("li", {
			className: "mnbm-file",
			"id": id,
			invalid: false,
			prefixNode: tag("p", { className: "mnbm-prefix", innerText: "-" }),
			textNode: tag("p", { className: "mnbm-text", innerText: name })
		});
		li.append(li.prefixNode, li.textNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
		return li;
	}
	
	#sliceFolder(folder, deep) {
		const fPath = this.pathSplit(folder.path);
		const lPath = this.splitReduce(fPath, 0, deep);
		const rPath = this.splitReduce(fPath, deep);
		const lFolder = this.#newFolder(lPath);
		folder.parentElement.insertBefore(lFolder, folder);
		lFolder.append(folder);
		folder.path = rPath;
		folder.firstChild.textContent = this.regexManager.format(rPath);
	}
	
	removeFile(id) { // CHECK WITH REMOVE_FILE_LOGIC.PNG
		const file = this.#getFile(id);
		if (!file) return;
		let folder = file.parentElement;
		file.remove();
		while (folder.className == "mnbm-folder") {
			const parent = folder.parentElement;
			if (folder.childElementCount == 0) {
				folder.remove();
				folder = parent;
				continue;
			};
			if (folder.childElementCount == 1) {
				const child = folder.firstElementChild;
				if (child.className == "mnbm-file") break;
				parent.insertBefore(child, folder);
				child.path = folder.path + child.path;
				child.firstChild.textContent = this.regexManager.format(child.path);
				folder.remove();
			};
			folder = parent?.parentElement; // ???
			break;
		}
	}
	
	tryFocus(id) {
		const files = this.list.querySelectorAll(".mnbm-file");
		if (this.#focus) this.#focus.style.background = this.#focus.invalid ? "#c8141433" : "#ffffff66";
		this.#focus = null;
		for (let i = 0; i < files.length; i++) {
			if (files[i].id == id) {
				this.#focus = files[i];
				const focused = this.#focus.id == editorManager.activeFile.id;
				if (focused) this.#focus.style.background = "#c8c8ff66";
				return;
			};
		};
	}
	
	#getFile(id) {
		const files = this.list.querySelectorAll(".mnbm-file");
		for (let i = 0; i < files.length; i++) { if (files[i].id == id) return files[i] };
		return null;
	}
	
	hasFile(id) { return !!this.#getFile(id) }
	
	findFile(id) {
		const file = this.#getFile(id);
		if (!file) return null;
		let folder = file.parentElement;
		let path = "";
		
		while (folder) {
			path = path + folder.path;
			folder = folder.parentElement;
		}
		return [path, file.textNode.innerText];
	}
	
	hasPath(loc, fn, id) {
		loc = decodeURIComponent(loc);
		const tree = this.getTree(true);
		
		for (let e in tree[2]) {
			if (e[1][0] == loc) {
				if (fn && fn != e[1][1]) continue;
				if (id && id != e[0]) continue;
				return true;
			};
		}
		return false;
	}
	
	#getFolder(fromFolder, arrLoc, idxLoc, create = false) {
		let folder = fromFolder.firstElementChild;
		
		while (folder) {
			const FOLDER_PREV = folder.parentElement;
			const FOLDER_NEXT = folder.nextElementSibling;
			const FOLDER_DEEP = folder.firstElementChild;
			
			if (folder.className != "mnbm-folder") {
				if (!FOLDER_NEXT) {
					if (!create) return null;
					folder = this.#newFolder(this.splitReduce(arrLoc, idxLoc));
					FOLDER_PREV.append(folder);
					return folder;
				}
				folder = FOLDER_NEXT;
				continue;
			};
			
			const fpath = this.pathSplit(folder.path);
			
			for (let i = 0; i < fpath.length; i++) {
				const [FOLDER_FOUND, REQUEST_LIMIT, FOLDER_LIMIT, FIRST_FOLDER] = [
					arrLoc[idxLoc + i] == fpath[i],
					idxLoc + i == arrLoc.length - 1,
					i == fpath.length - 1,
					i == 0
				];
				if (FOLDER_FOUND) {
					if (REQUEST_LIMIT) {
						if (FOLDER_LIMIT) return folder; // EXACT PATH
						this.#sliceFolder(folder, i + 1);
						return folder.parentElement; // FOLDER IN-BETWEEN
					};
					if (FOLDER_LIMIT) {
						folder = FOLDER_DEEP; // EXPECTED NEVER EMPTY FOLDER
						idxLoc += fpath.length;
						break;
					};
				};
				if (!FOLDER_FOUND) {
					if (FIRST_FOLDER) {
						if (!FOLDER_NEXT) {
							if (!create) return null;
							folder = this.#newFolder(this.splitReduce(arrLoc, idxLoc));
							FOLDER_PREV.append(folder);
							return folder; // NEW SIBLING PATH
						};
						folder = FOLDER_NEXT;
						break;
					};
					this.#sliceFolder(folder, i);
					folder.parentElement.append(this.#newFolder(this.splitReduce(arrLoc, idxLoc + i)));
					return folder.parentElement.lastElementChild; // NEW IN-BETWEEN FOLDER
				};
			}
		}
		if (!create) return null;
		folder = this.#newFolder(this.splitReduce(arrLoc, idxLoc));
		fromFolder.append(folder);
		return folder;
	}
	
	sortFolder(...queue) {
		queue.forEach((folder) => {
			const folders = [];
			const files = [];
			for (let e of folder.children) {
				if (e.className == "mnbm-folder") {
					folders.push(e);
					continue;
				};
				files.push(e);
			}
			folders.sort((a, b) => a.path.localeCompare(b.path));
			files.sort((a, b) => a.textNode.innerText.localeCompare(b.textNode.innerText));
			folder.append(...files, ...folders);
		});
	}
	
	filePath(file) {
		let folder = file.parentElement;
		let path = "";
		while (folder.parentElement.className == "mnbm-folder") {
			path = folder.path + path;
			folder = folder.parentElement;
		}
		return path;
	};
	
	getTree(uri = false) { // [ path = [root_idx, branch], file = [id, [branch_idx, name]], #uri = [id, [path, name]] ]
		const folders = this.list.querySelectorAll(".mnbm-folder");
		if (folders.length == 0) return [[], []];
		const paths = [];
		const files = [];
		
		for (let i = 0; i < folders.length; i++) {
			const root = folders[i].parentElement.className == "mnbm-folder" ? Array.prototype.indexOf.call(folders, folders[i].parentElement) : i;
			paths.push([root, folders[i].path]);
			for (let e of folders[i].children) {
				if (e.className == "mnbm-file") files.push([e.id, [i, e.textNode.innerText]])
			}
		}
		if (uri) {
			const arr = [];
			files.forEach((x) => {
				arr.push([x[0], ["", x[1][1]]]);
				let i = x[1][0];
				while (i != paths[i][0]) {
					arr[arr.length - 1][1][0] = paths[i][1] + arr[arr.length - 1][1][0];
					i = paths[i][0];
				}
				arr[arr.length - 1][1][0] = paths[i][1] + arr[arr.length - 1][1][0];
			});
			return [paths, files, arr];
		};
		return [paths, files];
	}
		
	setTree(paths, files) {
		const queue = [];
		files.forEach((f) => { queue.push([f[0], this.mapRoot(paths, f[1][0]), f[1][1]]) });
		this.list.innerHTML = "";
		queue.forEach((q) => { this.addFile(...q) });
	}
	
	/*
	// SEE ACODE.URL, ACODE.ENCODINGS, FILELIST.JS, OPENFOLDER.JS
	async checkFiles() { // MAYBE LATER, WHEN CAN MANAGE ENCODE/DECODE URI
		const tree = this.getTree(true);
		for (let x of tree[2]) {
			const check = await fs(x[1][0] + x[1][1]).exists();
			debugManager.log("checked: " + x[1][0] + x[1][1] + " = " + (check ?? "null"));
		}
	}
	*/
	
	applyRegex() {
		const folders = this.list.querySelectorAll(".mnbm-folder");
		folders.forEach((e) => { e.firstChild.textContent = this.regexManager.format(e.path) });
	}
	
	pathSplit(path) {
		const split = [""];
		for (let i = 0; i < path.length - 1; i++) {
			split[split.length - 1] += path[i];
			if (path[i] == "/" && path[i + 1] != "/") split.push("");
		}
		split[split.length - 1] += path.slice(-1);
		return split;
	}
	
	splitReduce(split, from = 0, to = split.length) { return split.slice(from, to).reduce((a, b) => a + b, "") }
}

class BookmarkPlugin {
	#fsData;
	#data = { plugin: { version: "1.2.3" }, path: [], file: new Map(), regex: [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]] };
	#file = editorManager.activeFile;
	#buffer = {};
	#array = [];
	#style = tag("style", { type: "text/css", innerHTML: styles });
	#bmManager = new BookmarkManager();
	#dtManager = new DataManager();
	#bmWindow = new BMWindow();
	#showSB;
	#ntfQueue = [];
	
  constructor() {
		if (!this.plugSettings) this.resetSettings();
	}

	async init() {
		const self = this;
		const fsData = this.#fsData = await fs(window.DATA_STORAGE + "bookmark.json");
		if (!await fsData.exists()) await fs(window.DATA_STORAGE).createFile("bookmark.json", JSON.stringify({ plugin: this.#data.plugin, path: [], file: [], regex: this.#data.regex }));
		
		const dataRaw = await fsData.readFile("utf8");
		const data = dataRaw.startsWith('{"p') ? JSON.parse(dataRaw) : this.#data;
		
		if (data.plugin.version != "1.2.3") {
			if (data.file.toString() == "[object Object]") {
				const newDFObj = new Map();
				for (let id in data.file) { newDFObj.set(id, { uri: [0, data.file[id].name], array: data.file[id].array }) }
				data.path = [[0, ""]];
				data.file = newDFObj;
			};
			data.regex = data.regex ?? [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]];
			data.plugin.version = "1.2.3";
			this.resetSettings();
		}
		data.file = new Map(data.file);
		this.#data = data;
		
		const initFiles = editorManager.files;
		this.#buffer[this.#file.id] = [];
		initFiles.forEach((e) => { this.#buffer[e.id] = [...(data.file.get(e.id)?.array ?? [])] });
		this.#file = editorManager.activeFile;
		this.#array = this.#buffer[this.#file.id];
		
		const [bmManager, dtManager, bmWindow] = [this.#bmManager, this.#dtManager, this.#bmWindow];
		
		// SIDE BUTTON //
		this.#showSB = SideButton({
			text: "Bookmark",
			icon: "my-icon",
			onclick() { bmWindow.show() },
			backgroundColor: "#3e4dc4",
			textColor: "#000"
		});
		this.#showSB.show();
		
		// HTML EVENT //
		bmWindow.panel.addEventListener("show", () => {
			bmWindow.setContent(bmManager);
			bmManager.editList(this.#array);
		});
		
		bmWindow.panel.addEventListener("debug", () => { bmWindow.setContent(debugManager) });
		
		// BOOKMARK MANAGER //
		bmManager.controlPanel.addEventListener("click", async (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "toggle":
					const row = editorManager.editor.getSelectionRange().start.row;
					this.toggleBookmark(row);
					return;
				case "save":
					await this.saveData(this.#file);
					this.notify("Bookmark saved");
					return;
				case "load":
					this.#array.splice(0, Infinity, ...(data.file.get(this.#file.id)?.array ?? []));
					bmManager.makeList(this.#array);
					this.updateGutter();
					this.notify("Bookmark loaded");
					return;
				case "file":
					bmWindow.setContent(dtManager);
					return;
			}
		});
		
		bmManager.list.addEventListener("bmclick", (e) => {
			switch (e.detail.action) {
				case "select":
					editorManager.editor.gotoLine(e.detail.row + 1);
					return;
				case "erase":
					const idx = this.#array.indexOf(e.detail.row);
					this.#array.splice(idx, 1);
					bmManager.removeRow(idx);
					editorManager.editor.session.removeGutterDecoration(e.detail.row, "mnbm-gutter");
					return;
			}
		});
		
		// DATA MANAGER
		dtManager.controlPanel.addEventListener("bmtoggle", () => { bmWindow.setContent(dtManager.visible ? dtManager.regexManager : dtManager) });
		
		dtManager.controlPanel.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "back":
					bmWindow.setContent(bmManager);
					bmManager.editList(this.#array);
					return;
				/*
				case "check-files":
					dtManager.checkFiles();
					return;
				*/
			}
		});
		
		dtManager.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "erase":
					//if (data.file.has(target.parentElement.id) data.file.delete(target.parentElement.id);
					dtManager.removeFile(target.parentElement.id);
					this.saveData();
					return;
			}
		});
		
		dtManager.regexManager.list.addEventListener("input", (e) => {
			data.regex = dtManager.regexManager.getRegex();
			dtManager.applyRegex();
		});
		
		// DEBUG MANAGER
		debugManager.controlPanel.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "data":
					debugManager.log(
						data,
						"plugin: " + JSON.stringify(data.plugin),
						"path: " + JSON.stringify(data.path),
						"file: ", ...Array.from(data.file),
						"regex: " + JSON.stringify(data.regex)
					);
					return;
				case "buffer":
					debugManager.log(...Array(this.#buffer));
					return;
				case "file":
					debugManager.log(this.#file.id + " : " + this.#file.uri);
					return;
				case "array":
					debugManager.log(this.#array);
					return;
				case "tree":
					const tree = dtManager.getTree(true);
					debugManager.log(...tree[2], "=>", ...tree[0], ...tree[1]);
					return;
				case "clear":
					debugManager.list.innerHTML = "";
					return;
			}
		});
		
		// ACE/ACODE EVENT //
		editorManager.editor.on("gutterclick", (e) => {
			const row = e.getDocumentPosition().row;
			this.toggleBookmark(row);
		});
		
		editorManager.on("new-file", (e) => { this.#buffer[e.id] = [...(data.file.get(e.id)?.array ?? [])] });
		
		editorManager.on("file-loaded", (e) => {
			this.#array.splice(0, Infinity, ...(data.file.get(e.id)?.array ?? []));
			bmManager.makeList(this.#array);
			this.updateGutter();
			this.notify("Bookmark loaded");
		});
		
		editorManager.on("switch-file", (e) => {
			this.#buffer[this.#file.id] = this.#array;
			this.#array = this.#buffer[e.id] ?? []/*ERRORCASE*/;
			bmManager.makeList(this.#array);
			this.updateGutter();
			this.#file = e;
			dtManager.tryFocus(this.#file.id);
			//this.notify("Bookmark switched");
		});
		
		//editorManager.on("rename-file", (e) => {});
		
		editorManager.on("save-file", async (e) => {
			await this.saveData(this.#file);
			this.notify("Bookmark saved");
		});
	
		editorManager.on("remove-file", (e) => { if (this.#buffer[e.id])/*!ERRORCASE*/ delete this.#buffer[e.id] });
		
		editorManager.editor.on("change", (e) => {
			if (e.start.row != e.end.row) {
				const newArray = [];
				if (e.action == "insert") {
					this.#array.forEach((row) => { newArray.push(row > e.start.row ? (row + (e.end.row - e.start.row)) : row) });
				} else if (e.action == "remove") {
					this.#array.forEach((row) => { newArray.push(row > e.end.row ? (row - (e.end.row - e.start.row)) : row) });
				};
				this.#array.splice(0, Infinity, ...newArray);
				this.updateGutter();
			};
			if (bmWindow.visible && bmManager.visible) bmManager.editList(this.#array);
		});
		
		bmWindow.attachContent(bmManager, dtManager, dtManager.regexManager, debugManager);
		
		bmManager.makeList(this.#array);
		this.updateGutter();
		
		data.regex.forEach((req) => { dtManager.regexManager.addRegex(...req) });
		
		const tree = [];
		data.file.forEach((v, k) => { tree.push([k, v.uri]) });
		dtManager.setTree(data.path, tree);
		
		document.head.append(this.#style);
		
		this.#onSettingsUpdated();
		//this.notify("ready");
	}

	async destroy() {
		this.#showSB?.hide();
		if (this.#bmWindow) this.#bmWindow.visible = false;
		this.#style?.remove();
		editorManager.editor.commands.removeCommand("readyBookmark");
		editorManager.editor.commands.removeCommand("toggleBookmarkList");
		editorManager.editor.commands.removeCommand("toggleBookmark");
		editorManager.editor.commands.removeCommand("previousBookmark");
		editorManager.editor.commands.removeCommand("nextBookmark");
		if (this.plugSettings) delete settings.value[plugin.id];
		settings.update(true);
	}
	
	addBookmark(row) {
		let idx = 0;
		for (let r of this.#array) {
			if (r >= row) break;
			idx += 1;
		};
		if (this.#array[idx] == row) return;
		this.#array.splice(idx, 0, row);
		this.#bmManager.addRow(row, idx);
	}
	
	toggleBookmark(row) {
		const idx = this.#array.indexOf(row);
		if (idx > -1) {
			this.#array.splice(idx, 1);
			this.#bmManager.removeRow(idx);
			editorManager.editor.session.removeGutterDecoration(row, "mnbm-gutter");
			return;
		};
		this.addBookmark(row);
		editorManager.editor.session.addGutterDecoration(row, "mnbm-gutter");
	}
	
	updateGutter() {
		for (let i = 0; i < editorManager.editor.session.getLength(); i++) { editorManager.editor.session.removeGutterDecoration(i, "mnbm-gutter") }
		this.#array.forEach((row) => { editorManager.editor.session.addGutterDecoration(row, "mnbm-gutter") });
	}
	
	saveTree() {
		const tree = this.#dtManager.getTree();
		const data = { path: tree[0], file: new Map() };
		
		tree[1].forEach((kv) => { data.file.set(kv[0], { uri: kv[1], array: this.#data.file.get(kv[0])?.array ?? []/*ERRORCASE*/ }) });
		this.#data.path = data.path;
		this.#data.file = data.file;
	}
	
	syncData(file, saveLog = false) { // CHECK ERROR
		const ff = this.#dtManager.findFile(file.id);
		const df = this.#data.file.get(file.id);
		if (ff) { // IS LOGGED
			if (df) { // IS SAVED
				if (this.#dtManager.mapRoot(this.#data.path, df.uri[0]) == ff[0] && df.uri[1] == ff[1]) return; // LOGGED = SAVED
				this.#dtManager.removeFile(file.id);
				this.#dtManager.addFile(file.id, file.location ?? "", file.filename ?? "UNNAMED");
			} else if (!saveLog) { // INVALID LOG
				this.#dtManager.removeFile(file.id);
			};
		} else if (!df) { // NOT LOGGED NOR SAVED
			return;
		};
		this.saveTree();
	}
	
	async saveData(file) { // CHECK ERROR
		if (file) {
			if (!this.#data.file.has(file.id)) this.#dtManager.addFile(file.id, file.location ?? "", file.filename ?? "UNNAMED");
			if (this.#array.length == 0) {
				if (this.#data.file.has(file.id)) this.#data.file.delete(file.id);
				this.#dtManager.removeFile(file.id);
			};
			this.syncData(file, true);
			if (this.#data.file.has(file.id)) this.#data.file.get(file.id).array = [...this.#array];
		} else {
			this.saveTree();
		};
		await this.#fsData.writeFile(JSON.stringify({ plugin: this.#data.plugin, path: this.#data.path, file: Array.from(this.#data.file), regex: this.#data.regex }));
	}
	
	#shiftNtfQueue() {
		if (this.#ntfQueue.length == 0) return; // ERRORCASE
		const req = this.#ntfQueue[0];
		const ntf = tag("p", { className: "mnbm-notification", innerText: req[0] });
		document.body.append(ntf);
		setTimeout(() => {
			this.#ntfQueue.shift();
			ntf.remove();
			if (this.#ntfQueue.length > 0) this.#shiftNtfQueue();
		}, req[1]);
	}

	notify(x, t = 1000) {
		this.#ntfQueue.push([x, t]);
		if (this.#ntfQueue.length == 1) this.#shiftNtfQueue();
	}
	
	resetSettings() {
		settings.value[plugin.id] = {
			nextBMCommand: "Ctrl-L",
			prevBMCommand: "Ctrl-J",
			toggleBMCommand: "Ctrl-T",
			toggleBMLCommand: "Ctrl-B",
			sideButton: true,
			panelWidth: "50%",
			panelHeight: "50%",
			debug: false
		};
		settings.update(false)
	}
	
	#onSettingsUpdated() {
		const self = this;
		
		this.#bmWindow.panel.style.width = this.plugSettings.panelWidth;
		this.#bmWindow.panel.style.height = this.plugSettings.panelHeight;
		
		if (this.plugSettings.sideButton) {
			this.#showSB?.show();
		} else {
			this.#showSB?.hide();
		};
		
		this.#bmWindow.debugMode(!!this.plugSettings.debug);

		editorManager.editor.commands.removeCommand("toggleBookmarkList");
		if (this.plugSettings.toggleBMLCommand.length > 0) {
			editorManager.editor.commands.addCommand({
				name: "toggleBookmarkList",
				description: "",
				bindKey: { win: this.plugSettings.toggleBMLCommand },
				exec: () => {
					if (this.#bmWindow.visible) {
						this.#bmWindow.hide();
						return;
					};
					this.#bmWindow.show();
				}
			});
		};

		editorManager.editor.commands.removeCommand("toggleBookmark");
		if (this.plugSettings.toggleBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
				name: "toggleBookmark",
				description: "",
				bindKey: { win: this.plugSettings.toggleBMCommand },
				exec: () => {
					const row = editorManager.editor.getSelectionRange().start.row;
					this.toggleBookmark(row);
				}
			});
		};

		editorManager.editor.commands.removeCommand("nextBookmark");
		if (this.plugSettings.nextBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
				name: "nextBookmark",
				description: "",
				bindKey: { win: this.plugSettings.nextBMCommand },
				exec: () => {
					const row = editorManager.editor.getSelectionRange().start.row;
					for (let r of this.#array) {
						if (r > row) {
							editorManager.editor.gotoLine(r + 1);
							break;
						};
					}
				}
			});
		};

		editorManager.editor.commands.removeCommand("previousBookmark");
		if (this.plugSettings.prevBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
				name: "previousBookmark",
				description: "",
				bindKey: { win: this.plugSettings.prevBMCommand },
				exec: () => {
					const row = editorManager.editor.getSelectionRange().start.row;
					for (let r of this.#array) {
						if (r < row) {
							editorManager.editor.gotoLine(r + 1);
							break;
						};
					}
				}
			});
		};
	}

	get settingsObj() {
		return {
			list: [
				{
					key: "panelWidth",
					text: "Set panel width.",
					value: this.plugSettings.panelWidth,
					prompt: "width",
					promptType: "text"
				},
				{
					key: "panelHeight",
					text: "Set panel height.",
					value: this.plugSettings.panelHeight,
					prompt: "height",
					promptType: "text"
				},
				{
					key: "sideButton",
					text: "Show SideButton",
					checkbox: !!this.plugSettings.sideButton,
					info: ``
				},
				{
					key: "debug",
					text: "debug",
					checkbox: !!this.plugSettings.debug,
					info: ``
				},
				{
					key: "toggleBMLCommand",
					text: "[Command]: Toggle Bookmark list.",
					value: this.plugSettings.toggleBMLCommand,
					prompt: "Command",
					promptType: "text"
				},
				{
					key: "toggleBMCommand",
					text: "[Command]: Toggle Bookmark.",
					value: this.plugSettings.toggleBMCommand,
					prompt: "Command",
					promptType: "text"
				},
				{
					key: "prevBMCommand",
					text: "[Command]: Go to previous Bookmark.",
					value: this.plugSettings.prevBMCommand,
					prompt: "Command",
					promptType: "text"
				},
				{
					key: "nextBMCommand",
					text: "[Command]: Go to next Bookmark.",
					value: this.plugSettings.nextBMCommand,
					prompt: "Command",
					promptType: "text"
				}
			],
			cb: (key, value) => {
				this.plugSettings[key] = value;
				settings.update();
				this.#onSettingsUpdated();
			}
		};
	}

	get plugSettings() { return settings.value[plugin.id] }
}

if (window.acode) {
	const bookmarkPlugin = new BookmarkPlugin();
	acode.setPluginInit(
		plugin.id,
		async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
			if (!baseUrl.endsWith("/")) baseUrl += "/";
			bookmarkPlugin.baseUrl = baseUrl;
			await bookmarkPlugin.init($page, cacheFile, cacheFileUrl);
		},
		bookmarkPlugin.settingsObj
	);
	acode.setPluginUnmount(plugin.id, bookmarkPlugin.destroy);
};
