
//import utils from "./utils.js";
import RegexManager from "./regex_manager.js";

export default class DataManager {
	
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
	
	newFile(id, fn) {
		const e = tag("div", { className: "mnbm-file", dataset: { id: id, invalid: "false" } });
		e.innerHTML = `
			<p class="mnbm-prefix"> </p>
			<p class="mnbm-text"> </p>
			<button class="mnbm-erase" data-action="erase"> X </button>
		`;
		e.firstElementChild.innerText = "-1";
		e.children.item(1).innerText = fn;
		return e;
	}
	
	addFile(id, loc, fn) {
		const arrLoc = this.pathSplit(loc);
		const newFile = this.newFile(id, fn);
		var folder = this.list.firstElementChild;
		if (!folder) {
			folder = tag("ul", { className: "mnbm-folder", innerText: this.regexManager.format(loc), dataset{ path: loc } });
			folder.append(newFile); /* SCSS .mnbm-file { display: block // FOR UL.LOC } */
			this.list.append(folder);
			return;
		};
		var idxLoc = 0;
		while (folder) {
			const fpath = this.pathSplit(folder.dataset.path);
			var deepPath = false;
			for (let i = 0; i < fpath.length; i++) {
				if (idxLoc + i == arrLoc.length - 1) {
					if (i == fpath.length - 1) { // EXACT PATH
						folder.append(newFile);
						return;
					};
					//IN BETWEEN PATH
					this.insertFile(newFile, folder, i);
					return;
				};
				if (arrLoc[idxLoc + i] != fpath[i]) { // IN BETWEEN PATH
					this.insertFile(newFile, folder, i);
					return;
				};
				if (i == fpath.length - 1) deepPath = true;
			}
			if (deepPath) {
				folder = folder.firstElementChild;
				idxLoc += fpath.length;
				continue;
			};
			folder = folder.nextElementSibling;
		}
		folder = tag("ul", { className: "mnbm-folder", innerText: this.regexManager.format(loc), dataset: { path: loc } });
		folder.append(newFile);
		this.list.append(folder);
	}
	
	insertFile(file, folder, deep) {
		const fPath = this.pathSplit(folder.dataset.path);
		const nfPath = fPath.slice(deep).reduce((a, b) => a + b, "");
		const parentPath = fPath.slice(0, deep).reduce((a, b) => a + b, "");
		const parentFolder = tag("ul", { className: "mnbm-folder", innerText: this.regexManager.format(parentPath), dataset: { path: parentPath } });
		folder.replaceWith(parentFolder);
		parentFolder.append(file, folder);
		folder.dataset.path = nfPath;
		folder.innerText = this.regexManager.format(nfPath);
	}
	
	removeFile(file) {
		var folder = file.parentElement;
		if (folder.childElementCount > 1) {
			file.remove();
			return;
		};
		while (folder.childElementCount <= 1 && folder.parentElement.className == "mnbm-folder") { folder = folder.parentElement }
		folder.remove();
	}
	
	tryFocus(id) {
		const files = this.list.querySelectorAll(".mnbm-file");
		if (this.focus) this.focus.style.background = this.focus.dataset.invalid == "true" ? "#c8141433" : "#ffffff66";
		this.focus = null;
		for (let i = 0; i < files.length; i++) {
			if (files[i].dataset.id == id) {
				this.focus = files[i];
				const focused = this.focus.dataset.id == editorManager.activeFile.id;
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
		} else {
			this.controlPanel.replaceWith(this.regexManager.controlPanel);
			this.list.replaceWith(this.regexManager.list);
		}
		this.regexManager.visible = !this.regexManager.visible;
		this.visible = !this.visible;
	}
	
	getFile(id) {
		const files = this.list.querySelectorAll(".mnbm-file");
		for (let i = 0; i < files.length; i++) {
			if (files[i].dataset.id == id) return files[i];
		}
		return null;
	}
	
	fileText(file) { return file.children.item(1).innerText }
	
	pathSplit(path) {
		const split = [""];
		for (let i = 0; i < path.length - 1; i++) {
			split[-1] += path[i];
			if (path[i] == "/" && != path[i + 1] == "/") split.push([""]);
		}
		return split;
	}
}