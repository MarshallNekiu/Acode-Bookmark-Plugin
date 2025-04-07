
export default class Debugger {
	
	constructor () {
		this.controlPanel = tag("div", {className: "mnbm-control-panel"});
		this.controlPanel.innerHTML = `
      <button class="mnbm-debug-data" data-action="data"> Data </button>
      <button class="mnbm-debug-buffer" data-action="buffer"> Buffer </button>
      <button class="mnbm-debug-file" data-action="file"> File </button>
      <button class="mnbm-debug-array" data-action="array"> Array </button>
		`;
		this.list = tag("ul", {className: "mnbm-list"});
		this.visible = false;
		
		this.list.addEventListener("click", (e) => {
      const target = e.target.closest("[data-action]");
      if (!target) return;

      switch (target.dataset.action) {
        case "erase":
          this.unLog(target.parentElement);
          return;
      }
    });
	}
	
	log(x) {
		const listItem = `
	    <li class="mnbm-item">
	      <p class="mnbm-prefix" data-acton="select"> </p>
	      <p class="mnbm-text" data-action="select"> </p>
	      <button class="mnbm-erase" data-action="erase"> X </button>
	    </li>
		`;
		this.list.insertAdjacentHTML("beforeend", listItem);
		this.list.lastElementChild.firstElementChild.innerText = (this.list.childElementCount - 1) + ":";
		this.list.lastElementChild.children.item(1).innerText = x;
		this.list.lastElementChild.children.item(1).scrollLeft = 100000;
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