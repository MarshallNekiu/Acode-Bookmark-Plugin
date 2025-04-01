
export default class Debugger {
	
	constructor () {
		this.panel = tag("section", {className: "mnbm-window"});
		this.panel.innerHTML = `
		  <div class="mnbm-content">
		    <div class="mnbm-top">
		      <div class="mnbm-left">
		        <button class="mnbm-debug-data" data-action="data"> Data </button>
		        <button class="mnbm-debug-buffer" data-action="buffer"> Buffer </button>
		        <button class="mnbm-debug-file" data-action="file"> File </button>
		        <button class="mnbm-debug-array" data-action="array"> Array </button>
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
	
	log(x) {
		const listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> Erase </button>
	    </li>
		`;
		this.list.insertAdjacentHTML("beforeend", listItem);
		this.list.lastElementChild.firstElementChild.innerText = (this.list.childElementCount - 1) + ":";
		this.list.lastElementChild.children.item(1).innerText = x;
	}
	
	unLog(itm) {
		let e = itm.nextElementSibling;
		let i = parseInt(itm.firstElementChild.innerText.slice(0, -1));
		itm.remove();
		while (e) {
			e.firstElementChild.innerText = i + ":";
			e = e.nextElementSibling;
			i += 1;
		}
	}
}