
import RegexManager from "./regex_manager.js";

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
	
	addItem(id, txt) {
		const listItem = `
	    <li class="mnbm-item" data-id="${id}", data-text="" data-invalid="false">
	      <p class="mnbm-prefix"> </p>
	      <p class="mnbm-text"> </p>
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		this.list.insertAdjacentHTML("beforeend", listItem);
		const itm = this.list.lastElementChild;
		itm.dataset.text = txt;
		itm.firstElementChild.innerText = this.list.childElementCount - 1;
		itm.children.item(1).innerText = this.regexManager.format(txt);
		itm.style.background = itm.dataset.id == editorManager.activeFile.id ? "#c8c8ff66" : "#ffffff66";
		itm.scrollLeft = 100000;
	}
	
	getItem(idx) {
		return this.list.children.item(idx);
	}
	
	getItemText(itm) {
		return itm.firstElementChild.innerText;
	}
	
	formatItem(itm, id, txt, invalid = "false") {
		
	}
	
	format() {
		const chn = this.list.children;
		for (let i = 0; i < chn.length; i++) {
			const itm = chn.item(i);
			itm.firstElementChild.innerText = i;
			itm.children.item(1).innerText = this.regexManager.format(itm.dataset.text);
			itm.style.background = itm.dataset.invalid == "true" ? "#c8141433" : itm.dataset.id == editorManager.activeFile.id ? "#c8c8ff66" : "#ffffff66";
		}
	}
	
	clearList() {
		this.list.innerHTML = "";
	}
	
	toggleRegex() {
		if (!this.visible && !this.regexManager.visible) return;
		if (this.regexManager.visible) {
			this.regexManager.controlPanel.replaceWith(this.controlPanel);
			this.regexManager.list.replaceWith(this.list);
			this.format();
		} else {
			this.controlPanel.replaceWith(this.regexManager.controlPanel);
			this.list.replaceWith(this.regexManager.list);
		}
		this.regexManager.visible = !this.regexManager.visible;
		this.visible = !this.visible;
	}
}