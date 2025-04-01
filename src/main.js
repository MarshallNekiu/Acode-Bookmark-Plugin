
//Bookmark Automaton
/*
bookmark.json:
	{
		plugin: {version: "1.2.0"},
		path: [
			path0,
			path1,
				1://subpath0,
				1://subpath1,
					3://subpath0,
			Path2
		]
		file: {
			"ID": {name: path-idx/filename, array: []}
			"ID": {name: path-idx/filename, array: []}
			"ID": {name: path-idx/filename, array: []}
		}
	}
*/

import plugin from '../plugin.json';
import styles from './styles.scss';
import BookmarkManager from './bookmark_manager.js';
import DataManager from './data_manager';
import Debugger from './debugger.js';

const fs = acode.require('fsOperation');
const SideButton = acode.require('sideButton');

class BookmarkPlugin {
	
	constructor () {
		this.fsData;
		this.data = {plugin: {version: "1.2.0"}, path: [], file: {}};
		this.buffer = {};
		this.file = editorManager.activeFile;
		this.array = [];
		this.clipArray = []; //relative to start.row
		this.style = document.createElement('style');
		this.overlay = tag("div", {className: "mnbm-overlay"});
		this.bmManager = new BookmarkManager();
		this.dtManager = new DataManager();
		this.debugManager = new Debugger();this.addSB;
		this.showSB;
	}
	
	async init() {
		const self = this;
		const readySB = SideButton({
		  text: 'BBM',
		  icon: 'my-icon',
		  onclick() {
		  	self.ready();
		  	readySB.hide();
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		readySB.show();
	}
	
	async ready() {
		const self = this;
		const fsData = await fs(window.DATA_STORAGE + "bookmark.json");
  	this.fsData = fsData;
  	if (await fsData.exists() == false) await fs(window.DATA_STORAGE).createFile("bookmark.json", JSON.stringify(this.data));
  	const dataRaw = await fsData.readFile("utf8");
  	const data = dataRaw.startsWith('{"p') ? JSON.parse(dataRaw) : this.data;
  	this.data = data;
  	const initFiles = [...editorManager.files];
  	for (let i = 0; i < initFiles.length; i++) {
  		this.buffer[initFiles[i].id] = [...(data.file[initFiles[i].id] ?? {array: []}).array];
  	}
  	this.file = editorManager.activeFile;
  	this.array = [...this.buffer[this.file.id]];
  	
  	const style = this.style;
	  style.type = 'text/css';
	  style.innerHTML = styles;
		document.head.append(style);
		
		const [overlay, dtManager, debugManager] = [this.overlay, this.dtManager, this.debugManager];
		const bmManager = this.bmManager;
		
		bmManager.setList[this.array]
  	
  	this.addSB = SideButton({
		  text: 'addBM',
		  icon: 'my-icon',
		  onclick() {
		  	const row = editorManager.editor.getSelectionRange().start.row;
		  	self.addLine(row);
		  	self.notify(`New bookmark: ${row + 1}`);
		  },
		  backgroundColor: '#3ec440',
		  textColor: '#000',
			}
		);
		this.addSB.show();
		
		this.showSB = SideButton({
		  text: 'showBM',
		  icon: 'my-icon',
		  onclick() {
		  	self.addPanel(bmManager.panel);
		  	self.bmManager.visible = true;
	  		dtManager.visible = false;
		  	debugManager.visible = false;
		  	bmManager.writeList([...self.array]);
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		this.showSB.show();
		
		const debugSB = SideButton({
		  text: 'debug',
		  icon: 'my-icon',
		  onclick() {
		  	self.addPanel(debugManager.panel);
	  		bmManager.visible = false;
	  		dtManager.visible = false;
	  		debugManager.visible = true;
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		debugSB.show();
		
		bmManager.panelTop.addEventListener("click", async (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "add":
		  		const row = editorManager.editor.getSelectionRange().start.row;
		  		this.addLine(row);
		  		this.notify(`New bookmark: ${row + 1}`);
			  	return;
		  	case "save":
		  		await this.saveData();
		  		this.notify("Bookmark saved");
		  		return
		  	case "load":
		  		this.array = [...(this.data.file[this.file.id] ?? {array: []}).array];
					bmManager.setList(this.array);
		  		this.notify("Bookmark loaded");
		  		return
		  	case "file":
		  		this.addPanel(dtManager.panel);
		  		dtManager.reLoad(data.file);
		  		bmManager.visible = false;
		  		dtManager.visible = true;
		  		return
		    case "close":
		     	this.removePanel();
	    		bmManager.visible = false;
		      return
  		}
		});
		
		bmManager.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  const line = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1)) - 1;
		  
		  switch(target.dataset.action) {
		  	case "select":
		  		editorManager.editor.gotoLine(line);
		  		return
		  	case "erase":
		  		var newArray = [];
		  		for (let i = 0; i < this.array.length; i++) {
		  			if (this.array[i] != line) newArray.push(this.array[i]);
		  		}
		  		this.array = newArray;
		  		e.target.parentElement.remove();
		  		return
  		}
		});
		
		dtManager.panelTop.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "close":
		  		this.removePanel();
	    		dtManager.visible = false;
		  		return
	  	}
		});
		
		dtManager.list.addEventListener("click", async (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "erase":
		  		delete data.file[e.target.parentElement.firstElementChild.innerText];
		  		e.target.parentElement.remove();
			  	await fsData.writeFile(JSON.stringify(this.data));
		  		return
  		}
		});
		
		debugManager.panelTop.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "data":
		  		debugManager.log(JSON.stringify(data));
		  		return;
		  	case "buffer":
		  		debugManager.log(JSON.stringify(this.buffer));
		  		return;
		  	case "file":
		  		debugManager.log(this.file.filename);
		  		return;
		  	case "array":
		  		debugManager.log(this.array);
		  		return;
		  	case "close":
		  		this.removePanel();
		  		debugManager.visible = false;
			  	return;
		  }
	  });
	  
	  debugManager.list.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "erase":
		  		debugManager.unLog(e.target.parentElement);
			  	return;
		  }
	  });
	  
		editorManager.on("new-file", (e) => {
			debugManager.log("new-file: " + e.id + " : " + e.filename);
			this.buffer[e.id] = [...(data.file[e.id] ?? {array: []}).array];
		});
		
		editorManager.on("file-loaded", (e) => {
			debugManager.log("file-loaded: " + e.id + " : " + e.filename);
			this.array = [...(this.data.file[e.id] ?? {array: []}).array];
			bmManager.setList(this.array);
  		this.notify("Bookmark loaded");
		});
		
		editorManager.on("switch-file", async (e) => {
			debugManager.log(`switch-file: ${this.file.filename} => ${e.filename}`);
			this.buffer[this.file.id] = [...this.array];
			this.array = [...this.buffer[e.id]];
			bmManager.setList([...this.array]);
			this.file = e;
			this.notify("Bookmark switched");
		});
		
		editorManager.on("rename-file", (e) => {
			debugManager.log("rename-file: " + e.id + " : " + e.filename);
		});
		
		editorManager.on("save-file", async (e) => {
			debugManager.log("save-file: " + e.id + " : " + e.filename);
			await this.saveData();
			this.notify("Bookmark saved");
		});
		
		editorManager.on("remove-file", (e) => {
			debugManager.log("remove-file: " + e.id + " : " + e.filename);
			if (this.buffer[e.id]) delete this.buffer[e.id];
		});
		
	  editorManager.editor.on('change', (e, ins) => {
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
	    	debugManager.log(JSON.stringify(e));
	    }
	    if (bmManager.visible) bmManager.writeList(this.array);
		});
		
		this.notify("Bookmark Ready")
  }
  
  async destroy() {
    this.style.remove();
    if (this.getPanel()) this.removePanel();
    this.addSB.hide();
    this.showBM.hide();
  }
  
  notify(x) {
  	const ntf = tag("p", {className: "mnbm-notification"});
  	ntf.innerText = x;
  	document.body.append(ntf);
  	setTimeout(() => ntf.remove(), 1000);
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
		this.bmManager.addLine(ln, newArray.length - 1);
	}
	
	indent(e) {
		
	}
	
	dedent(e) {
		
	}
	
	movedent(e) {
		
	}
	
	getPanel() {
		return document.body.querySelector(".mnbm-window");
	}
	
	addPanel(pnl) {
		if (this.getPanel()) this.removePanel();
		document.body.append(pnl, this.overlay);
	}
	
	removePanel() {
		this.getPanel().remove();
		this.overlay.remove()
	}
	
	async saveData() {
		this.data.file[this.file.id] = {name: "-1://" + this.file.filename, array: [...this.array]};
		//if (this.array.length == 0) delete this.data.file[this.file.id];
		//if (dtManager.visible) dtManager.reLoad(this.data.file);
  	await this.fsData.writeFile(JSON.stringify(this.data));
	}
	
}

if (window.acode) {
  const bookmarkPlugin = new BookmarkPlugin();
  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    bookmarkPlugin.baseUrl = baseUrl;
    await bookmarkPlugin.init($page, cacheFile, cacheFileUrl);
  });
  acode.setPluginUnmount(plugin.id, bookmarkPlugin.destroy);
}
