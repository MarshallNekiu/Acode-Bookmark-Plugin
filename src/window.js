
export default class BMWindow {
	
	constructor () {
		this.panel = tag("section", {className: "mnbm-window"});
		this.panel.innerHTML = `
		  <div class="mnbm-content">
		    <div class="mnbm-header">
		      <div class="mnbm-drag"> </div>
		      <div class="mnbm-control-panel"> </div>
		      <button class="mnbm-close"> X </button>
		    </div>
		    <div class="mnbm-body">
			    <div class="mnbm-container">
			      <ul class="mnbm-list"> </ul>
			    </div>
		    </div>
		  </div>
  		<div class="mnbm-bg"> </div>
		`;
		this.visible = false;
		
		//this.panel.querySelector(".mnbm-close").addEventListener("click", this.hide);
		
    this.panel.querySelector(".mnbm-drag").addEventListener("touchmove", async (e) => this.onTouchMoved(e));
    this.panel.querySelector(".mnbm-bg").addEventListener("touchmove", async (e) => this.onTouchMoved(e));
	}
	
	show() {
		if (!this.visible) document.body.append(this.panel);
		this.visible = true;
	}
	
	hide() {
		if (this.visible) this.panel.remove();
		this.visible = false;
	}
	
	async onTouchMoved(event) {
		const x = (event.touches[0].clientX / (this.panel.offsetWidth * 2));
	  const y = ((event.touches[0].clientY + this.panel.offsetHeight / 2 - 16) / (this.panel.offsetHeight * 2));
	  this.panel.style.left = x * 100 +  "%";
	  this.panel.style.top = y * 100 + "%";
	}
	
	setContent(controlPanel, list) {
		this.panel.querySelector(".mnbm-control-panel").replaceWith(controlPanel);
		this.panel.querySelector(".mnbm-list").replaceWith(list);
	}
}