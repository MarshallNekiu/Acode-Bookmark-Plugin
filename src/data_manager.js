
export default class DataManager {
	
	constructor () {
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
	
	async reLoad(fsdt) {
		var listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> Erase </button>
	    </li>
		`;
		var bmDataRaw = await fsdt.readFile("utf8");
  	var bmDataSplit = bmDataRaw.split(";\n");
		this.list.innerHTML = "";
		
		for (var i = 0; i < bmDataSplit.length; i++) {
  		if (bmDataSplit[i] == "") continue;
  		var bmData = JSON.parse(bmDataSplit[i]);
  		this.list.insertAdjacentHTML("beforeend", listItem);
  		var chn = this.list.children.item(i).children;
  		chn.item(0).innerText = i + ":";
  		chn.item(1).innerText = bmData.name;
  		chn.item(1).scrollLeft = 100000;
		}
	}
	
	eraseList(idx) {
		this.list.children.item(idx).remove();
	}
}