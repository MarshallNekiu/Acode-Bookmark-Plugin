
import RegexManager from "./regex_manager.js";

const prompt = acode.require('prompt');
const fs = acode.require("fsOperation");
const alert = acode.require("alert");

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
		        <button class="mnbm-check-files" data-action="check-files"> (...) </button>
		        <button class="mnbm-regexpop" data-action="regexpop"> (.*) </button>
		        <button class="mnbm-regexadd" data-action="regexadd"> (+.*) </button>
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
		this.regexPop = new RegexPop();
		this.regexadd = this.panelTop.querySelector(".mnbm-regexadd");
		this.panelPos = {x: 50, y: 50};
		this.visible = false;
	}
	
	async init() {
		this.regexPop.init();
		this.regexadd.remove();
		
		const moveF = async (event) => {
  		this.panelPos.x = (event.touches[0].clientX / (this.panel.offsetWidth * 2)) * 100;
  	  this.panelPos.y = ((event.touches[0].clientY + this.panel.offsetHeight / 2 - 16) / (this.panel.offsetHeight * 2)) * 100;
  	  this.panel.style.left = this.panelPos.x +  "%";
  	  this.panel.style.top = this.panelPos.y + "%";
    };
    this.panelTop.querySelector(".mnbm-touchable").addEventListener("touchmove", moveF);
    this.panel.querySelector(".mnbm-bg").addEventListener("touchmove", moveF);
    
    this.panelTop.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "regexpop":
        	if (this.regexPop.visible) {
        		this.regexPop.list.replaceWith(this.list);
        		this.regexadd.remove();
        	} else {
        		this.list.replaceWith(this.regexPop.list);
        		this.panelTop.firstElementChild.insertBefore(this.regexadd, this.panelTop.firstElementChild.lastElementChild);
        	}
        	this.regexPop.visible = !this.regexPop.visible;
        	return;
        case "regexadd":
        	this.regexPop.addRegex();
        	return;
      }
    });
	}
	
	async reLoad(data) {
		this.list.innerHTML = "";
		
		let i = 0;
		for (let id in data) {
			const listItem = `
		    <li class="mnbm-item" data-id="${id}">
		      <p class="mnbm-prefix" data-acton="select"> </p>
		      <p class="mnbm-text" data-action="select"> </p>
		      <button class="mnbm-erase" data-action="erase"> X </button>
		    </li>
			`;
  		this.list.insertAdjacentHTML("beforeend", listItem);
  		const chn = this.list.lastElementChild.children;
  		chn.item(0).innerText = i;
  		chn.item(1).innerText = this.regexPop.format(data[id].name);
  		chn.item(1).scrollLeft = 100000;
  		if (id == editorManager.activeFile.id) this.list.lastElementChild.style.background = "#c8c8ff66";
  		i += 1;
		}
	}
}