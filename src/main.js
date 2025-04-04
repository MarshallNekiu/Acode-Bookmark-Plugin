
/*
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
		"ID": {name: filename, path_idx = -1, array: []},
		"ID": {name: filename, path_idx = -1, array: []},
		"ID": {name: filename, path_idx = -1, array: []}
	}
}
*/

import plugin from '../plugin.json';
import styles from './styles.scss';
import BookmarkManager from './bookmark_manager.js';
import DataManager from './data_manager';
import Debugger from './debugger.js';

const settings = acode.require("settings");
const fs = acode.require('fsOperation');
const SideButton = acode.require('sideButton');
const alert = acode.require("alert");

class BookmarkPlugin {
	
	constructor () {
		this.fsData;
		this.data = {plugin: {version: "1.2.0"}, path: [], file: {}};
		this.buffer = {};
		this.file = editorManager.activeFile;
		this.last_rename = {id: this.file.id, name: this.file.filename};
		this.array = [];
		this.clipArray = []; //relative to start.row
		this.style = document.createElement('style');
		this.overlay = tag("div", {className: "mnbm-overlay"});
		this.bmManager = new BookmarkManager();
		this.dtManager = new DataManager();
		this.debugManager = new Debugger();
		this.addSB;
		this.showSB;
		this.gutter = [];
		this.inputRequest = {pressed: false, origin: {x: 0, y: 0}}
		if (!settings.value[plugin.id]) {
        settings.value[plugin.id] = {
        	sideButton: true,
          showBMCommand: "B",
          toggleBMCommand: "T",
          prevBMCommand: "J",
          nextBMCommand: "L"
        };
        settings.update(false);
        //alert("BookmarkPlugin", "FirstInit", () => {});
    }
	}
	
	async init() {
		const self = this;
		const link = {ready: false};
		const readySB = SideButton({
		  text: 'readyBM',
		  icon: 'my-icon',
		  onclick() {
		  	self.ready(link);
		  	readySB.hide();
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		readySB.show();
		
		const rF = () => {
			//alert("rf", "");
			editorManager.editor.commands.removeCommand("readyBookmark");
			if (link.ready) {
				settings.off("update", rF);
				//alert("rfend", "");
				return
			}
			if (self.plugSettings.showBMCommand.length > 0) {
				editorManager.editor.commands.addCommand({
			    name: "readyBookmark",
			    description: "",
			    bindKey: { win: "Ctrl-" + self.plugSettings.showBMCommand[0] },
			    exec: () => {
			      self.ready(link);
			      readySB.hide();
			      editorManager.editor.commands.removeCommand("readyBookmark");
			    	settings.off("update", rF);
			    },
			  });
			}
		};
		rF();
		settings.on("update", rF);
		
	}
	
	updateSettings() {
		const self = this;
		if (self.plugSettings.sideButton) {
			self.showSB.show();
		} else {
			self.showSB.hide();
		};
		
		editorManager.editor.commands.removeCommand("showBookmarkList");
		if (self.plugSettings.showBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
		    name: "showBookmarkList",
		    description: "",
		    bindKey: { win: "Ctrl-" + self.plugSettings.showBMCommand[0] },
		    exec: () => {
		    	if (self.getPanel()) {
		    		self.removePanel();
		    		self.bmManager.visible = false;
		    		self.dtManager.visible = false;
		    		self.debugManager.visible = false;
		    		return;
		    	}
		      self.addPanel(self.bmManager.panel);
			  	self.bmManager.visible = true;
		  		self.dtManager.visible = false;
			  	self.debugManager.visible = false;
			  	self.bmManager.writeList([...self.array]);
		    },
		  });
		}
		
	  editorManager.editor.commands.removeCommand("toggleBookmark");
		if (self.plugSettings.toggleBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
		    name: "toggleBookmark",
		    description: "",
		    bindKey: { win: "Ctrl-" + self.plugSettings.toggleBMCommand[0] },
		    exec: () => {
		      const row = editorManager.editor.getSelectionRange().start.row;
					if (self.array.includes(row)) {
						var newArray = [];
			  		for (let i = 0; i < self.array.length; i++) {
			  			if (self.array[i] != row) {
			  				newArray.push(self.array[i]);
			  			} else {
			  				self.bmManager.removeItem(i);
			  			}
			  		}
			  		self.array = newArray;
					} else {
						self.addLine(row);
					}
		  		self.upateGutter();
		    },
		  });
		}
		
		editorManager.editor.commands.removeCommand("nextBookmark");
		if (self.plugSettings.nextBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
		    name: "nextBookmark",
		    description: "",
		    bindKey: { win: "Ctrl-" + self.plugSettings.nextBMCommand[0] },
		    exec: () => {
		      const row = editorManager.editor.getSelectionRange().start.row;
					for (let i = 0; i < self.array.length; i++) {
						if (self.array[i] > row) {
							editorManager.editor.gotoLine(self.array[i] + 1);
							break;
						}
					}
		    },
		  });
		}
		
		editorManager.editor.commands.removeCommand("previousBookmark");
		if (self.plugSettings.prevBMCommand.length > 0) {
			editorManager.editor.commands.addCommand({
		    name: "previousBookmark",
		    description: "",
		    bindKey: { win: "Ctrl-" + self.plugSettings.prevBMCommand[0] },
		    exec: () => {
		      const row = editorManager.editor.getSelectionRange().start.row;
					for (let i = self.array.length - 1; i >= 0; i--) {
						if (self.array[i] < row) {
							editorManager.editor.gotoLine(self.array[i] + 1);
							break;
						}
					}
		    },
		  });
		}
	}
	
	async ready(link) {
		link.ready = true;
		//alert("ready", "");
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
  	this.last_rename = {id: this.file.id, name: this.file.filename};
  	this.array = [...this.buffer[this.file.id]];
  	this.upateGutter();
  	
  	const style = this.style;
	  style.type = 'text/css';
	  style.innerHTML = styles;
		document.head.append(style);
		
		const [overlay, bmManager, dtManager, debugManager] = [this.overlay, this.bmManager, this.dtManager, this.debugManager];
		
		bmManager.setList(this.array);
  	
  	//SIDE BUTTON
  	this.addSB = SideButton({
		  text: 'addBM',
		  icon: 'my-icon',
		  onclick() {
		  	const row = editorManager.editor.getSelectionRange().start.row;
		  	self.addLine(row);
		  	self.upateGutter();
		  	self.notify(`New bookmark: ${row + 1}`);
		  },
		  backgroundColor: '#3ec440',
		  textColor: '#000',
			}
		);
		//this.addSB.show();
		
		this.showSB = SideButton({
		  text: 'Bookmark',
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
		//debugSB.show();
		
		//PANEL EVENTS
		bmManager.panelTop.addEventListener("click", async (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "add":
		  		const row = editorManager.editor.getSelectionRange().start.row;
					if (this.array.includes(row)) {
						var newArray = [];
			  		for (let i = 0; i < this.array.length; i++) {
			  			if (this.array[i] != row) {
			  				newArray.push(this.array[i]);
			  			} else {
			  				bmManager.removeItem(i);
			  			}
			  		}
			  		this.array = newArray;
					} else {
						this.addLine(row);
					}
		  		this.upateGutter();
			  	return;
		  	case "save":
		  		await this.saveData();
		  		this.notify("Bookmark saved");
		  		return
		  	case "load":
		  		this.array = [...(this.data.file[this.file.id] ?? {array: []}).array];
					bmManager.setList(this.array);
	    		this.upateGutter();
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
		  		this.upateGutter();
		  		e.target.parentElement.remove();
		  		return
  		}
		});
		
		dtManager.panelTop.addEventListener("click", (e) => {
			const target = e.target.closest("[data-action]");
		  if (!target) return;
		  
		  switch(target.dataset.action) {
		  	case "back":
		  		this.removePanel();
		  		this.addPanel(bmManager.panel);
		  		bmManager.visible = true;
		  		dtManager.visible = false;
		  		debugManager.visible = false;
		  		return;
		  	case "close":
		  		this.removePanel();
	    		dtManager.visible = false;
		  		return;
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
		  		debugManager.log(this.file.id + " : " + this.file.filename);
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
	  
	  //EDITOR EVENTS
		editorManager.on("new-file", (e) => {
			//debugManager.log("new-file: " + e.id + " : " + e.filename);
			this.buffer[e.id] = [...(data.file[e.id] ?? {array: []}).array];
		});
		
		editorManager.on("file-loaded", (e) => {
			//debugManager.log("file-loaded: " + e.id + " : " + e.filename);
			this.array = [...(this.data.file[e.id] ?? {array: []}).array];
			this.upateGutter();
			bmManager.setList(this.array);
  		this.notify("Bookmark loaded");
		});
		
		editorManager.on("switch-file", async (e) => {
			//debugManager.log(`switch-file: ${this.file.filename} => ${e.filename}`);
			this.buffer[this.file.id] = [...this.array];
			this.array = [...this.buffer[e.id]];
			bmManager.setList([...this.array]);
			this.upateGutter();
			this.file = e;
			this.last_rename = {id: this.file.id, name: this.file.filename};
			this.notify("Bookmark switched");
		});
		
		editorManager.on("rename-file", async (e) => {
			//debugManager.log("rename-file: " + this.last_rename.id + " : " + this.last_rename.name + " => " + e.id + " : " + e.filename);
			if (this.data.file[this.last_rename.id]) {
				this.data.file[e.id] = {path_idx: -1, name: e.filename, array: [...this.data.file[this.last_rename.id].array]};
				if (!(this.last_rename.id == e.id)) delete this.data.file[this.last_rename.id];
  			await this.fsData.writeFile(JSON.stringify(this.data));
			}
			if (this.data.file[e.id]) {
				this.data.file[e.id].name = e.filename;
			}
			this.buffer[e.id] = [...this.buffer[this.last_rename.id]];
			if (!(this.last_rename.id == e.id)) delete this.buffer[this.last_rename.id];
			if (this.dtManager.visible) this.dtManager.reLoad(this.data.file);
			this.file = e;
			this.last_rename = {id: this.file.id, name: this.file.filename};
			this.notify("Bookmark renamed")
		});
		
		editorManager.on("save-file", async (e) => {
			//debugManager.log("save-file: " + e.id + " : " + e.filename);
			await this.saveData();
			this.notify("Bookmark saved");
		});
		
		editorManager.on("remove-file", (e) => {
			//debugManager.log("remove-file: " + e.id + " : " + e.filename);
			if (this.buffer[e.id]) delete this.buffer[e.id];
		});
		
		editorManager.editor.on("gutterclick", (e) => {
			const row = e.getDocumentPosition().row;
			if (this.array.includes(row)) {
				var newArray = [];
	  		for (let i = 0; i < this.array.length; i++) {
	  			if (this.array[i] != row) {
	  				newArray.push(this.array[i]);
	  			} else {
	  				bmManager.removeItem(i);
	  			}
	  		}
	  		this.array = newArray;
			} else {
				this.addLine(row);
			}
  		this.upateGutter();
		});
		
	  editorManager.editor.on('change', (e) => {
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
	    	for (let i = 0; i < editorManager.editor.session.getLength(); i++) {
	    		editorManager.editor.session.removeGutterDecoration(i, "mnbm-gutter");
	    	}
	    	for (let i = 0; i < this.array.length; i++) {
	    		editorManager.editor.session.addGutterDecoration(this.array[i], "mnbm-gutter");
	    	}
	    	//debugManager.log(JSON.stringify(e));
	    }
	    if (bmManager.visible) bmManager.writeList(this.array);
		});
		
		//settings.on("update", this.updateSettings);
		this.updateSettings();
		
		this.notify("Bookmark Ready")
  }
  
  async destroy() {
  	editorManager.editor.commands.removeCommand("readyBookmark");
  	editorManager.editor.commands.removeCommand("showBookmarkList");
  	editorManager.editor.commands.removeCommand("toggleBookmark");
  	editorManager.editor.commands.removeCommand("previousBookmark");
  	editorManager.editor.commands.removeCommand("nextBookmark")
  	//settings.off("update", this.updateSettings);
  	delete settings.value[plugin.id];
    settings.update(true);
  	//alert("Bookmark", "Destroy", () => {});
    this.addSB.hide();
    this.showSB.hide();
    if (this.getPanel()) this.removePanel();
    this.style.remove();
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
	
	upateGutter() {
		for (let i = 0; i < editorManager.editor.session.getLength(); i++) {
  		editorManager.editor.session.removeGutterDecoration(i, "mnbm-gutter");
  	}
  	for (let i = 0; i < this.array.length; i++) {
  		editorManager.editor.session.addGutterDecoration(this.array[i], "mnbm-gutter");
  	}
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
		this.data.file[this.file.id] = {path_idx: -1, name: this.file.filename, array: [...this.array]};
		if (this.array.length == 0) delete this.data.file[this.file.id];
		if (this.dtManager.visible) this.dtManager.reLoad(this.data.file);
  	await this.fsData.writeFile(JSON.stringify(this.data));
	}
	
	get settingsObj() {
      return {
          list: [
              {
                  key: "sideButton",
                  text: "Enable SideButton",
                  checkbox: !!this.plugSettings.sideButton,
                  info: ``
              },
              {
                  key: "showBMCommand",
                  text: "Ctrl + [key]: Show Bookmark list.",
                  value: this.plugSettings.showBMCommand,
                  prompt: "Key",
                  promptType: "text"
              },
              {
                  key: "toggleBMCommand",
                  text: "Ctrl + [key]: Toggle Bookmark.",
                  value: this.plugSettings.toggleBMCommand,
                  prompt: "Key",
                  promptType: "text"
              },
              {
                  key: "prevBMCommand",
                  text: "Ctrl + [key]: Go to previous Bookmark.",
                  value: this.plugSettings.prevBMCommand,
                  prompt: "Key",
                  promptType: "text"
          	 },
             {
                  key: "nextBMCommand",
                  text: "Ctrl + [key]: Go to next Bookmark.",
                  value: this.plugSettings.nextBMCommand,
                  prompt: "Key",
                  promptType: "text"
          	 }
          ],
          cb: (key, value) => {
              this.plugSettings[key] = value;
              settings.update();
              this.updateSettings()
              //acode.alert(key + " : " + value, "Please restart acode");
          }
      };
  }

  get plugSettings() {
      return settings.value[plugin.id];
  }
	
}

if (window.acode) {
  const bookmarkPlugin = new BookmarkPlugin();
  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) baseUrl += '/';
    bookmarkPlugin.baseUrl = baseUrl;
    await bookmarkPlugin.init($page, cacheFile, cacheFileUrl);
  },
  bookmarkPlugin.settingsObj);
  acode.setPluginUnmount(plugin.id, bookmarkPlugin.destroy);
}
