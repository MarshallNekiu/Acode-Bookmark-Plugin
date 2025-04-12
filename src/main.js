
//DEFORMAT ON LOAD
//FORMAT FOR SAVE
//FIND FOLDER  WITH path.split("/")

import plugin from "../plugin.json";
import BookmarkManager from "./bookmark_manager.js";
import DataManager from "./data_manager";
import Debugger from "./debugger.js";
import BMWindow from "./window.js";
import styles from "./styles.scss";

const fs = acode.require("fsOperation");
const settings = acode.require("settings");
const SideButton = acode.require("sideButton");

class BookmarkPlugin {
	
  constructor() {
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
    
    if (!settings.value[plugin.id] || !settings.value[plugin.id].version == "1.2.3") {
      settings.value[plugin.id] = {
      	version: "1.2.3",
        nextBMCommand: "Ctrl-L",
        prevBMCommand: "Ctrl-J",
        toggleBMCommand: "Ctrl-T",
        toggleBMLCommand: "Ctrl-B",
        sideButton: true
      };
    };
  }

  async init() {
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
				newDFObj.set(id, { uri: [-1, "", data.file[id].name], array: data.file[id].array });
			}
			data.file = newDFObj;
		};
     	data.regex = data.regex ?? [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]];
     	data.plugin.version = "1.2.3";
    } else {
		data.file = new Map(data.file);
    };
    this.data = data;
    
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
			if (!this.data.file.has(f.id)) dtManager.addItem(f.id, f.location, f.filename);
			this.data.file.set(f.id, { uri: this.data.file.get(f.id)?.uri ?? [-1, f.location, f.filename], array: [...this.array] });
			if (this.array.length == 0) {
				delete this.data.file[f.id];
				dtManager.removeItem(f.id);
			};
			this.setData(this.file.id, this.file.array, this.file.location, this.file.filename);
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
    
    //DATA MANAGER
    dtManager.controlPanel.addEventListener("click", async (e) => {
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
        	this.formatData(true);
        	return;
      }
    });

    dtManager.list.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
          data.file.delete(target.parentElement.dataset.id);
          target.parentElement.remove();
          data.regex = dtManager.regexManager.getRegex();
          await fsData.writeFile(JSON.stringify({ plugin: data.plugin, file: this.mapToI(data.file), regex: data.regex }));
          return;
      }
    });
    
    dtManager.regexManager.list.addEventListener("input", (event) => {
    	data.regex = dtManager.regexManager.getRegex();
    	debugManager.log(event.data);
    }))
    
    //DEBUG MANAGER
    debugManager.controlPanel.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "data":
          debugManager.log(JSON.stringify({plugin: this.data.plugin, file: this.mapToI(this.data.file), regex: this.data.regex}));
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
      //if (dtManager.visible) dtManager.reLoad(this.data.file);
      this.notify("Bookmark switched"); // : " + "Files: " + infi.length + " uri: " + this.file.uri + " || " + this.getFormattedPath(this.file.uri), 5000);
    });

    editorManager.on("rename-file", async (e) => {
      //debugManager.log("rename-file: " + last_rename.id + " : " + last_rename.name + " => " + e.id + " : " + e.filename);
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
      //debugManager.log("save-file: " + e.id + " : " + e.filename);
      /*const arr = [];
      for (let i = 0; i < 500; i++) {
      	arr.push(i);
      }
      */
      /*
      const dt = {};
      for (let i = 0; i < editorManager.files.length; i++) {
      	dt[editorManager.files[i].id] = { path_idx: -1, name: editorManager.files[i].uri, array: [...arr] };
      }
      data.file = dt;
      */
      await this.saveData();
      this.notify("Bookmark saved");
    });

    editorManager.on("remove-file", (e) => {
      //debugManager.log("remove-file: " + e.id + " : " + e.filename);
      if (this.buffer[e.id]) delete this.buffer[e.id];
    });

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
    
    for (let i = 0; i < data.regex.length; i++) {
    	dtManager.regexManager.addRegex(data.regex[i][0], data.regex[i][1]);
    }
    
    const style = this.style;
    style.type = "text/css";
    style.innerHTML = styles;
    document.head.append(style);
    
    this.updateSettings();
    //const test = await confirm("title", "body");

    this.notify("Bookmark Ready");
  }

  async destroy() {
    editorManager.editor.commands.removeCommand("readyBookmark");
    editorManager.editor.commands.removeCommand("toggleBookmarkList");
    editorManager.editor.commands.removeCommand("toggleBookmark");
    editorManager.editor.commands.removeCommand("previousBookmark");
    editorManager.editor.commands.removeCommand("nextBookmark");
    //settings.off("update", this.updateSettings);
    delete settings.value[plugin.id];
    settings.update(true);
    //this.readySB.hide();
    //this.addSB.hide();
    this.showSB.hide();
    this.window.hide();
    //if (this.getPanel()) this.removePanel();
    this.style.remove();
  }
  
  mapToI(map) {
  	const I = [];
  	map.forEach((v, k) => {
  		I.push([k, v]);
  	});
  	return I;
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
    //this.data.file.set(this.file.id, { uri: this.data.file.get(this.file.id)?.uri ?? [-1, this.file.location, this.file.filename], array: [...this.array] });
    //if (this.array.length == 0) delete this.data.file[this.file.id];
    //if (this.dtManager.visible) this.dtManager.reLoad(this.data.file);
    //this.data.regex = this.dtManager.regexManager.getRegex();
    this.formatData();
    await this.fsData.writeFile(JSON.stringify({ plugin: this.data.plugin, file: this.mapToI(this.data.file), regex: this.data.regex }));
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
          this.window.setContent(bmManager.controlPanel, bmManager.list);
          this.bmManager.visible = true;
          this.dtManager.visible = false;
          this.dtManager.regexManager.visible = false;
          this.debugManager.visible = false;
          this.bmManager.makeList(this.array);
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
	/*
	const td = tag("div", { className: "class", dataset: { uri: "abc" , chg: "012"} });
	alert("dataset", td.className);
	alert("dataset", td.dataset.uri);
	alert("dataset", td.dataset.chg);
	td.dataset.chg = "210";
	alert("dataset", td.dataset.chg);
	delete td.dataset.chg;
	alert("dataset", td.dataset.chg);
	*/
	
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
