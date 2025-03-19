
import plugin from '../plugin.json';

const fs = acode.require('fsOperation');
const SideButton = acode.require('sideButton')
const ContextMenu = acode.require('contextmenu');

class AcodePlugin {
	
	async init() {
    const editor = editorManager.editor;
  	const bmPath = window.DATA_STORAGE + "bookmark.json"
  	const bmFile = await fs(bmPath);
  	
  	var bmArray = [];
  	
  	const saveSB = SideButton({
		  text: 'saveBM',
		  icon: 'my-icon',
		  async onclick() {
		  	
		  	if (await bmFile.exists() == false) {
		  		await fs(window.DATA_STORAGE).createFile("bookmark.json", "");
		  	}
		  	
		  	const bmFileContent = await bmFile.readFile("utf8");
		  	const bmSplit = bmFileContent.split(";\n");
		  	
		  	var bmNewFile = "";
		  	var bmFound = false;
		  	
		  	var bmf = editorManager.activeFile.filename;
		  	var bmid = editorManager.activeFile.id;
		  	
		  	for (var i = 0; i < bmSplit.length; i++) {
		  		
		  		if (bmSplit[i].startsWith("{")) {
			  		var bmData = JSON.parse(bmSplit[i]);
			  		
			  		if (bmData.id == bmid) {
			  			bmData.name = bmf;
			  			bmData.array = bmArray;
			  			
			  			bmFound = true;
			  		}
			  		
			  		bmNewFile += JSON.stringify(bmData) + ";\n";
		  		}
		  	}
		  	
		  	if (bmFound == false) {
		  		bmNewFile += JSON.stringify({id: bmid, name: bmf, array: bmArray}) + ";\n";
		  	}
		  	
		  	await bmFile.writeFile(bmNewFile);
		  },
		  backgroundColor: '#f9f1d2',
		  textColor: '#000',
			}
		);
		
		saveSB.show();
		
		const loadSB = SideButton({
		  text: 'loadBM',
		  icon: 'my-icon',
		  async onclick() {
		  	
		  	if (await bmFile.exists() == false) {
		  		await fs(window.DATA_STORAGE).createFile("bookmark.json", "");
		  	}
		  	
		  	const bmFileContent = await bmFile.readFile("utf8");
		  	const bmSplit = bmFileContent.split(";\n");
		  	
		  	var bmNewFile = "";
		  	var bmFound = false;
		  	
		  	var bmf = editorManager.activeFile.filename;
		  	var bmid = editorManager.activeFile.id;
		  	
		  	for (var i = 0; i < bmSplit.length; i++) {
		  		
		  		if (bmSplit[i].startsWith("{")) {
			  		var bmData = JSON.parse(bmSplit[i]);
			  		
			  		if (bmData.id == bmid) {
			  			bmData.name = bmf;
		  				bmArray = bmData.array;
			  			
			  			bmFound = true;
			  		}
			  		
			  		bmNewFile += JSON.stringify(bmData) + ";\n";
		  		}
		  	}
		  	
		  	if (bmFound == false) {
		  		bmArray = [];
		  		bmNewFile += JSON.stringify({id: bmid, name: bmf, array: bmArray}) + ";\n";
		  	}
		  	
		  	await bmFile.writeFile(bmNewFile);
		  },
		  backgroundColor: '#f9f1d2',
		  textColor: '#000',
			}
		);
		
		loadSB.show();
  	
  	const addSB = SideButton({
		  text: 'addBM',
		  icon: 'my-icon',
		  onclick() {
		  	const selection = editor.getSelectionRange();
		  	
		  	if (bmArray.indexOf(selection.start.row) == -1) {
		  		var newArray = [];
		  		var sr = selection.start.row;
		  		
		  		for (var i = 0; i < bmArray.length; i++) {
		  			if (bmArray[i] < sr) {
		  				newArray.push(bmArray[i])
		  			} else {
		  				break;
		  			}
		  		}
		  		
		    	newArray.push(sr);
		    	
		    	for (var i = newArray.length -1; i < bmArray.length; i++) {
		    		newArray.push(bmArray[i]);
		    	}
		    	
		    	bmArray = newArray;
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
		  	var itemArray = [];
		  	
		  	for (var i = 0; i < bmArray.length; i++) {
		  		var bmi = bmArray[i];
		  		itemArray.push([(bmi + 1) + ": " + editor.session.getLine(bmi), bmi]);
		  	}
		  	
		  	const menu = ContextMenu('Bookmark List', {
						top: 128,
						left: 128,
						items: itemArray,
						onselect(action) {
								editor.gotoLine(action);
						},
						onclick(hel, mouse) {}
					}
				);
				
				menu.show();
		  },
		  backgroundColor: '#3e4dc4',
		  textColor: '#000',
			}
		);
		
		showSB.show();
		
		const eraseSB = SideButton({
		  text: 'eraseBM',
		  icon: 'my-icon',
		  onclick() {
		    var itemArray = [];
		    
		  	for (var i = 0; i < bmArray.length; i++) {
		  		const bmi = bmArray[i];
		  		itemArray.push([(bmi + 1) + ": " + editor.session.getLine(bmi), bmi]);
		  	}
		  	
		  	const menu = ContextMenu('Erase BookMark', {
						top: 128,
						left: 128,
						items: itemArray,
						onselect(action) {
							var newBM = [];
							
							for (var i = 0; i < bmArray.length; i++) {
								if (bmArray[i] != action) {
									newBM.push(bmArray[i]);
								}
							}
							
							bmArray = newBM;
						},
						onclick(hel, mouse) {}
					}
				);
				
				menu.show();
		  },
		  backgroundColor: '#c43e3e',
		  textColor: '#000',
			}
		);
		
		eraseSB.show();
  	
		editor.on('change', (e, ins) => {
		    if (e.start.row != e.end.row) {
		    	if (e.action == "insert") {
			    	for (var i = 0; i < bmArray.length; i++) {
			    		if (bmArray[i] > e.start.row) {
			    			bmArray[i] += e.end.row - e.start.row;
			    		}
			    	}
		    	} else if (e.action == "remove") {
		    		for (var i = 0; i < bmArray.length; i++) {
			    		if (bmArray[i] > e.end.row) {
			    			bmArray[i] -= e.end.row - e.start.row;
			    		}
			    	}
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
