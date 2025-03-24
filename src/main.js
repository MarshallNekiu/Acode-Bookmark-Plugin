
import plugin from '../plugin.json';
import styles from './styles.scss';

const fs = acode.require('fsOperation');
const SideButton = acode.require('sideButton');

class AcodePlugin {
	
	async init() {
  	const fsData = await fs(window.DATA_STORAGE + "bookmark.json");
  	const style = document.createElement('style');
	  style.type = 'text/css';
	  style.innerHTML = styles;
		document.head.append(style);
	  
		const bmPanel = tag("section", { className: "bm-container" });
		const bmOverlay = tag("div", { className: "bm-overlay" });
		
		bmPanel.innerHTML = `
		  <div class="bm-container-top">
		    <div>
		  	 <button class="bm-btn-add" data-action="add"> Add </button>
		      <button class="bm-btn-save" data-action="save"> Save </button>
		      <button class="bm-btn-load" data-action="load"> Load </button>
		      <button class="bm-btn-file" data-action="file"> File </button>
		    </div>
	      <button class="bm-btn-close" data-action="close"> Close </button>
		  </div>
		  <ul class="bm-list"></ul>
		`;
		
		const bmPanelTop = bmPanel.querySelector(".bm-container-top");
		const bmList = bmPanel.querySelector(".bm-list");
		
		const filePanel = tag("section", { className: "bm-container" });
		
		filePanel.innerHTML = `
		  <div class="bm-container-top">
	      <button class="bm-btn-close" data-action="close"> Close </button>
		  </div>
		  <ul class="bm-list"></ul>
		`;
		
		const filePanelTop = filePanel.querySelector(".bm-container-top");
		const fileList = filePanel.querySelector(".bm-list");
		
		const listItem = `
			<li class="bm-item">
				<p class="bm-item-prefix"></p>
	  		<p class="bm-item-text" data-action="select"></p>
	      <button class="bm-btn-erase" data-action="erase"> Erase </button>
	     </li>
		`;
		
		var bmArray = [];
		var bmVisible = false;
		var fileVisible = false;
		
		bmPanelTop.addEventListener("click", async (e) => {
			const target = e.target.closest("[data-action]");
				
			  if (!target) {return};
				
			  if (await fsData.exists() == false) {
		  		await fs(window.DATA_STORAGE).createFile("bookmark.json", "");
		  	}
		  	
		  	var bmDataRaw = await fsData.readFile("utf8");
		  	var bmDataSplit = bmDataRaw.split(";\n");
			  
			  switch(target.dataset.action) {
			  	case "add":
				  	var bmNew = editorManager.editor.getSelectionRange().start.row;
				  	
				  	if (bmArray.indexOf(bmNew) == -1) {
				  		var newArray = [];
				  		
				  		for (var i = 0; i < bmArray.length; i++) {
				  			if (bmArray[i] >= bmNew) {break};
				  			newArray.push(bmArray[i])
				  		}
				  		
				    	newArray.push(bmNew);
				    	
				    	for (var i = newArray.length -1; i < bmArray.length; i++) {
				    		newArray.push(bmArray[i]);
				    	}
				    	
				    	bmArray = newArray;
				    	
				    	bmList.insertAdjacentHTML("beforeend", listItem);
				    	
				    	if (bmVisible) {
				    		
				    		for (var i = 0; i < bmArray.length; i++) {
				    			bmList.children.item(i).children.item(0).innerText = (bmArray[i] + 1) + ":";
						  		bmList.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(bmArray[i]);
				    		}
				    	}
				  	}
				  	return;
			  	case "save":
				  	var bmNewData = "";
				  	var bmFound = false;
				  	
				  	var bmfn = (editorManager.activeFile?.location == null ? "" : editorManager.activeFile?.location) + editorManager.activeFile.filename;
				  	var bmid = editorManager.activeFile.id;
				  	
				  	for (var i = 0; i < bmDataSplit.length; i++) {
				  		
				  		if (bmDataSplit[i] != "") {
					  		var bmData = JSON.parse(bmDataSplit[i]);
					  		
					  		if (bmData.id == bmid) {
					  			bmData.name = bmfn;
					  			bmData.array = bmArray;
					  			
					  			bmFound = true;
					  		}
					  		
					  		bmNewData += JSON.stringify(bmData) + ";\n";
				  		}
				  	}
				  	
				  	if (bmFound == false) {
				  		bmNewData += JSON.stringify({id: bmid, name: bmfn, array: bmArray}) + ";\n";
				  	}
				  	
				  	await fsData.writeFile(bmNewData);
			  		return
			  	case "load":
				  	var bmNewData = "";
				  	var bmFound = false;
				  	
				  	var bmfn = (editorManager.activeFile?.location == null ? "" : editorManager.activeFile?.location) + editorManager.activeFile.filename;
				  	var bmid = editorManager.activeFile.id;
				  	
				  	for (var i = 0; i < bmDataSplit.length; i++) {
				  		
				  		if (bmDataSplit[i] != "") {
					  		var bmData = JSON.parse(bmDataSplit[i]);
					  		
					  		if (bmData.id == bmid) {
					  			bmData.name = bmfn;
				  				bmArray = bmData.array;
					  			
					  			bmFound = true;
					  		}
					  		
					  		bmNewData += JSON.stringify(bmData) + ";\n";
				  		}
				  	}
				  	
				  	if (bmFound == false) {
				  		bmArray = [];
				  		bmNewData += JSON.stringify({id: bmid, name: bmfn, array: bmArray}) + ";\n";
				  	}
				  	
				  	bmList.innerHTML = "";
				  	
				  	for (var i = 0; i < bmArray.length; i++) {
				  		bmList.insertAdjacentHTML("beforeend", listItem);
				  		bmList.children.item(i).children.item(0).innerText = (bmArray[i] + 1) + ":";
				  		bmList.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(bmArray[i]);
				  	}
				  	
				  	await fsData.writeFile(bmNewData);
			  		return
			  	case "file":
			  		
			  		bmPanel.remove();
		    		bmOverlay.remove();
		    		
			  		document.body.append(filePanel, bmOverlay);
			  		
			  		fileList.innerHTML = "";
			  		
			  		for (var i = 0; i < bmDataSplit.length; i++) {
				  		
				  		if (bmDataSplit[i] != "") {
					  		var bmData = JSON.parse(bmDataSplit[i]);
					  		
					  		fileList.insertAdjacentHTML("beforeend", listItem);
					  		fileList.children.item(i).children.item(0).innerText = i + ":";
					  		fileList.children.item(i).children.item(1).innerText = bmData.name;
					  		fileList.children.item(i).children.item(1).scrollLeft = 10000;
				  		}
			  		}
			  		
			  		bmVisible = false;
			  		fileVisible = true;
			  		return
			    case "close":
			    	
			     	bmPanel.remove()
		    		bmOverlay.remove()
		    		
		    		bmVisible = false;
			      return
	  		}
			}
		);
		
		bmList.addEventListener("click", async (e) => {
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
			  		
			  		for (var i = 0; i < bmArray.length; i++) {
			  			if (bmArray[i] != line) {
			  				newArray.push(bmArray[i]);
			  			}
			  		}
			  		
			  		bmArray = newArray;
			  		
			  		e.target.parentElement.parentElement.removeChild(e.target.parentElement);
			  		return
	  		}
			}
		);
		
		filePanelTop.addEventListener("click", async (e) => {
				const target = e.target.closest("[data-action]");
			  
			  if (!target) {return};
			  
			  switch(target.dataset.action) {
			  	case "close":
			  		filePanel.remove()
		    		bmOverlay.remove()
			  		return
		  	}
			}
		);
		
		fileList.addEventListener("click", async (e) => {
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
				  	
				  	fileList.innerHTML = "";
				  	
				  	bmDataSplit = bmNewData.split(";\n");
			  		
			  		for (var i = 0; i < bmDataSplit.length; i++) {
				  		
				  		if (bmDataSplit[i] != "") {
					  		var bmData = JSON.parse(bmDataSplit[i]);
					  		
					  		fileList.insertAdjacentHTML("beforeend", listItem);
					  		fileList.children.item(i).children.item(0).innerText = i + ":";
					  		fileList.children.item(i).children.item(1).innerText = bmData.name;
					  		fileList.children.item(i).children.item(1).scrollLeft = 10000;
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
		  	var bmNew = editorManager.editor.getSelectionRange().start.row;
		  	
		  	if (bmArray.indexOf(bmNew) == -1) {
		  		var newArray = [];
		  		
		  		for (var i = 0; i < bmArray.length; i++) {
		  			if (bmArray[i] >= bmNew) {break};
		  			newArray.push(bmArray[i])
		  		}
		  		
		    	newArray.push(bmNew);
		    	
		    	for (var i = newArray.length -1; i < bmArray.length; i++) {
		    		newArray.push(bmArray[i]);
		    	}
		    	
		    	bmArray = newArray;
		    	
		    	bmList.insertAdjacentHTML("beforeend", listItem);
		    	
		    	if (bmVisible) {
		    		
		    		for (var i = 0; i < bmArray.length; i++) {
		    			bmList.children.item(i).children.item(0).innerText = (bmArray[i] + 1) + ":";
				  		bmList.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(bmArray[i]);
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
		  	
		  	if (fileVisible) {
		  		filePanel.remove();
		  		bmOverlay.remove();
		  	}
    		
		  	document.body.append(bmPanel, bmOverlay);
		  	
		  	for (var i = 0; i < bmArray.length; i++) {
    			bmList.children.item(i).children.item(0).innerText = (bmArray[i] + 1) + ":";
		  		bmList.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(bmArray[i]);
    		}
		  	
		  	bmVisible = true;
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		
		showSB.show();
  	
		editorManager.editor.on('change', (e, ins) => {
			
		    if (e.start.row != e.end.row) {
		    	var newArray = [];
		    	
		    	if (e.action == "insert") {
			    	for (var i = 0; i < bmArray.length; i++) {
			    		if (bmArray[i] > e.start.row) {
			    			newArray.push(bmArray[i] + (e.end.row - e.start.row));
			    			continue;
			    		}
			    		newArray.push(bmArray[i]);
			    	}
		    	} else if (e.action == "remove") {
		    		for (var i = 0; i < bmArray.length; i++) {
			    		if (bmArray[i] > e.end.row) {
			    			newArray.push(bmArray[i] - (e.end.row - e.start.row));
			    			continue;
			    		}
			    		newArray.push(bmArray[i]);
			    	}
		    	}
		    	
		    	bmArray = newArray;
		    }
		    
		    if (bmVisible) {
		    		
	    		for (var i = 0; i < bmArray.length; i++) {
    				bmList.children.item(i).children.item(0).innerText = (bmArray[i] + 1) + ":";
    				bmList.children.item(i).children.item(1).innerText = editorManager.editor.session.getLine(bmArray[i]);
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
