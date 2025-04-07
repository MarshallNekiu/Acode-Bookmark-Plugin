
export default class BookmarkManager {
	
	constructor () {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
	    <button class="mnbm-toggle" data-action="toggle"> ⇌ </button>
	    <button class="mnbm-save" data-action="save"> ↑ </button>
	    <button class="mnbm-load" data-action="load"> ↓ </button>
	    <button class="mnbm-file" data-action="file"> ≡ </button>
		`;
		this.list = tag("ul", {className: "mnbm-list"});
		this.visible = false;
	}
	
	addItem(row, idx) {
		const listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-action="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		const last = this.list.childElementCount;
  	this.list.insertAdjacentHTML("beforeend", listItem);
  	this.setItemRow(this.list.lastElementChild, row);
  	if (idx != last) this.moveItem(last, idx); 
	}
	
	getItem(idx) {
		return this.list.children.item(idx);
	}
	
	getItemRow(itm) {
		return parseInt(itm.firstElementChild.innerText);
	}
	
	setItemRow(itm, row) {
		const chn = itm.children;
		chn.item(0).innerText = row + 1;
		chn.item(1).innerText = editorManager.activeFile.session.getLine(row);
	}
	
	moveItem(bgn, fnsh) {
		const chn = this.list.children;
		this.list.insertBefore(chn.item(bgn), chn.item(fnsh));
	}
	
	makeList(array) {
		var newHTML = "";
		for (let i = 0; i < array.length; i++) {
			newHTML += `
				<li class="mnbm-item">
					<p class="mnbm-prefix" data-action="select"> </p>
					<p class="mnbm-text" data-action="select"> </p>
					<button class="mnbm-erase" data-action="erase"> X </button>
				</li>
			`;
		}
		this.list.innerHTML = newHTML;
		if (this.visible) this.editList(array);
	}
	
	editList(array) {
		const chn = this.list.children;
		for (let i = 0; i < array.length; i++) {
			this.setItemRow(chn.item(i), array[i]);
		}
	}
	
	clearList() {
		this.list.innerHTML = "";
	}
}