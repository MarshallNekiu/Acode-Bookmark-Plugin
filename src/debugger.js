
export default class Debugger {
	
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
	
	log(x) {
		var listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> Erase </button>
	    </li>
		`;
		
		this.list.insertAdjacentHTML("beforeend", listItem);
		this.list.lastElementChild.children.item(0).innerText = (this.list.children.length - 1) + ":";
		this.list.lastElementChild.children.item(1).innerText = x;
	}
	
	rePrefix() {
		var chn = this.list.children;
		for (var i = 0; i < chn.length; i++) {
			chn.item(i).children.item(0).innerText = i + ":";
		}
	}
	
	unLog(idx) {
		this.list.children.item(idx).remove();
		this.rePrefix();
	}
	
	unLogItem(itm) {
		itm.remove();
		this.rePrefix();
	}
}