
export pathSplit(path) {
	const split = [""];
	for (let i = 0; i < path.length - 1; i++) {
		split[-1] += path[i];
		if (path[i] == "/" && != path[i + 1] == "/") split.push([""]);
	}
	return split;
}