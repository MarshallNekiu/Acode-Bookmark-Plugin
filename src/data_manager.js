
import RegexManager from "./regex_manager.js";

const prompt = acode.require('prompt');
const fs = acode.require("fsOperation");
const alert = acode.require("alert");

export default class DataManager {
	
	constructor () {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
	    <button class="mnbm-back" data-action="back"> ≪ </button>
	    <button class="mnbm-check-files" data-action="check-files"> (...) </button>
	    <button class="mnbm-regex-visible" data-action="regex-visible"> (.*) </button>
		`;
		this.list = tag("ul", {className: "mnbm-list"});
		this.regexManager = new RegexManager();
		this.visible = false;
		
		this.controlPanel.lastElementChild.addEventListener("click", (e) => { toggleRegex() });
		this.regexManager.controlPanel.firstElementChild.addEventListener("click", (e) => { toggleRegex() });
	}
	
	toggleRegex() {
		if (!this.visible && !this.regexManager.visible) return;
		if (this.regexManager.visible) {
			this.regexManager.controlPanel.replaceWith(this.controlPanel);
			this.regexManager.list.replaceWith(this.list);
		} else {
			this.controlPanel.replaceWith(this.regexManager.controlPanel);
			this.list.replaceWith(this.regexManager.list);
		}
		this.regexManager.visible = !this.regexManager.visible;
		this.visible = !this.visible;
	}
	
	addItem(id, txt) {
		const listItem = `
	    <li class="mnbm-item" data-id="${id}", data-text="">
	      <p class="mnbm-prefix"> </p>
	      <p class="mnbm-text"> </p>
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		this.list.insertAdjacentHTML("beforeend", listItem);
		itm.dataset.text = txt;
		const itm = this.list.lastElementChild;
		itm.firstElementChild.innerText = this.list.childElementCount;
		itm.children.item(1).innerText = txt;
	}
	
	format() {
		const chn = this.list.children;
		for (let i = 0; i < chn.length; i++) {
			const itm = chn.item(i);
			itm.children.item(1).innerText = this.regexManager.format(itm.dataset.text);
			this.list.lastElementChild.style.background = itm.dataset.id == editorManager.activeFile.id ? "#c8c8ff66" : "#ffffff66";
		}
	}
	
	async reLoad(data) {
		this.list.innerHTML = "";
		
		let i = 0;
		for (let id in data) {
			const listItem = `
		    <li class="mnbm-item" data-id="${id}", data-text="">
		      <p class="mnbm-prefix"> </p>
		      <p class="mnbm-text"> </p>
		      <button class="mnbm-erase" data-action="erase"> X </button>
		    </li>
			`;
  		this.list.insertAdjacentHTML("beforeend", listItem);
  		this.list.lastElementChild.dataset.text = data[id].name;
  		const chn = this.list.lastElementChild.children;
  		chn.item(0).innerText = i;
  		chn.item(1).innerText = this.regexManager.format(data[id].name);
  		chn.item(1).scrollLeft = 100000;
  		i += 1;
		}
	}
}