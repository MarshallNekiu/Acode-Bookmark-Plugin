
export default class DataManager {
	
	constructor () {
		this.panel = tag("section", {className: "mnbm-window"});
//		      <div class="mnbm-left">
//		        <button class="mnbm-check-files" data-action="check-files"> CheckFiles </button>
//		      </div>
		this.panel.innerHTML = `
		  <div class="mnbm-content">
		    <div class="mnbm-top">
		      <div class="mnbm-left">
		        <button class="mnbm-back" data-action="back"> ≪ </button>
		        <div class="mnbm-touchable"> </div>
		       </div>
		      <button class="mnbm-close" data-action="close"> X </button>
		    </div>
		    <div class="mnbm-body">
			    <div class="mnbm-container">
			      <ul class="mnbm-list"> </ul>
			    </div>
		    </div>
		  </div>
  		<div class="mnbm-bg"> </div>
		`;
		this.panelTop = this.panel.querySelector(".mnbm-top");
		this.list = this.panel.querySelector(".mnbm-list");
		this.visible = false;
	}
	
	async reLoad(data) {
		const listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		this.list.innerHTML = "";
		
		let i = 0;
		for (let id in data) {
  		this.list.insertAdjacentHTML("beforeend", listItem);
  		const chn = this.list.lastElementChild.children;
  		chn.item(0).innerText = id;
  		chn.item(1).innerText = data[id].name;
  		chn.item(1).scrollLeft = 100000;
  		i += 1;
		}
	}
}