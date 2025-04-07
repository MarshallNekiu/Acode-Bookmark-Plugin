
export default class RegexManager {
	
	constructor() {
		this.list = tag("ul", { className: "mnbm-list" });
		this.visible = false;
	}
	
	async init() {
		this.addRegex("com\\.termux", "::");
		this.addRegex("file:\\/\\/\\/", "///");
		
		this.list.addEventListener("click", async (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
        	this.removeRegex(Array.prototype.indexOf.call(this.list.children, e.target.parentElement));
        	return;
      }
		});
	}
	
	addRegex() {
		const listItem = `
	    <li class="mnbm-item">
	      <input class="mnbm-prefix" data-acton="select" placeholder="RegEx: e.g com\\.termux" />
	      <input class="mnbm-text" data-action="select" placeholder="SliceMatch: e.g ::" />
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		this.list.insertAdjacentHTML("beforeend", listItem);
	}
	
	removeRegex(idx) {
		this.list.children.item(idx).remove();
	}
	
	format(x) {
		for (let i = 0; i < this.list.children.length; i++) {
			const r = new RegExp(this.list.children.item(i).firstElementChild.value);
			if (x.search(r) > -1) {
				x = x.split(this.list.children.item(i).children.item(1).value).pop()
			}
		}
	  return x
	}
}