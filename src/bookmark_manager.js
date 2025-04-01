
export default class BookmarkManager {
	
	constructor () {
		this.panel = tag("section", {className: "mnbm-window"});
		this.panel.innerHTML = `
		  <div class="mnbm-content">
		    <div class="mnbm-top">
		      <div class="mnbm-left">
		        <button class="mnbm-add" data-action="add"> Add </button>
		        <button class="mnbm-save" data-action="save"> Save </button>
		        <button class="mnbm-load" data-action="load"> Load </button>
		        <button class="mnbm-file" data-action="file"> File </button>
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
	
	addLine(ln, idx) {
		const listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> Erase </button>
	    </li>
		`;
		const last = this.list.childElementCount;
  	this.list.insertAdjacentHTML("beforeend", listItem);
  	this.setLine(last, ln);
  	if (idx != last) this.moveItem(last, idx); 
	}
	
	setLine(idx, ln) {
		const chn = this.list.children.item(idx).children;
		chn.item(0).innerText = (ln + 1) + ":";
		chn.item(1).innerText = editorManager.activeFile.session.getLine(ln);
	}
	
	setItem(itm, ln) {
		const chn = itm.children;
		chn.item(0).innerText = (ln + 1) + ":";
		chn.item(1).innerText = editorManager.activeFile.session.getLine(ln);
	}
	
	setList(array) {
		var newHTML = "";
		for (let i = 0; i < array.length; i++) {
			newHTML += `
				<li class="mnbm-item">
					<p class="mnbm-prefix" data-acton="select"> </p>
					<p class="mnbm-text" data-action="select"> </p>
					<button class="mnbm-erase" data-action="erase"> Erase </button>
				</li>
			`;
		}
		this.list.innerHTML = newHTML;
		if (this.visible) this.writeList([...array]);
	}
	
	writeList(array) {
		const chn = this.list.children;
		for (let i = 0; i < array.length; i++) {
			this.setItem(chn.item(i), array[i]);
		}
	}
	
	moveItem(bgn, fnsh) {
		const chn = this.list.children;
		this.list.insertBefore(chn.item(bgn), chn.item(fnsh));
	}
	
	removeItem(idx) {
		this.list.children.item(idx).remove();
	}
	
	clear() {
		this.list.innerHTML = "";
	}
}