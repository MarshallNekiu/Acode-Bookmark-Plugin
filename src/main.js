
//Bookmark Automaton

import plugin from '../plugin.json';
import styles from './styles.scss';
import Debugger from './debugger.js';
import BookmarkManager from './bookmark_manager.js';
import DataManager from './data_manager';

var fs = acode.require('fsOperation');
var SideButton = acode.require('sideButton');
var alert = acode.require('alert');

var buffer = {}; // {ID: ARRAY}

class BookmarkPlugin {
	
	constructor () {
		this.fsData;
		this.file = editorManager.activeFile;
		this.array = [];
		this.bmManager = new BookmarkManager();
		this.dtManager = new DataManager();
		this.overlay = tag("div", {className: "mnbm-overlay"});
		this.style = document.createElement('style');
		this.addSB;
		this.showSB;
		this.debugManager = new Debugger();
	}
	
	async init() {
		const self = this;
		var fsData = await fs(window.DATA_STORAGE + "bookmark.json");
  	this.fsData = fsData;
  	var dataExist = async () => {
  		if (await fsData.exists() == false) await fs(window.DATA_STORAGE).createFile("bookmark.json", "");
  	};
  	
  	var style = this.style;
	  style.type = 'text/css';
	  style.innerHTML = styles;
		document.head.append(style);
	  
		var overlay = this.overlay;
	  var bmManager = this.bmManager;
	  var dtManager = this.dtManager;
	  var debugManager = this.debugManager;
	  
	  debugManager.panelTop.addEventListener("click", async (e) => {
			var target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "close":
		  		this.removePanel();
			  	return;
		  }
	  });
	  
	  debugManager.list.addEventListener("click", async (e) => {
			var target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "erase":
		  		debugManager.unLogItem(e.target.parentElement);
			  	return;
		  }
	  });
		
		bmManager.panelTop.addEventListener("click", async (e) => {
			var target = e.target.closest("[data-action]");
		  if (!target) return;
		  await dataExist();
		  
		  switch(target.dataset.action) {
		  	case "add":
		  		var row = editorManager.editor.getSelectionRange().start.row;
		  		this.addLine(row);
		  		this.notify(`New bookmark: ${row + 1}`);
			  	return;
		  	case "save":
		  		await this.saveList();
		  		this.notify("Bookmark saved");
		  		return
		  	case "load":
		  		await this.loadList();
		  		this.notify("Bookmark loaded");
		  		return
		  	case "file":
		  		this.addPanel(dtManager.panel);
		  		await dtManager.reLoad(fsData);
		  		bmManager.visible = false;
		  		dtManager.visible = true;
		  		return
		    case "close":
		     	this.removePanel();
	    		bmManager.visible = false;
		      return
  		}
		});
		
		bmManager.list.addEventListener("click", async (e) => {
			var target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "select":
		  		var line = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1)) - 1;
		  		editorManager.editor.gotoLine(line);
		  		return
		  	case "erase":
		  		var line = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1)) - 1;
		  		var newArray = [];
		  		for (var i = 0; i < this.array.length; i++) {
		  			if (this.array[i] != line) newArray.push(this.array[i]);
		  		}
		  		this.array = newArray;
		  		e.target.parentElement.remove();
		  		return
  		}
		});
		
		dtManager.panelTop.addEventListener("click", async (e) => {
			var target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "close":
		  		this.removePanel();
	    		dtManager.visible = false;
		  		return
	  	}
		});
		
		dtManager.list.addEventListener("click", async (e) => {
			var target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "erase":
		  		var idx = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1));
		  		this.eraseList(idx);
		  		return
  		}
		});
		
  	this.addSB = SideButton({
		  text: 'addBM',
		  icon: 'my-icon',
		  onclick() {
		  	var row = editorManager.editor.getSelectionRange().start.row;
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
	  		dtManager.visible = false;
		  	bmManager.visible = true;
		  	for (var i = 0; i < self.array.length; i++) {
    			bmManager.setLine(i, self.array[i]);
		  	}
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		this.showSB.show();
		
		var debugSB = SideButton({
		  text: 'debug',
		  icon: 'my-icon',
		  onclick() {
		  	self.addPanel(debugManager.panel);
	  		dtManager.visible = false;
	  		bmManager.visible = false;
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		debugSB.show();
		
		editorManager.on("switch-file", (e) => {
			debugManager.log(`Switch: ${this.file.filename} => ${e.filename}`);
			this.file = e;
		});
		editorManager.on("rename-file", (e) => {
			debugManager.log("Rename: " + e.id + " : " + e.location + e.filename);
		});
		editorManager.on("new-file", (e) => {
			debugManager.log("New: " + e.id + " : " + e.location + e.filename);
		});
		editorManager.on("remove-file", (e) => {
			debugManager.log("Remove: " + e.id + " : " + e.location + e.filename);
		});
		editorManager.on("file-loaded", (e) => {
			debugManager.log("Loaded: " + e.id + " : " + e.location + e.filename);
		});
		editorManager.on("save-file", (e) => {
			debugManager.log("Saved: " + e.id + " : " + e.location + e.filename);
		});
  	
		editorManager.editor.on('change', (e, ins) => {
	    if (e.start.row != e.end.row) {
	    	var newArray = [];
	    	if (e.action == "insert") {
		    	for (var i = 0; i < this.array.length; i++) {
		    		if (this.array[i] > e.start.row) {
		    			newArray.push(this.array[i] + (e.end.row - e.start.row));
		    			continue;
		    		}
		    		newArray.push(this.array[i]);
		    	}
	    	} else if (e.action == "remove") {
	    		for (var i = 0; i < this.array.length; i++) {
		    		if (this.array[i] > e.end.row) {
		    			newArray.push(this.array[i] - (e.end.row - e.start.row));
		    			continue;
		    		}
		    		newArray.push(this.array[i]);
		    	}
	    	}
	    	debugManager.log(`ID: ${e.id}, Action: ${e.action}`);
	    	debugManager.log(`Start: Row: ${e.start.row}, Column: ${e.start.column}, End: Row: ${e.end.row}, Column: ${e.end.column}`);
	    	debugManager.log(`Lines: ${e.lines}`);
	    	debugManager.log(`Folds: ${e.folds}`);
	    	debugManager.log("Prev array: " + this.array);
	    	debugManager.log("New array: " + newArray);
	    	this.array = newArray;
	    }
	    if (bmManager.visible) {
    		for (var i = e.start.row; i < this.array.length; i++) {
  				this.bmManager.setLine(i, this.array[i]);
    		}
    	}
		});
  }

  async destroy() {
    this.style.remove();
    if (this.getPanel()) this.removePanel();
    this.addSB.hide();
    this.showBM.hide();
  }
  
  notify(x) {
  	var ntf = tag("p", {className: "mnbm-notification"});
  	ntf.innerText = x;
  	document.body.append(ntf);
  	setTimeout(() => ntf.remove(), 1000);
  }
  
  addLine(ln) {
		if (this.array.includes(ln)) return;
		var newArray = [];
		
		for (var i = 0; i < this.array.length; i++) {
			if (this.array[i] > ln) break;
			newArray.push(this.array[i]);
		}
		newArray.push(ln);
		this.array = newArray.concat(this.array.slice(newArray.length - 1));
		this.bmManager.addLine(ln, newArray.length - 1);
	}
	
	getPanel() {
		return document.body.querySelector(".mnbm-window");
	}
	
	addPanel(pnl) {
		if (this.getPanel()) this.removePanel();
		document.body.append(pnl, this.overlay);
	}
	
	removePanel() {
		document.body.querySelector(".mnbm-window").remove();
		this.overlay.remove()
	}
	
	async saveList() {
		if (this.array.length == 0) return;
		var fsdt = this.fsData;
		var bmDataRaw = await fsdt.readFile("utf8");
	 	var bmDataSplit = bmDataRaw.split(";\n");
  	var bmNewData = "";
  	var bmFound = false;
  	var bmfn = (this.file?.location ?? "") + this.file.filename;
  	var bmid = this.file.id;
  	
  	for (var i = 0; i < bmDataSplit.length - 1; i++) {
  		var bmData = JSON.parse(bmDataSplit[i]);
  		if (bmData.id == bmid) {
  			bmData.name = bmfn;
  			bmData.array = this.array;
  			bmFound = true;
  		}
  		bmNewData += JSON.stringify(bmData) + ";\n";
  	}
  	if (!bmFound) bmNewData += JSON.stringify({id: bmid, name: bmfn, array: this.array}) + ";\n";
  	await fsdt.writeFile(bmNewData);
	}
	
	async loadList() {
		var fsdt = this.fsData;
		var bmDataRaw = await fsdt.readFile("utf8");
  	var bmDataSplit = bmDataRaw.split(";\n");
  	var bmNewData = "";
  	var bmFound = false;
  	var bmfn = (this.file?.location ?? "") + this.file.filename;
  	var bmid = this.file.id;
  	
  	for (var i = 0; i < bmDataSplit.length; i++) {
  		if (bmDataSplit[i] == "") continue;
  		var bmData = JSON.parse(bmDataSplit[i]);
  		if (bmData.id == bmid) {
  			bmData.name = bmfn;
				this.array = bmData.array;
  			bmFound = true;
  		}
  		bmNewData += JSON.stringify(bmData) + ";\n";
  	}
  	if (!bmFound) this.array = [];
  	this.bmManager.clear();
		for (var i = 0; i < this.array.length; i++) {
			this.bmManager.addLine(this.array[i], i);
		}
	}
	
	async eraseList(idx) {
		var fsData = this.fsData;
		var bmDataRaw = await fsData.readFile("utf8");
		var bmDataSplit = bmDataRaw.split(";\n");
		var bmNewData = "";
  	
  	for (var i = 0; i < bmDataSplit.length - 1; i++) {
  		if (i == idx) continue;
  		bmNewData += bmDataSplit[i] + ";\n";
  	}
  	this.dtManager.eraseList(idx);
  	await fsData.writeFile(bmNewData);
	}
	
}

if (window.acode) {
  var bookmarkPlugin = new BookmarkPlugin();
  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    bookmarkPlugin.baseUrl = baseUrl;
    await bookmarkPlugin.init($page, cacheFile, cacheFileUrl);
  });
  acode.setPluginUnmount(plugin.id, () => {
    bookmarkPlugin.destroy();
  });
}
