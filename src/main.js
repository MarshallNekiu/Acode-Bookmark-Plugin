
import plugin from "../plugin.json";
import styles from "./styles.scss";

const fs = acode.require("fsOperation");
const settings = acode.require("settings");
const SideButton = acode.require("sideButton");
const alert = acode.require("alert");

class BMWindow {
	static #signalShow = new Event("show");
	static #signalHide = new Event("hide");
	
	#panel = tag("section", { className: "mnbm-window" });
	#content = null;
	
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
		this.panel.querySelector(".mnbm-drag").addEventListener("touchmove", async (e) => this.#onTouchMoved(e));
		this.panel.querySelector(".mnbm-bg").addEventListener("touchmove", async (e) => this.#onTouchMoved(e));
		this.panel.querySelector(".mnbm-close").addEventListener("click", (e) => this.hide());
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
		const x = (event.touches[0].clientX / (this.panel.offsetWidth * 2));
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
				textNode: tag("p", { className: "mnbm-text", innerText: JSON.stringify(log) ?? "invalid log" })
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
		this.controlPanel.innerHTML = `
			<button class="mnbm-back" data-action="back"> ≪ </button>
			<button class="mnbm-check-files" data-action="check-files"> (...) </button>
			<button class="mnbm-regex-visible" data-action="regex-visible"> (.*) </button>
		`;
		this.controlPanel.lastElementChild.addEventListener("click", (e) => { this.controlPanel.dispatchEvent(DataManager.#signalToggle) });
		this.regexManager.controlPanel.firstElementChild.addEventListener("click", (e) => { this.controlPanel.dispatchEvent(DataManager.#signalToggle) });
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
	
	getTree(uri = false) { // [ Map([root_idx, branch]), Map([id, [branch_idx, name]]), #uri = Map([id, [path, name]]) ]
		const folders = this.list.querySelectorAll(".mnbm-folder");
		if (folders.length == 0) return [[], []];
		const paths = [];
		const files = [];
		
		for (let i = 0; i < folders.length; i++) {
			paths.push([folders[i].parentElement.className == "mnbm-folder" ? paths[i - 1][0] : i, folders[i].path]);
			for (let e of folders[i].children) { if (e.className == "mnbm-file") files.push([e.id, [i, e.textNode.innerText]]) }
		}
		if (uri) {
			const arr = [];
			files.forEach((x) => {
				arr.push([x[0], ["", x[1][1]]]);
				let i = x[1][0];
				while (i > paths[i][0]) {
					arr[arr.length - 1][1][0] = paths[i][1] + arr[arr.length - 1][1][0];
					i = paths[i][0];
				}
				arr[arr.length - 1][1][0] = paths[i][1] + arr[arr.length - 1][1][0];
			});
			return [paths, files, arr];
		};
		return [paths, files];
		/*
		const map = [];
		for (let i = 0; i < files.length; i++) {
			let folder = files[i].parentElement;
			let path = "";
			while (folder.className == "mnbm-folder") {
				path = folder.path + path;
				folder = folder.parentElement;
			}
			map.push([files[i].id, [i, path, files[i].textNode.innerText]]);
		}
		
		if (uri) return map;
		
		const tree = new Map();
		*/
		/*
		for (let i = 0; i < map.length; i++) { // APPLY PATH SPLIT
			let x = true;
			for (let j = i - 1; j >= 0; j--) {
				if (map[i][1][1].startsWith(map[j][1][1])) {
					tree.set(map[i][0], [j, map[i][1][1].slice(map[j][1][1].length), map[i][1][2]]);
					x = false;
					break;
				};
			}
			if (x) tree.set(map[i][0], [i, map[i][1][1], map[i][1][2]]);
		}
		*/
		/*
		for (let i = 0; i < map.length; i++) { // APPLY PATH SPLIT //
			let x = true;
			const arrLoc = this.pathSplit(map[i][1][1]);
			for (let j = i - 1; j >= 0; j--) {
				const arrLoc2 = this.pathSplit(map[j][1][1]);
				debugManager.log("i: " + i, [arrLoc, map[i][1][2]], "j: " + j, [arrLoc2, map[j][1][2]]);
				if (map[i][1][1].startsWith(map[j][1][1])) {
					tree.set(map[i][0], [j, map[i][1][1].slice(map[j][1][1].length), map[i][1][2]]);
					x = false;
					break;
				};
			}
			if (x) tree.set(map[i][0], [i, map[i][1][1], map[i][1][2]]);
		}
		debugManager.log(...tree);
		return tree;
		*/
	}
		
	setTree(tree) {
		const [map, queue] = [Array.from(tree), []];
		
		for (let i = 0; i < map.length; i++) {
			if (map[i][1][0] == i) {
				queue.push([map[i][0], map[i][1][1], map[i][1][2]]);
				continue;
			};
			let [path, j] = [map[i][1][1], i];
			
			while (map[j][1][0] != j) {
				j = map[j][1][0];
				path = map[j][1][1] + path;
			}
			queue.push([map[i][0], path, map[i][1][2]]);
		}
		this.list.innerHTML = "";
		queue.forEach((q) => { this.addFile(...q) });
	}
	
	checkFiles() {
		this.getTree();
		//const t = this.getTree(true);
		/*
		const tree = new Map(this.getTree(true));
		alert("tree", Array.from(tree).toString());
		const aF = editorManager.files;
		alert("af", aF.toString());
		for (let i = 0; i < aF.length; i++) {
			if (!tree.has(aF[i].id)) continue;
			this.removeFile(this.getFile(aF[i].id));
			this.addFile(aF[i].id, aF[i].location, aF[i].filename);
		}
		const tree2 = new Map(this.getTree(true));
		*/
	}
	
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
	#data = { plugin: { version: "1.2.3" }, file: new Map(), regex: [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]] };
	#file = editorManager.activeFile;
	#buffer = {};
	#array = [];
	#style = tag("style", { type: "text/css", innerHTML: styles });
	#bmManager = new BookmarkManager();
	#dtManager = new DataManager();
	#bmWindow = new BMWindow();
	#showSB;
	#debugSB;
	#ntfQueue = [];
	
  constructor() {
		if (!this.plugSettings) {
			settings.value[plugin.id] = {
				nextBMCommand: "Ctrl-L",
				prevBMCommand: "Ctrl-J",
				toggleBMCommand: "Ctrl-T",
				toggleBMLCommand: "Ctrl-B",
				sideButton: true
			};
			settings.update(false)
		};
	}

	async init() {
		const self = this;
		const fsData = this.#fsData = await fs(window.DATA_STORAGE + "bookmark.json");
		if (!await fsData.exists()) await fs(window.DATA_STORAGE).createFile("bookmark.json", JSON.stringify({ plugin: this.#data.plugin, file: [], regex: this.#data.regex }));
		
		const dataRaw = await fsData.readFile("utf8");
		const data = dataRaw.startsWith('{"p') ? JSON.parse(dataRaw) : this.#data;
		
		if (data.plugin.version != "1.2.3") {
			if (data.file.toString() == "[object Object]") {
				if (data.path) delete data.path;
				const newDFObj = new Map();
				for (let id in data.file) { newDFObj.set(id, { uri: [0, "", data.file[id].name], array: data.file[id].array }) }
				data.file = newDFObj;
			};
			data.regex = data.regex ?? [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]];
			data.plugin.version = "1.2.3";
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
		
		this.#debugSB = SideButton({
			text: "debug",
			icon: "my-icon",
			onclick() {
				bmWindow.visible = true;
				bmWindow.setContent(debugManager);
			},
			backgroundColor: "#3e4dc4",
			textColor: "#000"
		});
		this.#debugSB.show();
		
		// HTML EVENT //
		bmWindow.panel.addEventListener("show", () => {
			bmWindow.setContent(bmManager);
			bmManager.editList(this.#array);
		});
		
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
					//await this.saveData(this.#file, this.#array);
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
				case "check-files":
					dtManager.checkFiles();
					return;
			}
		});
		
		dtManager.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "erase":
					//data.file.delete(target.parentElement.id);
					dtManager.removeFile(target.parentElement.id);
					//this.saveData();
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
					const [t0, t1] = [dtManager.getTree(), dtManager.getTree(true)];
					debugManager.log(...t1[2], "=>", ...t0[0], ...t0[1]);
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
		
		const last_rename = { id: this.#file.id ?? "", location: this.#file.location ?? "", name: this.#file.filename ?? "" };/* "" => ERRORCASE */
		
		editorManager.on("switch-file", (e) => {
			if (!dtManager.hasFile(e.id)) dtManager.addFile(e.id, e.location ?? "", e.filename ?? "UNNAMED");
			
			this.#buffer[this.#file.id] = this.#array;
			this.#array = this.#buffer[e.id] ?? []/*ERRORCASE*/;
			bmManager.makeList(this.#array);
			this.updateGutter();
			this.#file = e;
			last_rename.id = this.#file.id;
			last_rename.location = this.#file.location;
			last_rename.name = this.#file.filename;
			dtManager.tryFocus(this.#file.id);
			this.notify("Bookmark switched");
		});
		
		settings.on("update", this.#onSettingsUpdated);
		
		bmWindow.attachContent(bmManager, dtManager, dtManager.regexManager, debugManager);
		
		data.regex.forEach((req) => { dtManager.regexManager.addRegex(req[0], req[1]) });
		
		document.head.append(this.#style);
		
		settings.update();
		this.notify("ready");
	}

	async destroy() {
		this.#showSB.hide();
		this.#debugSB.hide();
		this.#bmWindow.visible = false;
		this.#style.remove();
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
	
	#onSettingsUpdated() {
		alert("settings", "update");
	}

	get settingsObj() {
		return {
			list: [
				{
					key: "sideButton",
					text: "Show SideButton",
					checkbox: !!this.plugSettings.sideButton,
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

/*
async init() {
  	const st = tag("style", { type: "text/css", innerHTML: styles });
  	document.head.append(st);
  	this.#bmWindow.show();
  	setTimeout(() => {
  		this.#bmWindow.attachContent(debugManager, this.#bmManager, this.#dtManager, this.#dtManager.regexManager);
  		this.#bmWindow.setContent(debugManager);
  		debugManager.log(...Array(100).fill("log"));
  	}, 500);
  	setTimeout(() => {
  		this.#bmWindow.setContent(this.#bmManager);
  		setTimeout(() => {
	  		for (let i = 0; i <= 100; i++) {
	  			setTimeout(() => {
	  				this.#bmManager.addRow(i * 16, i);
	  			}, i * 1);
	  		}
  		}, 500);
  	}, 1000);
  	setTimeout(() => {
  		this.#bmWindow.setContent(this.#dtManager)
  		const arr = [];
  		arr.push(["id0", "path0/path0/", "nameless"]);
	    arr.push(["id1", "path0/path0/path0/", "nameless1"]);
	    arr.push(["id2", "path0/path0/path0/", "nameless2"]);
	    arr.push(["id3", "path0/path1/", "nameless3"]);
	   	arr.push(["id4", "path0/path1/path0/path1/", "nameless4"]);
	   	arr.push(["id5", "path0/path1/path0/path1/", "nameless5"]);
	   	arr.push(["id6", "path0/path0/", "nameless6"]);
	   	arr.push(["id7", "path0/", "nameless7"]);
	   	for (let i = 1; i <= arr.length; i++) {
	   		setTimeout(() => {
	   			this.#dtManager.addFile(...arr[i - 1]);
	   			//alert("t", [...this.#dtManager.getTree(true), "=>", ...this.#dtManager.getTree()].map((e) => { return JSON.stringify(e) + "<br>" }));
	   		}, i * 1000);
	   	}
  		//alert("rgx", this.#regexManager.format);
  		//this.#regexManager.addRegex("origin", "::");
  		//this.#regexManager.addRegex("path1", "://");
  		setTimeout(() => {
  			//alert("rgx0");
  			//const f = this.#regexManager.format("origin::path0/path1://path0/path1");
  			//alert("rgx2", f ?? "null");
  		}, 5000);
  	}, 2500);
  }
  */