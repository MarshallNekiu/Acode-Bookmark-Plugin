
/*
data.path = [
	[0, path],
		[0, subpath],
		[0, subath],
	[3, path],
		[3, subpath],
	[5, path],
	[6, path],
		[6, subpath],
			[7, subpath],
		[6, subpath],
			[9, subpath]
];

const arr = [
    [-1, "carpeta1/carpeta2", "/archivo1.txt"],
    [-1, "documentos/proyectos/carpetaA", "/archivo2.csv"],
    [-1, "documentos/proyectos/carpetaA", "/archivo3.csv"],
    [-1, "imagenes/carpetaB", "/imagen.jpg"],
    [-1, "proyectos/codigo/funciones/carpetaX", "/archivo3.py"],
    [-1, "proyectos/codigo/funciones/carpetaX", "/archivo4.py"],
    [-1, "videos/peliculas/carpetaC/carpetaD", "/archivo4.mp4"],
    
    [-1, "carpeta1/carpeta2/subcarpeta1", "/archivo5.txt"],
    [-1, "carpeta1/carpeta2/subcarpeta1", "/archivo6.txt"],
    [-1, "carpeta1/carpeta2/subcarpeta2", "/archivo6.txt"],
    [-1, "documentos/proyectos/carpetaA/subcarpetaA", "/archivo7.pdf"],
    [-1, "documentos/proyectos/carpetaA/subcarpetaB", "/archivo8.xlsx"],
    [-1, "imagenes/carpetaB/subcarpeta1", "/imagen2.jpg"],
    [-1, "proyectos/codigo/funciones/carpetaX/subcarpeta1", "/archivo9.py"],
    [-1, "proyectos/codigo/funciones/carpetaX/subcarpeta1", "/archivo10.py"],
    [-1, "proyectos/codigo/funciones/carpetaX/subcarpeta2", "/archivo10.py"],
    [-1, "videos/peliculas/carpetaC/carpetaD/subcarpeta1", "/archivo11.mp4"],
    [-1, "videos/peliculas/carpetaC/carpetaD/subcarpeta2", "/archivo12.mp4"],

    [-1, "carpeta1/carpeta2/subcarpeta1/subsubcarpeta1", "/archivo13.txt"],
    [-1, "carpeta1/carpeta2/subcarpeta1/subsubcarpeta1", "/archivo14.txt"],
    [-1, "carpeta1/carpeta2/subcarpeta2/subsubcarpeta2", "/archivo14.txt"],
    [-1, "documentos/proyectos/carpetaA/subcarpetaA/subsubcarpeta1", "/archivo15.pdf"],
    [-1, "documentos/proyectos/carpetaA/subcarpetaB/subsubcarpeta2", "/archivo16.xlsx"],
    [-1, "imagenes/carpetaB/subcarpeta1/subsubcarpeta1", "/imagen3.jpg"],
    [-1, "proyectos/codigo/funciones/carpetaX/subcarpeta1/subsubcarpeta1", "/archivo17.py"],
    [-1, "videos/peliculas/carpetaC/carpetaD/subcarpeta1/subsubcarpeta1", "/archivo18.mp4"],
    [-1, "videos/peliculas/carpetaC/carpetaD/subcarpeta1/subsubcarpeta1", "/archivo19.mp4"]
]

const shuffle = (array) => {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
};

const sort = (array) => array.sort((a, b) => a[1].localeCompare(b[1]));

shuffle(arr);
sort(arr);

const arr2 = [];

for (let i = 0; i < arr.length; i++) {
	var x = true;
	for (let j = i - 1; j >= 0; j--) {
		if (arr[i][1].includes(arr[j][1)) {
			arr2.push([j, arr[i][1].slice(arr[j][1].length), arr[i][2]]);
			x = false;
			break;
		}
	}
	if (x) {
		arr2.push([i, arr[i][1], arr[i][2]]);
	}
}

JSON.stringify(arr).replaceAll("],", "],\n");
JSON.stringify(arr2).replaceAll("],", "],\n");
*/
/*
for (let i = 0; i < arr.length; i++) {
	break;
	if (arr2.length == i) arr2.push([i, arr[i][1], arr[i][2]]);
	for (let j = i + 1; j < arr.length; j++) {
		if (!(arr[j][1].includes(arr[i][1]))) break;
		arr2.push([i, arr[j][1].slice(arr[i][1].length), arr[j][2]]);
	}
}
*/

import plugin from "../plugin.json";
import BookmarkManager from "./bookmark_manager.js";
import DataManager from "./data_manager";
import Debugger from "./debugger.js";
import BMWindow from "./window.js";
import styles from "./styles.scss";

const fs = acode.require("fsOperation");
const settings = acode.require("settings");
const SideButton = acode.require("sideButton");
const confirm = acode.require("confirm");
const alert = acode.require("alert");

class BookmarkPlugin {
	
  constructor() {
    this.fsData;
    this.data = { plugin: { version: "1.2.3" }, file: {}, path: [], regex = [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]] };
    this.file = editorManager.activeFile;
    this.buffer = { this.file.id: [] };
    this.array = [];
    this.clipArray = []; //relative to start.row
    this.style = document.createElement("style");
    this.bmManager = new BookmarkManager();
    this.dtManager = new DataManager();
    this.debugManager = new Debugger();
    this.window = new BMWindow();
    this.showSB;
    
    if (!settings.value[plugin.id] || !settings.value[plugin.id].toggleBMLCommand) {
      settings.value[plugin.id] = {
        nextBMCommand: "Ctrl-L",
        prevBMCommand: "Ctrl-J",
        toggleBMCommand: "Ctrl-T",
        toggleBMLCommand: "Ctrl-B",
        sideButton: true
      };
      settings.update(false);
    }
  }

  async init() {
    const self = this;
    const fsData = await fs(window.DATA_STORAGE + "bookmark.json");
    this.fsData = fsData;
    if ((await fsData.exists()) == false) await fs(window.DATA_STORAGE).createFile("bookmark.json", JSON.stringify(this.data));
    const dataRaw = await fsData.readFile("utf8");
    const data = dataRaw.startsWith('{"p') ? JSON.parse(dataRaw) : this.data;
    this.data = data;
    const initFiles = editorManager.files;
    for (let i = 0; i < initFiles.length; i++) {
      this.buffer[initFiles[i].id] = [...(data.file[initFiles[i].id]?.array ?? [])];
    }
    this.file = editorManager.activeFile;
    this.array = [...this.buffer[this.file.id]];
    this.updateGutter();

    const style = this.style;
    style.type = "text/css";
    style.innerHTML = styles;
    document.head.append(style);

    const [bmManager, dtManager, debugManager, bmWindow] = [this.bmManager, this.dtManager, this.debugManager, this.window];
    
    if (!data.regex) data.regex = [["com\\.termux", "::"], ["file:\\/\\/\\/", "///"]];
    for (let i = 0; i < data.regex.length; i++) {
    	dtManager.regexManager.addRegex(data.regex[i][0], data.regex[i][1]);
    }

    bmManager.makeList(this.array);

    //SIDE BUTTON
    this.showSB = SideButton({
      text: "Bookmark",
      icon: "my-icon",
      onclick() {
      	bmWindow.show();
        bmWindow.setContent(bmManager.controlPanel, bmManager.list);
      	bmManager.visible = true;
        dtManager.visible = false;
        dtManager.regexManager.visible = false;
        debugManager.visible = false;
        bmManager.editList(self.array);
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    this.showSB.show();
    
    const debugSB = SideButton({
      text: "debug",
      icon: "my-icon",
      onclick() {
        bmWindow.setContent(debugManager.controlPanel, debugManager.list);
        bmManager.visible = false;
        dtManager.visible = false;
        dtManager.regexManager.visible = false;
        debugManager.visible = true;
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    debugSB.show();
    
    //PANEL EVENTS
    editorManager.editor.on("gutterclick", (e) => {
      const row = e.getDocumentPosition().row;
      this.toggleLine(row);
      this.updateGutter();
    });
  	
    bmManager.controlPanel.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "toggle":
          const row = editorManager.editor.getSelectionRange().start.row;
          this.toggleLine(row);
          this.updateGutter();
          return;
        case "save":
          await this.saveData();
          this.notify("Bookmark saved");
          return;
        case "load":
          this.array = [...(this.data.file[this.file.id]?.array ?? [])];
          bmManager.makeList(this.array);
          this.updateGutter();
          this.notify("Bookmark loaded");
          return;
        case "file":
          bmWindow.setContent(dtManager.controlPanel, dtManager.list);
          dtManager.format();
          bmManager.visible = false;
          dtManager.visible = true;
          dtManager.regexManager.visible = false;
          debugManager.visible = false;
          return;
      }
    });
    
    bmWindow.panel.querySelector(".mnbm-close").addEventListener("click", (e) => {
      bmWindow.hide();
      bmManager.visible = false;
      dtManager.visible = false;
      dtManager.regexManager.visible = false;
      debugManager.visible = false;
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
          //var newArray = [];
          //for (let i = 0; i < this.array.length; i++) {
          //  if (this.array[i] != row) newArray.push(this.array[i]);
          //}
        	const idx = this.array.indexOf(row);
          this.array = [...this.array.slice(0, idx), ...this.array.slice(idx + 1)]
          //this.array = newArray;
          this.updateGutter();
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
	        bmManager.editList(self.array);
          return;
        case "check-files":
        	/*
        	const arr = [];
        	const arr2 = [];
        	for (let i = 0; i < editorManager.files.length; i++) {
        		arr.push(editorManager.files[i].location);
        		arr2.push(editorManager.files[i]);
        	}
        	//arr.sort();
        	arr.sort((a, b) => a.length - b.length);
        	arr2.sort((a, b) => a.location.length - b.location.length);
        	for (let i = 0; i < arr.length; i++) {
        		for (let j = i + 1; j < arr.length; j++) {
        			if (arr[j].includes(arr[i])) {
        				arr[j] = i + "||" + arr[j].slice(arr[i].length);
        				this.data.file[arr2[j].id].name = arr[j];
        			}
        		}
      			arr[i] = arr[i] + arr2[i].filename;
      			this.data.file[arr2[i].id].name = arr[i];
        	}
    			dtManager.reLoad(this.data.file);
        	//const arr2 = [];
        	let iw = 0;
        	//while (!(arr.length == arr2.length)) {}
        	for (let i = 0; i < arr.length; i++) {
        		debugManager.log(arr[i]);
        	}
        	*/
        	return;
      }
    });

    dtManager.list.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
          delete data.file[target.parentElement.dataset.id];
          target.parentElement.remove();
          this.data.regex = this.dtManager.regexManager.getRegex();
          await fsData.writeFile(JSON.stringify(this.data));
          return;
      }
    });
    
    //DEBUG MANAGER
    debugManager.controlPanel.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
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
      }
    });
    
    //EDITOR EVENTS
    editorManager.on("new-file", (e) => {
      //debugManager.log("new-file: " + e.id + " : " + e.filename);
      this.buffer[e.id] = [...(data.file[e.id]?.array ?? [])];
    });

    editorManager.on("file-loaded", (e) => {
      //debugManager.log("file-loaded: " + e.id + " : " + e.filename);
      this.array = [...(this.data.file[e.id]?.array ?? [])];
      this.updateGutter();
      bmManager.makeList(this.array);
      this.notify("Bookmark loaded");
    });
    
    const last_rename = { id: this.file.id, name: this.file.filename };

    editorManager.on("switch-file", async (e) => {
      //debugManager.log(`switch-file: ${this.file.filename} => ${e.filename}`);
      this.buffer[this.file.id] = [...this.array];
      this.array = [...this.buffer[e.id]];
      bmManager.makeList(this.array);
      this.updateGutter();
      this.file = e;
      last_rename.id = this.file.id;
      last_rename.name = this.file.filename;
      //if (dtManager.visible) dtManager.reLoad(this.data.file);
      this.notify("Bookmark switched"); // : " + "Files: " + infi.length + " uri: " + this.file.uri + " || " + this.getFormattedPath(this.file.uri), 5000);
    });

    editorManager.on("rename-file", async (e) => {
      //debugManager.log("rename-file: " + last_rename.id + " : " + last_rename.name + " => " + e.id + " : " + e.filename);
      if (this.data.file[last_rename.id]) {
        this.data.file[e.id] = { path_idx: -1, name: e.filename, array: [...this.data.file[last_rename.id].array] };
        if (!(last_rename.id == e.id)) delete this.data.file[last_rename.id];
        this.data.regex = this.dtManager.regexManager.getRegex();
        await this.fsData.writeFile(JSON.stringify(this.data));
      }
      if (this.data.file[e.id]) this.data.file[e.id].name = e.filename;
      this.buffer[e.id] = [...this.buffer[last_rename.id]];
      if (!(last_rename.id == e.id)) delete this.buffer[last_rename.id];
      if (this.dtManager.visible) this.dtManager.reLoad(this.data.file);
      this.file = e;
      last_rename.id = this.file.id;
      last_rename.name = this.file.filename;
      this.notify("Bookmark renamed");
    });

    editorManager.on("save-file", async (e) => {
      //debugManager.log("save-file: " + e.id + " : " + e.filename);
      const arr = [];
      for (let i = 0; i < 500; i++) {
      	arr.push(i);
      }
      const dt = {};
      for (let i = 0; i < editorManager.files.length; i++) {
      	dt[editorManager.files[i].id] = { path_idx: -1, name: editorManager.files[i].uri, array: [...arr] };
      }
      data.file = dt;
      
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

    //settings.on("update", this.updateSettings);
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
    this.readySB.hide();
    //this.addSB.hide();
    this.showSB.hide();
    if (this.getPanel()) this.removePanel();
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
    this.bmManager.addLine(ln, newArray.length - 1);
  }
  
  toggleLine(ln) {
  	if (this.array.includes(ln)) {
      var newArray = [];
      for (let i = 0; i < this.array.length; i++) {
        if (this.array[i] != ln) {
          newArray.push(this.array[i]);
        } else {
          this.bmManager.removeItem(i);
        }
      }
      this.array = newArray;
    } else {
      this.addLine(ln);
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

  getPanel() {
    return document.body.querySelector(".mnbm-window");
  }

  addPanel(pnl) {
    if (this.getPanel()) this.removePanel();
    document.body.append(pnl);
	  pnl.style.left = this.panelPos.x +  "%";
	  pnl.style.top = this.panelPos.y + "%";
  }

  removePanel() {
    this.getPanel().remove();
  }

  async saveData() {
    this.data.file[this.file.id] = { path_idx: -1, name: this.file.filename, array: [...this.array] };
    if (this.array.length == 0) delete this.data.file[this.file.id];
    if (this.dtManager.visible) this.dtManager.reLoad(this.data.file);
    this.data.regex = this.dtManager.regexManager.getRegex();
    await this.fsData.writeFile(JSON.stringify(this.data));
  }
  
  getFormattedPath() {
	  let path = editorManager.activeFile?.location
	  if (!path) {
	    window.toast("Unsaved file", 3000)
	    return false
	  }
	  if (path.search(/com\.termux/) > -1) {
	    path = path.split("::").pop()
	  } else if (path.search(/file:\/\/\//) > -1) {
	    path = path.split("///").pop()
	  }
	  return path
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
          if (this.getPanel()) {
            this.removePanel();
            this.bmManager.visible = false;
            this.dtManager.visible = false;
            this.debugManager.visible = false;
            return;
          }
          this.addPanel(this.bmManager.panel);
          this.bmManager.visible = true;
          this.dtManager.visible = false;
          this.debugManager.visible = false;
          this.bmManager.writeList([...this.array]);
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
          this.updateGutter();
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
	const td = tag("div", { className: "class", dataset: { uri: "abc" , chg: "012"} });
	alert("dataset", td.className);
	alert("dataset", td.dataset.uri);
	alert("dataset", td.dataset.chg);
	td.dataset.chg = "210";
	alert("dataset", td.dataset.chg);
	delete td.dataset.chg;
	alert("dataset", td.dataset.chg);
	
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
