
export default class RegexManager {
	
	constructor() {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
	    <button class="mnbm-back" data-action="back"> ≪ </button>
	    <button class="mnbm-regex-add" data-action="regex-add"> (+.*) </button>
		`;
		this.list = tag("ul", { className: "mnbm-list" } });
		this.visible = false;
		
		this.controlPanel.lastElementChild.addEventListener("click", (e) => this.addRegex());
		
		this.list.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
        	target.parentElement.remove();
        	return;
      }
		});
		
		this.list.addEventListener("dbclick", async (e) => {
      const target = e.target.closest("[data-disabled]");
      if (!target) return;

      switch (target.dataset.disabled) {
        case "true":
        	target.className = "mnbm-item-disabled";
        	target.dataset.disabled = "false";
        	return;
        case "false":
        	target.className = "mnbm-item";
        	target.dataset.disabled = "true";
        	return;
      }
		});
	}
	
	addRegex(rgx = "", sm = "") {
		const listItem = `
	    <li class="mnbm-item" data-disabled="false">
	      <input placeholder="RegEx: e.g com\\.termux" />
	      <input placeholder="SliceMatch: e.g ::" />
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		this.list.insertAdjacentHTML("beforeend", listItem);
		this.list.lastElementChild.firstElementChild.value = rgx;
		this.list.lastElementChild.children.item(1).value = sm;
	}
	
	format(x) {
		const chn = this.list.children;
		
		for (let i = 0; i < chn.length; i++) {
			if (chn.item(i).dataset.disabled == "true") continue;
			const r = new RegExp(chn.item(i).firstElementChild.value);
			if (x.search(r) > -1) x = x.split(chn.item(i).children.item(1).value).pop();
		}
	  return x;
	}
}