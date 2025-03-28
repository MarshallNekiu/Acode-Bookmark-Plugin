
//Bookmark Automaton

import plugin from '../plugin.json';
import styles from './styles.scss';

const fs = acode.require('fsOperation');
const SideButton = acode.require('sideButton');
const alert = acode.require("alert");

var buffer = {}; //{ID: ARRAY}

class BookmarkManager {
	
	constructor (bm) {
		this.bookmark = bm;
		this.panel = tag("section", {className: "mnbm-window"});
		this.panel.innerHTML = `
		  <div class="mnbm-content">
		    <div class="mnbm-top">
		      <div class="mnbm-left">
		        <button class="mnbm-add" data-action="add"> Add </button>
		        <button class="mnbm-save" data-action="save"> Save </button>
		        <button class="mnbm-load" data-action="load"> Load </button>
		        <button class="mnbm-file" data-action="file"> File </button>
		      </div>
		      <button class="mnbm-close" data-action="close"> Close </button>
		    </div>
		    <div class="mnbm-body">
			    <div class="mnbm-container">
			      <ul class="mnbm-list"> </ul>
			    </div>
		    </div>
		  </div>
		`;
		this.panelTop = this.panel.querySelector(".mnbm-top");
		this.list = this.panel.querySelector(".mnbm-list");
		this.visible = false;
	}
	
	addLine(ln) {
		
  	if (this.bookmark.array.indexOf(ln) == -1) {
  		var newArray = [];
  		
  		for (var i = 0; i < this.bookmark.array.length; i++) {
  			if (this.bookmark.array[i] >= ln) {break};
  			newArray.push(this.bookmark.array[i])
  		}
  		
    	newArray.push(ln);
    	
    	for (var i = newArray.length -1; i < this.bookmark.array.length; i++) {
    		newArray.push(this.bookmark.array[i]);
    	}
    	
    	this.bookmark.array = newArray;
    	
    	this.list.insertAdjacentHTML("beforeend", this.bookmark.listItem);
    	
    	if (this.visible) {
    		
    		for (var i = 0; i < this.bookmark.array.length; i++) {
    			this.list.children.item(i).children.item(0).innerText = (this.bookmark.array[i] + 1) + ":";
		  		this.list.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(this.bookmark.array[i]);
    		}
    	}
  	}
	}
	
	async reWrite() {
		this.list.innerHTML = "";
  	
  	for (var i = 0; i < this.bookmark.array.length; i++) {
  		this.list.insertAdjacentHTML("beforeend", this.bookmark.listItem);
  		this.list.children.item(i).children.item(0).innerText = (this.bookmark.array[i] + 1) + ":";
  		this.list.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(this.bookmark.array[i]);
  	}
	}
	
	async saveList(fsdt) {
		var bmDataRaw = await fsdt.readFile("utf8");
	 	var bmDataSplit = bmDataRaw.split(";\n");
  	var bmNewData = "";
  	var bmFound = false;
  	
  	var bmfn = (editorManager.activeFile?.location == null ? "" : editorManager.activeFile?.location) + editorManager.activeFile.filename;
  	var bmid = editorManager.activeFile.id;
  	
  	for (var i = 0; i < bmDataSplit.length; i++) {
  		
  		if (bmDataSplit[i] != "") {
	  		var bmData = JSON.parse(bmDataSplit[i]);
	  		
	  		if (bmData.id == bmid) {
	  			bmData.name = bmfn;
	  			bmData.array = this.bookmark.array;
	  			
	  			bmFound = true;
	  		}
	  		
	  		bmNewData += JSON.stringify(bmData) + ";\n";
  		}
  	}
  	
  	if (bmFound == false) {
  		bmNewData += JSON.stringify({id: bmid, name: bmfn, array: this.bookmark.array}) + ";\n";
  	}
  	
  	await fsdt.writeFile(bmNewData);
	}
	
	async loadList(fsdt) {
		var bmDataRaw = await fsdt.readFile("utf8");
  	var bmDataSplit = bmDataRaw.split(";\n");
  	var bmNewData = "";
  	var bmFound = false;
  	
  	var bmfn = (editorManager.activeFile?.location == null ? "" : editorManager.activeFile?.location) + editorManager.activeFile.filename;
  	var bmid = editorManager.activeFile.id;
  	
  	for (var i = 0; i < bmDataSplit.length; i++) {
  		
  		if (bmDataSplit[i] != "") {
	  		var bmData = JSON.parse(bmDataSplit[i]);
	  		
	  		if (bmData.id == bmid) {
	  			bmData.name = bmfn;
  				this.bookmark.array = bmData.array;
	  			
	  			bmFound = true;
	  		}
	  		
	  		bmNewData += JSON.stringify(bmData) + ";\n";
  		}
  	}
  	
  	if (bmFound == false) {
  		this.bookmark.array = [];
  		bmNewData += JSON.stringify({id: bmid, name: bmfn, array: []}) + ";\n";
  	}
  	
  	await fsdt.writeFile(bmNewData);
	}
}

class DataManager {
	
	constructor (bm) {
		this.bookmark = bm;
		this.panel = tag("section", {className: "mnbm-window"});
		this.panel.innerHTML = `
		  <div class="mnbm-content">
		    <div class="mnbm-top">
		      <button class="mnbm-close" data-action="close"> Close </button>
		    </div>
		    <div class="mnbm-body">
			    <div class="mnbm-container">
			      <ul class="mnbm-list"> </ul>
			    </div>
		    </div>
		  </div>
		`;
		this.panelTop = this.panel.querySelector(".mnbm-top");
		this.list = this.panel.querySelector(".mnbm-list");
		this.visible = false;
	}
	
	async reWrite(fsdt) {
		var bmDataRaw = await fsdt.readFile("utf8");
  	var bmDataSplit = bmDataRaw.split(";\n");
  	
		this.list.innerHTML = "";
		  		
		for (var i = 0; i < bmDataSplit.length; i++) {
  		
  		if (bmDataSplit[i] != "") {
	  		var bmData = JSON.parse(bmDataSplit[i]);
	  		
	  		this.list.insertAdjacentHTML("beforeend", this.bookmark.listItem);
	  		this.list.children.item(i).children.item(0).innerText = i + ":";
	  		this.list.children.item(i).children.item(1).innerText = bmData.name;
	  		this.list.children.item(i).children.item(1).scrollLeft = 10000;
  		}
		}
	}
}

class AcodePlugin {
	
	constructor () {
		this.file = editorManager.activeFile;
		this.array = [];
		this.listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> Erase </button>
	    </li>
		`;
	}
	
	async init() {
  	const fsData = await fs(window.DATA_STORAGE + "bookmark.json");
  	const fsExist = async () => {
  		if (await fsData.exists() == false) {
		  		await fs(window.DATA_STORAGE).createFile("bookmark.json", "");
		  	}
  	};
  	
  	const style = document.createElement('style');
	  style.type = 'text/css';
	  style.innerHTML = styles;
		document.head.append(style);
	  
		const overlay = tag("div", {className: "mnbm-overlay"});
	  const bmManager = new BookmarkManager(this);
	  const dtManager = new DataManager(this);
		
		bmManager.panelTop.addEventListener("click", async (e) => {
				const target = e.target.closest("[data-action]");
			  if (!target) {return};
			  await fsExist();
		  	
		  	var bmDataRaw = await fsData.readFile("utf8");
		  	var bmDataSplit = bmDataRaw.split(";\n");
			  
			  switch(target.dataset.action) {
			  	case "add":
			  		bmManager.addLine(editorManager.editor.getSelectionRange().start.row);
				  	return;
			  	case "save":
			  		await bmManager.saveList(fsData);
			  		return
			  	case "load":
			  		await bmManager.loadList(fsData);
			  		await bmManager.reWrite();
			  		return
			  	case "file":
			  		
			  		bmManager.panel.remove();
		    		overlay.remove();
		    		
			  		document.body.append(dtManager.panel, overlay);
			  		
			  		await dtManager.reWrite(fsData);
			  		
			  		bmManager.visible = false;
			  		dtManager.visible = true;
			  		return
			    case "close":
			    	
			     	bmManager.panel.remove()
		    		overlay.remove()
		    		
		    		bmManager.visible = false;
			      return
	  		}
			}
		);
		
		bmManager.list.addEventListener("click", async (e) => {
				const target = e.target.closest("[data-action]");
			  if (!target) {return};
			  
			  switch(target.dataset.action) {
			  	case "select":
			  		var line = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1)) - 1;
			  		
			  		editorManager.editor.gotoLine(line);
			  		return
			  	case "erase":
			  		var line = parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1)) - 1;
			  		
			  		var newArray = [];
			  		
			  		for (var i = 0; i < this.array.length; i++) {
			  			if (this.array[i] != line) {
			  				newArray.push(this.array[i]);
			  			}
			  		}
			  		
			  		this.array = newArray;
			  		
			  		e.target.parentElement.parentElement.removeChild(e.target.parentElement);
			  		return
	  		}
			}
		);
		
		dtManager.panelTop.addEventListener("click", async (e) => {
				const target = e.target.closest("[data-action]");
			  if (!target) {return};
			  
			  switch(target.dataset.action) {
			  	case "close":
			  		dtManager.panel.remove()
		    		overlay.remove()
		    		dtManager.visible = false;
			  		return
		  	}
			}
		);
		
		dtManager.list.addEventListener("click", async (e) => {
				const target = e.target.closest("[data-action]");
			  if (!target) {return};
			  
			  switch(target.dataset.action) {
			  	case "erase":
			  		var line = [parseInt(e.target.parentElement.children.item(0).innerText.slice(0, -1))][0];
			  		
			  		var bmDataRaw = await fsData.readFile("utf8");
		  			var bmDataSplit = bmDataRaw.split(";\n");
		  	
		  			var bmNewData = "";
				  	
				  	for (var i = 0; i < bmDataSplit.length; i++) {
				  		
				  		if (bmDataSplit[i] != "") {
				  			var bmData = JSON.parse(bmDataSplit[i]);
				  			
					  		if (i == line) {
					  			continue;
					  		}
					  		
					  		bmNewData += JSON.stringify(bmData) + ";\n";
					  		continue;
				  		}
				  	}
				  	
				  	dtManager.list.innerHTML = "";
				  	
				  	bmDataSplit = bmNewData.split(";\n");
			  		
			  		for (var i = 0; i < bmDataSplit.length; i++) {
				  		
				  		if (bmDataSplit[i] != "") {
					  		var bmData = JSON.parse(bmDataSplit[i]);
					  		
					  		dtManager.list.insertAdjacentHTML("beforeend", this.listItem);
					  		dtManager.list.children.item(i).children.item(0).innerText = i + ":";
					  		dtManager.list.children.item(i).children.item(1).innerText = bmData.name;
					  		dtManager.list.children.item(i).children.item(1).scrollLeft = 10000;
				  		}
			  		}
				  	
				  	await fsData.writeFile(bmNewData);
			  		return
	  		}
			}
		);
		
  	const addSB = SideButton({
		  text: 'addBM',
		  icon: 'my-icon',
		  onclick() {
				
		  	this.file.isUnsaved = true;
		  	
		  	var bmNew = editorManager.editor.getSelectionRange().start.row;
		  	
		  	if (this.array.indexOf(bmNew) == -1) {
		  		var newArray = [];
		  		
		  		for (var i = 0; i < this.array.length; i++) {
		  			if (this.array[i] >= bmNew) {break};
		  			newArray.push(this.array[i])
		  		}
		  		
		    	newArray.push(bmNew);
		    	
		    	for (var i = newArray.length -1; i < this.array.length; i++) {
		    		newArray.push(this.array[i]);
		    	}
		    	
		    	this.array = newArray;
		    	
		    	bmManager.list.insertAdjacentHTML("beforeend", this.listItem);
		    	
		    	if (bmManager.visible) {
		    		
		    		for (var i = 0; i < this.array.length; i++) {
		    			bmManager.list.children.item(i).children.item(0).innerText = (this.array[i] + 1) + ":";
				  		bmManager.list.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(this.array[i]);
		    		}
		    	}
		  	}
		  },
		  backgroundColor: '#3ec440',
		  textColor: '#000',
			}
		);
		
		addSB.show();
		
		const showSB = SideButton({
		  text: 'showBM',
		  icon: 'my-icon',
		  onclick() {
		  	
		  	if (dtManager.visible) {
		  		dtManager.panel.remove();
		  		overlay.remove();
		  		dtManager.visible = false;
		  	}
    		
		  	document.body.append(bmManager.panel, overlay);
		  	
		  	bmManager.visible = true;
		  	
		  	for (var i = 0; i < this.array.length; i++) {
    			bmManager.list.children.item(i).children.item(0).innerText = (this.array[i] + 1) + ":";
		  		bmManager.list.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(this.array[i]);
		  	}
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		
		showSB.show();
		
		editorManager.on("switch-file", (e) => {
				this.file = e;
			}
		);
		/*
		editorManager.on("rename-file", (e) => {
				alert("rename", e.id + " : " + e.location + e.filename, () => {});
			}
		);
		editorManager.on("new-file", (e) => {
				alert("new", e.id + " : " + e.location + e.filename, () => {});
			}
		);
		editorManager.on("remove-file", (e) => {
				alert("remove", e.id + " : " + e.location + e.filename, () => {});
			}
		);
		editorManager.on("file-loaded", (e) => {
				alert("file-loaded", e.id + " : " + e.location + e.filename, () => {});
			}
		);
		editorManager.on("save-file", (e) => {
				alert("save-file", e.id + " : " + e.location + e.filename, () => {});
			}
		);
		*/
  	
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
		    	
		    	this.array = newArray;
		    }
		  	
		    if (bmManager.visible) {
	    		for (var i = 0; i < this.array.length; i++) {
    				bmManager.list.children.item(i).children.item(0).innerText = (this.array[i] + 1) + ":";
    				bmManager.list.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(this.array[i]);
	    		}
	    	}
			}
		);
  }

  async destroy() {
    // plugin clean up
  }
}

if (window.acode) {
  const acodePlugin = new AcodePlugin();
  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }
    acodePlugin.baseUrl = baseUrl;
    await acodePlugin.init($page, cacheFile, cacheFileUrl);
  });
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
