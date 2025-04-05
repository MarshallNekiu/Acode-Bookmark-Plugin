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

import plugin from "../plugin.json";
import BookmarkManager from "./bookmark_manager.js";
import DataManager from "./data_manager";
//import Debugger from "./debugger.js";
import styles from "./styles.scss";

const fs = acode.require("fsOperation");
const settings = acode.require("settings");
const SideButton = acode.require("sideButton");

class BookmarkPlugin {
	
  constructor() {
    this.fsData;
    this.data = { plugin: { version: "1.2.1" }, path: [], file: {} };
    this.buffer = {};
    this.file = editorManager.activeFile;
    this.last_rename = { id: this.file.id, name: this.file.filename };
    this.array = [];
    this.clipArray = []; //relative to start.row
    this.style = document.createElement("style");
    this.bmManager = new BookmarkManager();
    this.dtManager = new DataManager();
    this.panelPos = {x: 50, y: 50};
    //this.debugManager = new Debugger();
    this.readySB;
    this.showSB;
    this.gutter = [];
    
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
    const initLink = { ready: false };
    
    this.readySB = SideButton({
      text: "readyBM",
      icon: "my-icon",
      onclick() {
        self.ready(initLink);
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    this.readySB.show();

    const rF = () => {
      editorManager.editor.commands.removeCommand("readyBookmark");
      if (initLink.ready) {
        settings.off("update", rF);
      } else if (this.plugSettings.toggleBMLCommand.length > 0) {
        editorManager.editor.commands.addCommand({
          name: "readyBookmark",
          description: "",
          bindKey: { win: this.plugSettings.toggleBMLCommand },
          exec: () => {
            this.ready(initLink);
            editorManager.editor.commands.removeCommand("readyBookmark");
            settings.off("update", rF);
          }
        });
      }
    };
    rF();
    settings.on("update", rF);
  }

  async ready(initLink) {
    initLink.ready = true;
    this.readySB.hide();

    const self = this;
    const fsData = await fs(window.DATA_STORAGE + "bookmark.json");
    this.fsData = fsData;
    if ((await fsData.exists()) == false) await fs(window.DATA_STORAGE).createFile("bookmark.json", JSON.stringify(this.data));
    const dataRaw = await fsData.readFile("utf8");
    const data = dataRaw.startsWith('{"p') ? JSON.parse(dataRaw) : this.data;
    this.data = data;
    const initFiles = [...editorManager.files];
    for (let i = 0; i < initFiles.length; i++) {
      this.buffer[initFiles[i].id] = [...(data.file[initFiles[i].id] ?? { array: [] }).array];
    }
    this.file = editorManager.activeFile;
    this.last_rename = { id: this.file.id, name: this.file.filename };
    this.array = [...this.buffer[this.file.id]];
    this.updateGutter();

    const style = this.style;
    style.type = "text/css";
    style.innerHTML = styles;
    document.head.append(style);

    const [bmManager, dtManager] = [this.bmManager, this.dtManager];

    bmManager.setList(this.array);

    //SIDE BUTTON
    this.showSB = SideButton({
      text: "Bookmark",
      icon: "my-icon",
      onclick() {
        self.addPanel(bmManager.panel);
        self.bmManager.visible = true;
        dtManager.visible = false;
        //debugManager.visible = false;
        bmManager.writeList([...self.array]);
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    this.showSB.show();
    /*
    const debugSB = SideButton({
      text: "debug",
      icon: "my-icon",
      onclick() {
        self.addPanel(debugManager.panel);
        bmManager.visible = false;
        dtManager.visible = false;
        debugManager.visible = true;
      },
      backgroundColor: "#3e4dc4",
      textColor: "#000"
    });
    //debugSB.show();
    */
    //PANEL EVENTS
    const moveF = async (event) => {
    	if (bmManager.visible) {
    		this.panelPos.x = (event.touches[0].clientX / (bmManager.panel.offsetWidth * 2)) * 100;
    	  this.panelPos.y = ((event.touches[0].clientY + bmManager.panel.offsetHeight / 2 - 16) / (bmManager.panel.offsetHeight * 2)) * 100;
    	  bmManager.panel.style.left = this.panelPos.x +  "%";
    	  bmManager.panel.style.top = this.panelPos.y + "%";
    		return;
    	} else if (dtManager.visible) {
    		this.panelPos.x = (event.touches[0].clientX / (dtManager.panel.offsetWidth * 2)) * 100;
    	  this.panelPos.y = ((event.touches[0].clientY + dtManager.panel.offsetHeight / 2 - 16) / (dtManager.panel.offsetHeight * 2)) * 100;
    	  dtManager.panel.style.left = this.panelPos.x +  "%";
    	  dtManager.panel.style.top = this.panelPos.y + "%";
    	}
    };

    bmManager.panelTop.querySelector(".mnbm-touchable").addEventListener("touchmove", moveF);
    bmManager.panel.querySelector(".mnbm-bg").addEventListener("touchmove", moveF);
    dtManager.panelTop.querySelector(".mnbm-touchable").addEventListener("touchmove", moveF);
    dtManager.panel.querySelector(".mnbm-bg").addEventListener("touchmove", moveF);
    
    editorManager.editor.on("gutterclick", (e) => {
      const row = e.getDocumentPosition().row;
      this.toggleLine(row);
      this.updateGutter();
    });
  	
    bmManager.panelTop.addEventListener("click", async (e) => {
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
          this.array = [...(this.data.file[this.file.id] ?? { array: [] }).array];
          bmManager.setList(this.array);
          this.updateGutter();
          this.notify("Bookmark loaded");
          return;
        case "file":
          this.addPanel(dtManager.panel);
          dtManager.reLoad(data.file);
          bmManager.visible = false;
          dtManager.visible = true;
          return;
        case "close":
          this.removePanel();
          bmManager.visible = false;
          return;
      }
    });

    bmManager.list.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;
      const line = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1)) - 1;

      switch (target.dataset.action) {
        case "select":
          editorManager.editor.gotoLine(line);
          return;
        case "erase":
          var newArray = [];
          for (let i = 0; i < this.array.length; i++) {
            if (this.array[i] != line) newArray.push(this.array[i]);
          }
          this.array = newArray;
          this.updateGutter();
          e.target.parentElement.remove();
          return;
      }
    });

    dtManager.panelTop.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "back":
          this.removePanel();
          this.addPanel(bmManager.panel);
          bmManager.visible = true;
          dtManager.visible = false;
          bmManager.writeList(this.array);
          //debugManager.visible = false;
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

      switch (target.dataset.action) {
        case "erase":
          delete data.file[e.target.parentElement.firstElementChild.innerText];
          e.target.parentElement.remove();
          await fsData.writeFile(JSON.stringify(this.data));
          return;
      }
    });
    /*
    debugManager.panelTop.addEventListener("click", (e) => {
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
        case "close":
          this.removePanel();
          debugManager.visible = false;
          return;
      }
    });

    debugManager.list.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
          debugManager.unLog(e.target.parentElement);
          return;
      }
    });
    */
    //EDITOR EVENTS
    editorManager.on("new-file", (e) => {
      //debugManager.log("new-file: " + e.id + " : " + e.filename);
      this.buffer[e.id] = [...(data.file[e.id] ?? { array: [] }).array];
    });

    editorManager.on("file-loaded", (e) => {
      //debugManager.log("file-loaded: " + e.id + " : " + e.filename);
      this.array = [...(this.data.file[e.id] ?? { array: [] }).array];
      this.updateGutter();
      bmManager.setList(this.array);
      this.notify("Bookmark loaded");
    });

    editorManager.on("switch-file", async (e) => {
      //debugManager.log(`switch-file: ${this.file.filename} => ${e.filename}`);
      this.buffer[this.file.id] = [...this.array];
      this.array = [...this.buffer[e.id]];
      bmManager.setList([...this.array]);
      this.updateGutter();
      this.file = e;
      this.last_rename = { id: this.file.id, name: this.file.filename };
      this.notify("Bookmark switched");
    });

    editorManager.on("rename-file", async (e) => {
      //debugManager.log("rename-file: " + this.last_rename.id + " : " + this.last_rename.name + " => " + e.id + " : " + e.filename);
      if (this.data.file[this.last_rename.id]) {
        this.data.file[e.id] = { path_idx: -1, name: e.filename, array: [...this.data.file[this.last_rename.id].array] };
        if (!(this.last_rename.id == e.id)) delete this.data.file[this.last_rename.id];
        await this.fsData.writeFile(JSON.stringify(this.data));
      }
      if (this.data.file[e.id]) this.data.file[e.id].name = e.filename;
      this.buffer[e.id] = [...this.buffer[this.last_rename.id]];
      if (!(this.last_rename.id == e.id)) delete this.buffer[this.last_rename.id];
      if (this.dtManager.visible) this.dtManager.reLoad(this.data.file);
      this.file = e;
      this.last_rename = { id: this.file.id, name: this.file.filename };
      this.notify("Bookmark renamed");
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

  notify(x) {
    const ntf = tag("p", { className: "mnbm-notification" });
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
    await this.fsData.writeFile(JSON.stringify(this.data));
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
        exec: () => {
          if (this.getPanel()) {
            this.removePanel();
            this.bmManager.visible = false;
            this.dtManager.visible = false;
            //this.debugManager.visible = false;
            return;
          }
          this.addPanel(this.bmManager.panel);
          this.bmManager.visible = true;
          this.dtManager.visible = false;
          //this.debugManager.visible = false;
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
