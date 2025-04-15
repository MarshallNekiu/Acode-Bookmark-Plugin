
import plugin from "../plugin.json";
import styles from "./styles.scss";

const fs = acode.require("fsOperation");
const settings = acode.require("settings");
const SideButton = acode.require("sideButton");
const alert = acode.require("alert");

class Debugger {
	
	constructor () {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
			<button class="mnbm-debug-data" data-action="data"> Data </button>
			<button class="mnbm-debug-buffer" data-action="buffer"> Buffer </button>
			<button class="mnbm-debug-file" data-action="file"> File </button>
			<button class="mnbm-debug-array" data-action="array"> Array </button>
		`;
		this.list = tag("ul", {className: "mnbm-list"});
		this.visible = false;
		
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
	
	log(x) {
		const li = tag("li", {
			className: "mnbm-item",
			prefixNode: tag("p", { className: "mnbm-prefix" }),
			textNode: tag("p", { className: "mnbm-text" })
		});
		li.append(li.prefixNode, li.textNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
		this.list.append(li);
		li.prefixNode.innerText = (this.list.childElementCount - 1);
		li.textNode.innerText = x;
		li.textNode.scrollLeft = 100000;
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
	}
	
	align() {
		const w = this.list.lastElementChild.prefixNode.offsetWidth;
		var e = this.list.firstElementChild;
		while (e) {
			e.prefixNode.style.width = w + "px";
			e = e.nextElementSibling;
		}
	}
}

const debugManager = new Debugger();

const [signalShow, signalHide] = [new Event("show"), new Event("hide")];

class BMWindow {
	
	constructor () {
		this.panel = tag("section", { className: "mnbm-window" });
		this.panel.innerHTML = `
			<div class="mnbm-content">
				<div class="mnbm-header">
					<div class="mnbm-drag"> </div>
					<div class="mnbm-control-panel"> </div>
					<button class="mnbm-close"> X </button>
				</div>
				<div class="mnbm-body">
					<div class="mnbm-container">
						<ul class="mnbm-list"> </ul>
					</div>
				</div>
			</div>
			<div class="mnbm-bg"> </div>
		`;
		this.visible = false;
		
		this.panel.querySelector(".mnbm-drag").addEventListener("touchmove", async (e) => this.onTouchMoved(e));
		this.panel.querySelector(".mnbm-bg").addEventListener("touchmove", async (e) => this.onTouchMoved(e));
		this.panel.querySelector(".mnbm-close").addEventListener("click", (e) => this.hide());
	}
	
	show() {
		if (!this.visible) document.body.append(this.panel);
		this.visible = true;
		this.panel.dispatchEvent(signalShow);
	}
	
	hide() {
		if (this.visible) this.panel.remove();
		this.visible = false;
		this.panel.dispatchEvent(signalHide);
	}
	
	async onTouchMoved(event) {
		const x = (event.touches[0].clientX / (this.panel.offsetWidth * 2));
		const y = ((event.touches[0].clientY + this.panel.offsetHeight / 2 - 16) / (this.panel.offsetHeight * 2));
		this.panel.style.left = x * 100 +  "%";
		this.panel.style.top = y * 100 + "%";
	}
	
	setContent(controlPanel, list) {
		this.panel.querySelector(".mnbm-control-panel").replaceWith(controlPanel);
		this.panel.querySelector(".mnbm-list").replaceWith(list);
	}
}

class BookmarkManager {
	
	constructor () {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
			<button class="mnbm-toggle" data-action="toggle"> ⇌ </button>
			<button class="mnbm-save" data-action="save"> ↑ </button>
			<button class="mnbm-load" data-action="load"> ↓ </button>
			<button class="mnbm-file" data-action="file"> ≡ </button>
		`;
		this.list = tag("ul", {className: "mnbm-list"});
		this.visible = false;
	}
	
	newItem(row) {
		const li = tag("li", {
			className: "mnbm-item",
			prefixNode: tag("p", { className: "mnbm-prefix" dataset: { action: "select" }, innerText: row ? `${row + 1}` : "1" }),
			textNode: tag("p", { className: "mnbm-text", dataset: { action: "select" }, innerText: row ? editorManager.activeFile.session.getLine(row) : "" })
		});
		li.append(li.prefixNode, li.textNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
		return li;
	}
	
	addItem(row, idx) {
		const last = this.list.childElementCount;
		this.list.append(this.newItem(row));
		if (idx != last) this.moveItem(last, idx); 
	}
	
	getItem(idx) { return this.list.children.item(idx) }
	
	getItemRow(itm) { return parseInt(itm.prefixNode.innerText) }
	
	setItemRow(itm, row) {
		itm.prefixNode.innerText = row + 1;
		itm.textNode.innerText = editorManager.activeFile.session.getLine(row);
	}
	
	moveItem(bgn, fnsh) {
		const chn = this.list.children;
		this.list.insertBefore(chn.item(bgn), chn.item(fnsh));
	}
	
	makeList(array) {
		var newList = [];
		this.list.innerHTML = ""
		for (let i = 0; i < array.length; i++) { newList.push(this.newItem()) }
		this.list.append(...newList);
		if (this.visible) this.editList(array);
	}
	
	editList(array) {
		const chn = this.list.children;
		for (let i = 0; i < array.length; i++) { this.setItemRow(chn.item(i), array[i]) }
	}
}

const signalChanged = new Event("regexchange");
   
class RegexManager {
	
	constructor() {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
			<button class="mnbm-back" data-action="back"> ≪ </button>
			<button class="mnbm-regex-add" data-action="regex-add"> (+.*) </button>
		`;
		this.list = tag("ul", { className: "mnbm-list" });
		this.visible = false;
		
		this.controlPanel.lastElementChild.addEventListener("click", (e) => { this.addRegex() });
		
		this.list.addEventListener("click", async (e) => {
			const target = e.target.closest("[data-action]");
			if (!target) return;
			
			switch (target.dataset.action) {
				case "erase":
					target.parentElement.remove();
					return;
			}
		});
		
		this.list.addEventListener("dbclick", async (e) => {
			const target = e.target.closest(".mnbm-item");
			if (!target) return;
			
			if (target.disabled) {
				target.style.opacity = 0.5;
				target.disabled = false;
				return;
			};
			target.style.opacity = 1;
			target.disabled = true;
		});
	}
	
	addRegex(rgx = "", sm = "") {
		const li = tag("li", {
			className: "mnbm-item",
			disabled: false,
			regexNode: tag("input", { placeholder: "RegEx: e.g com\\.termux" }),
			sliceNode: tag("input", { placeholder: "SliceMatch: e.g ::" })
		});
		li.append(li.regexNode, li.sliceNode, tag("button", { className: "mnbm-erase", dataset: { action: "erase" }, innerText: "X" }));
		this.list.append(li);
		li.regexNode.value = rgx;
		li.sliceNode.value = sm;
	}
	
	getRegex() {
		const chn = this.list.children;
		const arr = [];
		for (let i = 0; i < chn.length; i++) { arr.push([chn[i].regexNode.value, chn[i].sliceNode.value]) }
		return arr;
	}
	
	format(x) {
		const chn = this.list.children;
		for (let i = 0; i < chn.length; i++) {
			if (chn.item(i).disabled) continue;
			const r = new RegExp(chn.item(i).regexNode.value);
			if (x.search(r) > -1) x = x.split(chn.item(i).sliceNode.value).pop(); // if (r.test(x))
		}
	  return x;
	}
}

class DataManager {
	
	constructor () {
		this.controlPanel = tag("div", { className: "mnbm-control-panel" });
		this.controlPanel.innerHTML = `
			<button class="mnbm-back" data-action="back"> ≪ </button>
			<button class="mnbm-check-files" data-action="check-files"> (...) </button>
			<button class="mnbm-regex-visible" data-action="regex-visible"> (.*) </button>
		`;
		this.list = tag("ul", { className: "mnbm-list" });
		this.focus;
		this.regexManager = new RegexManager();
		this.visible = false;
		
		this.controlPanel.lastElementChild.addEventListener("click", (e) => { this.toggleRegex() });
		this.regexManager.controlPanel.firstElementChild.addEventListener("click", (e) => { this.toggleRegex() });
	}
	
	addFile(id, loc, fn) {
		const arrLoc = this.pathSplit(loc);
		const folder = this.getFolder(this.list, arrLoc, 0, true);
		const file = this.newFile(id, fn);
		folder.append(file);
		this.sortFolder(folder, this.sortFolder(folder.parentElement, this.sortFolder(this.list);
	}
	
	newFolder(path) { return tag("ul", { className: "mnbm-folder", "path": path, innerText: this.regexManager.format(path) }) }
	
	newFile(id, name) {
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
	
	sliceFolder(folder, deep) {
		const fPath = this.pathSplit(folder.dataset.path);
		const lPath = this.splitReduce(fPath, 0, deep);
		const rPath = this.splitReduce(fPath, deep);
		const lFolder = this.newFolder(lPath);
		folder.parentElement.insertBefore(lFolder, folder);
		lFolder.append(folder);
		folder.path = rPath;
		folder.firstChild.textContent = this.regexManager.format(rPath);
	}
	
	removeFile(file) { // CHECK WITH REMOVE_FILE_LOGIC.PNG
		var folder = file.parentElement;
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
			folder = parent?.parentElement;
			break;
		}
	}
	
	tryFocus(id) {
		const files = this.list.querySelectorAll(".mnbm-file");
		if (this.focus) this.focus.style.background = this.focus.invalid ? "#c8141433" : "#ffffff66";
		this.focus = null;
		for (let i = 0; i < files.length; i++) {
			if (files[i].id == id) {
				this.focus = files[i];
				const focused = this.focus.id == editorManager.activeFile.id;
				if (focused) this.focus.style.background = "#c8c8ff66";
				return;
			};
		}
	}
	
	toggleRegex() {
		if (!this.visible && !this.regexManager.visible) return;
		if (this.regexManager.visible) {
			this.regexManager.controlPanel.replaceWith(this.controlPanel);
			this.regexManager.list.replaceWith(this.list);
			this.applyRegex();
		} else {
			this.controlPanel.replaceWith(this.regexManager.controlPanel);
			this.list.replaceWith(this.regexManager.list);
		}
		this.regexManager.visible = !this.regexManager.visible;
		this.visible = !this.visible;
	}
	
	getFile(id) {
		const files = this.list.querySelectorAll(".mnbm-file");
		for (let i = 0; i < files.length; i++) { if (files[i].id == id) return files[i] }
		return null;
	}
	
	getFolder(fromFolder, arrLoc, idxLoc, create = false) {
		var folder = fromFolder.firstElementChild;
		
		while (folder) {
			const FOLDER_PREV = folder.parentElement;
			const FOLDER_NEXT = folder.nextElementSibling;
			const FOLDER_DEEP = folder.firstElementChild;
			
			if (folder.className != "mnbm-folder") {
				if (!FOLDER_NEXT) {
					if (!create) return null;
					folder = this.newFolder(this.splitReduce(arrLoc, idxLoc));
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
						this.sliceFolder(folder, i + 1);
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
							folder = this.newFolder(this.splitReduce(arrLoc, idxLoc));
							FOLDER_PREV.append(folder);
							return folder; // NEW SIBLING PATH
						};
						folder = FOLDER_NEXT;
						break;
					};
					this.sliceFolder(folder, i);
					folder.parentElement.append(this.newFolder(this.splitReduce(arrLoc, idxLoc + i)));
					return folder.parentElement.lastElementChild; // NEW IN-BETWEEN FOLDER
				};
			}
		}
		if (!create) return null;
		folder = this.newFolder(this.splitReduce(arrLoc, idxLoc));
		fromFolder.append(folder);
		return folder;
	}
	
	sortFolder(...folders) {
		const folder = folders.shift();
		if (!folder) return;
		const children = folder.children;
		const folders = [];
		const files = [];
		for (let i = 0; i < children.length; i++) {
			if (children[i].className == "mnbm-folder") {
				folders.push(children[i]);
				continue;
			};
			files.push(children[i]);
		}
		folders.sort((a, b) => a.path.localeCompare(b.path));
		files.sort((a, b) => a.textNode.innerText.localeCompare(b.textNode.innerText));
		for (let i = 0; i < files.length; i++) { folder.append(files[i]) }
		for (let i = 0; i < folders.length; i++) { folder.append(folders[i]) }
		this.sortFolder(folders);
	}
	
	filePath(file) {
		var folder = file.parentElement;
		var path = "";
		while (folder.parentElement.className == "mnbm-folder") {
			path = folder.path + path;
			folder = folder.parentElement;
		}
		return path;
	};
	
	getTree(uri = false) {
		const files = this.list.querySelectorAll(".mnbm-file");
		const map = [];
		for (let i = 0; i < files.length; i++) {
			var folder = files[i].parentElement;
			var path = "";
			while (folder.className == "mnbm-folder") {
				path = folder.path + path;
				folder = folder.parentElement;
			}
			
			map.push([files[i].id, [i, path, files[i].textNode.innerText]]);
		}
		
		if (uri) return map;
		
		const tree = new Map();
		
		for (let i = 0; i < map.length; i++) {
			var x = true;
			for (let j = i - 1; j >= 0; j--) {
				if (map[i][1][1].startsWith(map[j][1][1])) {
					tree.set(map[i][0], [j, map[i][1][1].slice(map[j][1][1].length), map[i][1][2]]);
					x = false;
					break;
				};
			}
			if (x) tree.set(map[i][0], [i, map[i][1][1], map[i][1][2]]);
		}
		return tree;
	}
		
	setTree(tree) {
		this.list.innerHTML = "";
		const map = Array.from(tree);
		
		for (let i = 0; i < map.length; i++) {
			if (map[i][1][0] == i) {
				this.addFile(map[i][0], map[i][1][1], map[i][1][2]);
				continue;
			};
			var path = "";
			var j = i;
			while (map[j][1][0] != j) {
				path = map[j][1][1] + path;
				j = map[j][1][0];
			}
			path = map[j][1][1] + path;
			this.addFile(map[i][0], path, map[i][1][2]);
		}
	}
	
	checkFiles() {
		const t = this.getTree(true);
		alert(JSON.stringify(t));
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
		for (let i = 0; i < folders.length; i++) { folders[i].firstChild.textContent = this.regexManager.format(folders[i].path) }
	}
	
	pathSplit(path) {
		const split = [""];
		for (let i = 0; i < path.length; i++) {
			split[split.length - 1] += path[i];
			if (path[i] == "/" && path.length - 1 != i && path[i + 1] != "/") split.push("");
		}
		return split;
	}
	
	splitReduce(split, from = 0, to = split.length) { return split.slice(from, to).reduce((a, b) => a + b, "") }
}

class BookmarkPlugin {
	
  constructor() {
  	this.nn = "bm";
    this.fsData;
    this.data = { plugin: { version: "1.2.3" }, file: new Map(), regex: [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]] };
    this.file = editorManager.activeFile;
    this.buffer = {};
    this.array = [];
    this.style = document.createElement("style");
    this.bmManager = new BookmarkManager();
    this.dtManager = new DataManager();
    this.debugManager = new Debugger();
    this.window = new BMWindow();
    this.showSB;
    
    if (!settings.value[plugin.id]) {
      settings.value[plugin.id] = {
        nextBMCommand: "Ctrl-L",
        prevBMCommand: "Ctrl-J",
        toggleBMCommand: "Ctrl-T",
        toggleBMLCommand: "Ctrl-B",
        sideButton: true
      };
    };
  }

  async init() {
  	//alert("init");
    const self = this;
    const fsData = this.fsData = await fs(window.DATA_STORAGE + "bookmark.json");
    if (!await fsData.exists()) await fs(window.DATA_STORAGE).createFile("bookmark.json", JSON.stringify({ plugin: this.data.plugin, file: [], regex: this.data.regex }));
    
    const dataRaw = await fsData.readFile("utf8");
    const data = dataRaw.startsWith('{"p') ? JSON.parse(dataRaw) : this.data;
    
    if (data.plugin.version != "1.2.3") {
     	if (data.file.toString() == "[object Object]") {
			if (data.path) delete data.path;
			const newDFObj = new Map();
			for (let id in data.file) {
				newDFObj.set(id, { uri: [0, "", data.file[id].name], array: data.file[id].array });
			}
			data.file = newDFObj;
		};
	 	data.regex = data.regex ?? [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]];
     	data.plugin.version = "1.2.3";
    }
	data.file = new Map(data.file);
    this.data = data;
    //alert("data");
    const initFiles = editorManager.files;
    this.buffer[this.file.id] = [];
    for (let i = 0; i < initFiles.length; i++) {
		this.buffer[initFiles[i].id] = [...(data.file.get(initFiles[i].id)?.array ?? [])];
    }
    this.file = editorManager.activeFile;
    this.array = this.buffer[this.file.id];
    
    const [bmManager, dtManager, debugManager, bmWindow] = [this.bmManager, this.dtManager, this.debugManager, this.window];

    //SIDE BUTTON
    this.showSB = SideButton({
      text: "Bookmark",
      icon: "my-icon",
      onclick() {
      	bmWindow.show();
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    this.showSB.show();
    
    const debugSB = SideButton({
      text: "debug",
      icon: "my-icon",
      onclick() {
      	if (!bmWindow.visible) document.body.append(bmWindow.panel);
        bmWindow.setContent(debugManager.controlPanel, debugManager.list);
      	bmWindow.visible = true;
        bmManager.visible = false;
        dtManager.visible = false;
        dtManager.regexManager.visible = false;
        debugManager.visible = true;
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    debugSB.show();
    //alert("buttons");
    //EVENTS
    editorManager.editor.on("gutterclick", (e) => {
      const row = e.getDocumentPosition().row;
      this.toggleLine(row);
    });
    
    bmWindow.panel.addEventListener("hide", () => {
      bmManager.visible = false;
      dtManager.visible = false;
      dtManager.regexManager.visible = false;
      debugManager.visible = false;
    });
    
    bmWindow.panel.addEventListener("show", () => {
    	bmWindow.setContent(bmManager.controlPanel, bmManager.list);
      	bmManager.visible = true;
        dtManager.visible = false;
        dtManager.regexManager.visible = false;
        debugManager.visible = false;
        bmManager.editList(this.array);
    });
  	//alert("ev0");
  	//BOOKMARK MANAGER
    bmManager.controlPanel.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "toggle":
          const row = editorManager.editor.getSelectionRange().start.row;
          this.toggleLine(row);
          return;
        case "save":
			const f = this.file;
			if (this.data.file.has(f.id)) {
				this.data.file.set(f.id, { uri: this.data.file.get(f.id).uri, array: [...this.array] });
			} else {
				dtManager.addFile(f.id, f.location, f.filename);
				const tree = dtManager.getTree();
				tree.forEach((v, k) => {
					this.data.file.set(k, { uri: v, array: this.data.file.get(k)?.array ?? [] });
				});
				this.data.file.get(f.id).array = [...this.array];
			};
			if (this.array.length == 0) {
				this.data.file.delete(f.id);
				dtManager.removeFile(dtManager.getFile(f.id));
			};
			this.data.regex = this.dtManager.regexManager.getRegex();
			this.dtManager.applyRegex();
			await this.saveData();
			this.notify("Bookmark saved");
			return;
        case "load":
          this.array = [...(data.file.get(this.file.id)?.array ?? [])];
          bmManager.makeList(this.array);
          this.updateGutter();
          this.notify("Bookmark loaded");
          return;
        case "file":
          bmWindow.setContent(dtManager.controlPanel, dtManager.list);
          dtManager.applyRegex();
          bmManager.visible = false;
          dtManager.visible = true;
          dtManager.regexManager.visible = false;
          debugManager.visible = false;
          return;
      }
    });

    bmManager.list.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;
      const row = bmManager.getItemRow(target.parentElement);

      switch (target.dataset.action) {
        case "select":
			editorManager.editor.gotoLine(row + 1);
			return;
        case "erase":
			const idx = this.array.indexOf(row);
			this.array = [...this.array.slice(0, idx), ...this.array.slice(idx + 1)];
			editorManager.editor.session.removeGutterDecoration(row, "mnbm-gutter");
			target.parentElement.remove();
			return;
      }
    });
    //alert("ev1");
    //DATA MANAGER
    dtManager.controlPanel.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "back":
			bmWindow.setContent(bmManager.controlPanel, bmManager.list);
	      	bmManager.visible = true;
	        dtManager.visible = false;
	        dtManager.regexManager.visible = false;
	        debugManager.visible = false;
	        bmManager.editList(this.array);
          return;
        case "check-files":
        	dtManager.checkFiles();
        	return;
      }
    });
    
    dtManager.list.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
          data.file.delete(target.parentElement.dataset.id);
          dtManager.removeFile(target.parentElement);
          this.saveData();
          return;
      }
    });
    
    dtManager.regexManager.list.addEventListener("input", (event) => {
    	data.regex = dtManager.regexManager.getRegex();
    	dtManager.applyRegex();
    });
    
    //DEBUG MANAGER
    debugManager.controlPanel.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "data":
          debugManager.log(JSON.stringify({plugin: this.data.plugin, file: Array.from(this.data.file), regex: this.data.regex}));
          return;
        case "buffer":
          debugManager.log(JSON.stringify(this.buffer));
          return;
        case "file":
          debugManager.log(this.file.id + " : " + this.file.uri);
          return;
        case "array":
          debugManager.log(this.array);
          return;
      }
    });
    //alert("eve");
    //EDITOR EVENTS
    editorManager.on("new-file", (e) => {
      //debugManager.log("new-file: " + e.id + " : " + e.filename);
      this.buffer[e.id] = [...(data.file.get(e.id)?.array ?? [])];
    });

    editorManager.on("file-loaded", (e) => {
      //debugManager.log("file-loaded: " + e.id + " : " + e.filename);
      this.array = [...(data.file.get(e.id)?.array ?? [])];
      bmManager.makeList(this.array);
      this.updateGutter();
      this.notify("Bookmark loaded");
    });
    
    const last_rename = { id: this.file.id, location: this.file.location, name: this.file.filename };

    editorManager.on("switch-file", async (e) => {
      //debugManager.log(`switch-file: ${this.file.filename} => ${e.filename}`);
      this.buffer[this.file.id] = [...this.array];
      this.array = [...this.buffer[e.id]];
      bmManager.makeList(this.array);
      this.updateGutter();
      this.file = e;
      last_rename.id = this.file.id;
      last_rename.location = this.file.location;
      last_rename.name = this.file.filename;
      dtManager.tryFocus(this.file.id);
      //if (dtManager.visible) dtManager.reLoad(this.data.file);
      this.notify("Bookmark switched"); // : " + "Files: " + infi.length + " uri: " + this.file.uri + " || " + this.getFormattedPath(this.file.uri), 5000);
    });

    editorManager.on("rename-file", async (e) => {
      debugManager.log("rename-file: " + last_rename.id + " : " + last_rename.name + " => " + e.id + " : " + e.filename);
      /*
      if (data.file[last_rename.id]) {
        data.file[e.id] = { uri: [-1, e.location, e.filename], array: [...data.file[last_rename.id].array] };
        if (!(last_rename.id == e.id)) delete data.file[last_rename.id];
        data.regex = this.dtManager.regexManager.getRegex();
        await fsData.writeFile(JSON.stringify(data));
      }
      if (data.file[e.id]) data.file[e.id].uri = [-1, e.location, e.filename];
      this.buffer[e.id] = [...this.buffer[last_rename.id]];
      if (!(last_rename.id == e.id)) delete this.buffer[last_rename.id];
      if (dtManager.visible) dtManager.reLoad(data.file);
      this.file = e;
      last_rename.id = this.file.id;
      last_rename.location = this.file.location;
      last_rename.name = this.file.filename;
      */
      this.notify("Bookmark renamed");
    });

    editorManager.on("save-file", async (e) => {
		const f = this.file;
		if (this.data.file.has(f.id)) {
			this.data.file.set(f.id, { uri: this.data.file.get(f.id).uri, array: [...this.array] });
		} else {
			dtManager.addFile(f.id, f.location, f.filename);
			const tree = dtManager.getTree();
			tree.forEach((v, k) => {
				this.data.file.set(k, { uri: v, array: this.data.file.get(k)?.array ?? [] });
			});
			this.data.file.get(f.id).array = [...this.array];
		};
		if (this.array.length == 0) {
			this.data.file.delete(f.id);
			dtManager.removeFile(dtManager.getFile(f.id));
		};
		await this.saveData();
		this.notify("Bookmark saved");
    });

    editorManager.on("remove-file", (e) => {
      //debugManager.log("remove-file: " + e.id + " : " + e.filename);
      if (this.buffer[e.id]) delete this.buffer[e.id];
    });
    //alert("ch");
    editorManager.editor.on("change", (e) => {
      if (e.start.row != e.end.row) {
        var newArray = [];
        if (e.action == "insert") {
          for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] > e.start.row) {
              newArray.push(this.array[i] + (e.end.row - e.start.row));
              continue;
            }
            newArray.push(this.array[i]);
          }
        } else if (e.action == "remove") {
          for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] > e.end.row) {
              newArray.push(this.array[i] - (e.end.row - e.start.row));
              continue;
            }
            newArray.push(this.array[i]);
          }
        }
        this.array = newArray;
        this.updateGutter();
        //debugManager.log(JSON.stringify(e));
      }
      if (bmManager.visible) bmManager.writeList(this.array);
    });

    bmManager.makeList(this.array);
    this.updateGutter();
    //alert("r0");
    for (let i = 0; i < data.regex.length; i++) {
    	dtManager.regexManager.addRegex(data.regex[i][0], data.regex[i][1]);
    }
    const tree = new Map();
    data.file.forEach((v, k) => {
    	debugManager.log(k + " : " + JSON.stringify(v));
    	tree.set(k, v.uri);
    	debugManager.log(tree.get(k));
    });
    //alert("r1", JSON.stringify([Array.from(tree), Array.from(data.file)]));
    dtManager.setTree(tree);
    //alert("r1b", data.file.toString());
    /*const inF = editorManager.files;
    debugManager.log(inF + " - " + initFiles);
    for (let i = 0; i < inF.length; i++) {
    	debugManager.log(inF[i].id);
    	debugManager.log(inF[i].filename);
    	debugManager.log(inF[i].location);
    	debugManager.log(`${ data.file.get(inF[i].id) }`);
    	if (!data.file.has(inF[i].id)) continue;
    	dtManager.removeFile(dtManager.getFile(inF[i].id));
    	dtManager.addFile(inF[i].id, inF[i].location, inF[i].filename);
    }
    //alert("r2");
    const tree2 = dtManager.getTree();
    tree2.forEach((v, k) => {
    	data.file.get(k).uri = v;
    });*/
    //alert("r3");
    const style = this.style;
    style.type = "text/css";
    style.innerHTML = styles;
    document.head.append(style);
    
    this.updateSettings();

    this.notify("Bookmark Ready");
  }

  async destroy() {
    editorManager.editor.commands.removeCommand("readyBookmark");
    editorManager.editor.commands.removeCommand("toggleBookmarkList");
    editorManager.editor.commands.removeCommand("toggleBookmark");
    editorManager.editor.commands.removeCommand("previousBookmark");
    editorManager.editor.commands.removeCommand("nextBookmark");
    delete settings.value[plugin.id];
    settings.update(true);
    this.showSB.hide();
    this.window.hide();
    this.style.remove();
  }

  notify(x, t = 1000) {
    const ntf = tag("p", { className: "mnbm-notification" });
    ntf.innerText = x;
    document.body.append(ntf);
    setTimeout(() => ntf.remove(), t);
  }

  addLine(ln) {
    if (this.array.includes(ln)) return;
    var newArray = [];

    for (let i = 0; i < this.array.length; i++) {
      if (this.array[i] > ln) break;
      newArray.push(this.array[i]);
    }
    newArray.push(ln);
    this.array = newArray.concat(this.array.slice(newArray.length - 1));
    this.bmManager.addItem(ln, newArray.length - 1);
  }
  
  toggleLine(ln) {
  	const idx = this.array.indexOf(ln);
  	if (idx >= 0) {
      this.array = this.array.slice(0, idx).concat(this.array.slice(idx + 1));
      this.bmManager.getItem(idx).remove();
      editorManager.editor.session.removeGutterDecoration(ln, "mnbm-gutter");
    } else {
      this.addLine(ln);
      editorManager.editor.session.addGutterDecoration(ln, "mnbm-gutter");
    }
  }
  /*
  indent(e) {}

  dedent(e) {}

  movedent(e) {}
  */
  updateGutter() {
    for (let i = 0; i < editorManager.editor.session.getLength(); i++) {
      editorManager.editor.session.removeGutterDecoration(i, "mnbm-gutter");
    }
    for (let i = 0; i < this.array.length; i++) {
      editorManager.editor.session.addGutterDecoration(this.array[i], "mnbm-gutter");
    }
  }
  
  getUnformattedData(map) {
  	
  }
  
  async formatData(ufData, checkFiles = false) {
  	const baseArr = [];
  	const newArr = [];
  	
  	this.data.file.forEach((v, k) => {
  		const uri = v.uri;
  		if (uri[0] == -1) {
  			newArr.push([...uri, k]);
  		} else {
  			baseArr.push([...uri, k]);
  		};
  	});
  	
  	this.debugManager.list.innerHTML = "";
  	
  	//this.debugManager.log("Base")
  	for (let i = 0; i < baseArr.length; i++) {
  		//this.debugManager.log(baseArr[i]);
  	}
  	//this.debugManager.log("New");
  	for (let i = 0; i < newArr.length; i++) {
  		//this.debugManager.log(newArr[i]);
  	}
  	
  	const pathArr = [];
  	
  	for (let i = 0; i < baseArr.length; i++) {
  		if (baseArr[i][0] == i) continue;
  		var newPath = baseArr[i][1];
  		var k = baseArr[i][0];
  		
  		for (let j = i - 1; j >= 0; j--) {
  			if (j != k) continue;
  			k = baseArr[j][0];
  			newPath = baseArr[j][1] + newPath;
  			if (j == k) break;
  		}
  		pathArr.push([i, newPath]);
  	}
  	for (let i = 0; i < pathArr.length; i++) {
  		baseArr[pathArr[i][0]][1] = pathArr[i][1]
  	}
  	for (let i = 0; i < newArr.length; i++) {
  		baseArr.push(newArr[i]);
  	}
  	
  	baseArr.sort((a, b) => a[2].localeCompare(b[2]));
  	baseArr.sort((a, b) => a[1].localeCompare(b[1]));
  	
  	//this.debugManager.log("BaseOrg");
  	
  	for (let i = 0; i < baseArr.length; i++) {
  		//this.debugManager.log(baseArr[i]);
  	}
  	
  	const formArr = [];
  	const commonSubstring = (str1, str2) => {
	    let res = '';
	    for (let i = 0; i < str1.length; i++) {
	        if (!str2.startsWith(res + str1[i])) {
	            break;
	        }
	        res += str1[i];
	    }
	    return res;
		};
		const longestCommonSubstring = (str1, str2) => {
	    for (let i = str1.length; i > 0; i--) {
        if (str1.slice(0, i) == str2) return str2;
	    }
	    return null;
		};
		const commonArr = [];
		
		for (let i = 0; i < baseArr.length; i++) {
			for (let j = 0; j < baseArr.length; j++) {
				const cs = longestCommonSubstring(baseArr[i][1], baseArr[j][1]) ?? "";
				if (!commonArr.includes(cs)) commonArr.push(cs);
			}
		}
		
		commonArr.sort();
		//this.debugManager.log("Common: " + commonArr.length);
		for (let i = 0; i < commonArr.length; i++) {
			//this.debugManager.log(commonArr[i]);
		}
		
		for (let i = 0; i < baseArr.length; i++) {
			var x = true;
			
			for (let j = i - 1; j >= 0; j--) {
				if (baseArr[i][1].startsWith(baseArr[j][1])) {
					formArr.push([j, baseArr[i][1].slice(baseArr[j][1].length), baseArr[i][2], baseArr[i][3], formArr[j][4] + (formArr[j][1] == "" ? "" : "----")]);
					x = false;
					break;
				}
			}
			if (x) formArr.push([i, baseArr[i][1], baseArr[i][2], baseArr[i][3], ""]);
		}
		
		this.debugManager.log("Format");
		
		const newFile = new Map();
  	
  	for (let i = 0; i < formArr.length; i++) {
  		newFile.set(formArr[i][3], { uri: formArr[i].slice(0, 3), arr: this.data.file.get(formArr[i][3]).array });
  		//this.data.file[formArr[i][3]].uri = formArr[i].slice(0, 3);
  		if (formArr[i][1] != "") {
  			this.debugManager.log(/*i + "||" + formArr[i][0] + "||" +*/ formArr[i][4] + formArr[i][1]);
  			this.debugManager.log(/*i + "||" + formArr[i][0] + "||" +*/ formArr[i][4] +"----" + formArr[i][2]);
  			continue;
  		}
  		this.debugManager.log(/*i + "||" + formArr[i][0] + "||" +*/ formArr[i][4] + formArr[i][2]);
  	}
  	
  	//this.debugManager.log("newFile");
  	
  	newFile.forEach((v, k) => {
  		//this.debugManager.log(v.uri);
  	});
  	
  	this.debugManager.align();
  	this.data.file = newFile;
  }
  
  async removeData(id) {
  	//remap uri
  	//delete
  	//save
  }
  
  setData(id, arr, loc, fn) {
  	this.data.file.set(id, { uri: this.data.file.get(id)?.uri ?? [-1, loc, fn], array: [...arr] });
    if (arr.length == 0) delete this.data.file[id];
  }

  async saveData() {
  	const tree = this.dtManager.getTree();
  	tree.forEach((v, k) => {
  		tree.set(k, { uri: v, array: this.data.file.get(k)?.array ?? [] });
  	});
  	this.data.regex = this.dtManager.regexManager.getRegex();
  	this.data.file = tree;
    await this.fsData.writeFile(JSON.stringify({ plugin: this.data.plugin, file: Array.from(tree), regex: this.data.regex }));
  }

  updateSettings() {
    const self = this;
    if (this.plugSettings.sideButton) {
      this.showSB.show();
    } else {
      this.showSB.hide();
    }

    editorManager.editor.commands.removeCommand("toggleBookmarkList");
    if (this.plugSettings.toggleBMLCommand.length > 0) {
      editorManager.editor.commands.addCommand({
        name: "toggleBookmarkList",
        description: "",
        bindKey: { win: this.plugSettings.toggleBMLCommand },
        exec: async () => {
          if (this.window.visible) {
            this.window.hide();
            this.bmManager.visible = false;
            this.dtManager.visible = false;
            this.dtManager.regexManager.visible = false;
            this.debugManager.visible = false;
            return;
          }
          this.window.show();
        }
      });
    }

    editorManager.editor.commands.removeCommand("toggleBookmark");
    if (this.plugSettings.toggleBMCommand.length > 0) {
      editorManager.editor.commands.addCommand({
        name: "toggleBookmark",
        description: "",
        bindKey: { win: this.plugSettings.toggleBMCommand },
        exec: () => {
          const row = editorManager.editor.getSelectionRange().start.row;
          this.toggleLine(row);
        }
      });
    }

    editorManager.editor.commands.removeCommand("nextBookmark");
    if (this.plugSettings.nextBMCommand.length > 0) {
      editorManager.editor.commands.addCommand({
        name: "nextBookmark",
        description: "",
        bindKey: { win: this.plugSettings.nextBMCommand },
        exec: () => {
          const row = editorManager.editor.getSelectionRange().start.row;
          for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] > row) {
              editorManager.editor.gotoLine(this.array[i] + 1);
              break;
            }
          }
        }
      });
    }

    editorManager.editor.commands.removeCommand("previousBookmark");
    if (this.plugSettings.prevBMCommand.length > 0) {
      editorManager.editor.commands.addCommand({
        name: "previousBookmark",
        description: "",
        bindKey: { win: this.plugSettings.prevBMCommand },
        exec: () => {
          const row = editorManager.editor.getSelectionRange().start.row;
          for (let i = this.array.length - 1; i >= 0; i--) {
            if (this.array[i] < row) {
              editorManager.editor.gotoLine(this.array[i] + 1);
              break;
            }
          }
        }
      });
    }
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
      	//alert(k, v);
        this.plugSettings[key] = value;
        settings.update();
        this.updateSettings();
      }
    };
  }

  get plugSettings() {
    return settings.value[plugin.id];
  }
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
}
