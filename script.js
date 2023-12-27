var taskArray = []
var currentGroup = -1;

loadData();
updateGroupList();
updateTaskList();



function saveData() {
	localStorage.setItem('taskArray', JSON.stringify(taskArray));
}

function loadData() {
	taskArray = JSON.parse(localStorage.getItem('taskArray')) ?? [];
}

function updateInfo() {
	if (taskArray.length == 0) return;
	if (currentGroup < 0 || currentGroup >= taskArray.length) return;

	document.getElementById('task-title').textContent = taskArray[currentGroup].name;
	if (taskArray[currentGroup].contents.length > 0) {
		let done = 0;
		for (let task of taskArray[currentGroup].contents) {
			if (task.col == 2) done++;
		}
		let bar = document.getElementById('progress-bar');
		bar.textContent = `${done} / ${taskArray[currentGroup].contents.length}`;
		bar.style.background = `linear-gradient(90deg, #9D8 ${Math.floor(100 * done / taskArray[currentGroup].contents.length)}%, #DDD ${Math.floor(100 * done / taskArray[currentGroup].contents.length)}%)`;
	}
	else {
		let bar = document.getElementById('progress-bar');
		bar.textContent = 'Add a task';
		bar.style.background = '#DDD';
	}
}

function parseImages(p) {
	const regex = /img\(([^)]+)\)/;
	var match = regex.exec(p.textContent);
	if (match) p.innerHTML = p.textContent;
	while (match) {
		p.innerHTML = p.innerHTML.replace(match[0], `<img src='${match[1]}' style='display: block; max-width: 100%; margin: auto' alt='${match[1]}'>`);
		match = regex.exec(p.innerHTML);
	}
}

function updateTaskList() {
	var tlist = document.getElementsByClassName("task-list");
	for (let i = 0; i < 3; i++) while (tlist[i].firstChild) tlist[i].removeChild(tlist[i].firstChild); // clear list

	if (taskArray.length == 0) return;
	if (currentGroup < 0 || currentGroup >= taskArray.length) return;
	updateInfo();
	
	for (let id in taskArray[currentGroup].contents) {
		let task = taskArray[currentGroup].contents[id];

		// task text
		var p = document.createElement("p");
		p.textContent = task.text;
		parseImages(p);

		// task controls
		let d = document.createElement('div'); // container
		let b1 = document.createElement('button');
		let b2 = document.createElement('button');
		let b3 = document.createElement('button');
		b1.innerHTML = `<span class="material-icons">clear</span>`;
		b2.innerHTML = `<span class="material-icons">drive_file_rename_outline</span>`;
		b3.innerHTML = `<span class="material-icons">${task.col < 2 ? 'chevron_right' : 'chevron_left'}</span>`;
		b1.onclick = function() {
			document.getElementById(`task-${id}`).classList.add('anim');
			setTimeout(function() {
				removeTask(id);
			}, 200);
		}
		b2.onclick = function() {
			disableTaskEditing(false);
			enableTaskEditing(id);
		}
		b3.onclick = function () {
			task.col += task.col < 2 ? 1 : -1;
			saveData();
			document.getElementById(`task-${id}`).classList.add('anim');
			setTimeout(function() {
				updateTaskList();
				anim(id);
			}, 200);
		}
		d.appendChild(b1);
		d.appendChild(b2);
		d.appendChild(b3);

		// task container
		let taskDiv = document.createElement('div');
		taskDiv.classList.add('task-item');
		switch (task.col) {
		case 0: taskDiv.classList.add('pending'); break;
		case 1: taskDiv.classList.add('progress'); break;
		case 2: taskDiv.classList.add('done'); break;
		}
		taskDiv.id = `task-${id}`;
		taskDiv.appendChild(p); // text on top
		taskDiv.appendChild(d); // controls below
		tlist[task.col].appendChild(taskDiv); // add div to list
	}
}

function enableTaskEditing(n, clear = false) {
	var taskDiv = document.getElementById(`task-${n}`);
	if (taskDiv.firstChild.tagName == 'P') {
		var input = document.createElement('input');
		input.value = clear ? '' : taskArray[currentGroup].contents[n].text;
		input.type = 'text';
		input.maxLength = '256';
		input.addEventListener('keyup', e => {
			if (e.key == 'Enter') {
				disableTaskEditing(input.value.trim().length);
			}
			if (e.key == 'Escape') {
				disableTaskEditing(false);
			}
		});

		taskDiv.removeChild(taskDiv.firstChild);
		taskDiv.insertBefore(input, taskDiv.firstChild);
		input.focus();

		taskDiv.lastChild.children[1].innerHTML = `<span class="material-icons">check</span>`;
		taskDiv.lastChild.children[1].onclick = function() {
			disableTaskEditing(input.value.trim().length);
		}
	}
}

function disableTaskEditing(save) {
	var tlist = document.getElementsByClassName("task-list");
	for (let i = 0; i < 3; i++) {
		for (let taskDiv of tlist[i].children) {
			if (taskDiv.firstChild.tagName == 'INPUT') {
				let taskId = Number(taskDiv.id.split('-')[1]);

				if (save) {
					taskArray[currentGroup].contents[taskId].text = taskDiv.firstChild.value.trim();
					saveData();
				}

				var p = document.createElement('p');
				p.textContent = taskArray[currentGroup].contents[taskId].text;
				parseImages(p);

				taskDiv.removeChild(taskDiv.firstChild);
				taskDiv.insertBefore(p, taskDiv.firstChild);

				taskDiv.lastChild.children[1].innerHTML = `<span class="material-icons">drive_file_rename_outline</span>`;
				taskDiv.lastChild.children[1].onclick = function() {
					disableTaskEditing(false);
					enableTaskEditing(taskId);
				}
			}
		}
	}
}

function anim(id) {
	var taskDiv = document.getElementById(`task-${id}`);
	taskDiv.classList.add('anim');
	setTimeout(function() {
		taskDiv.classList.remove('anim');
	}, 2);
}

function addTask(c) {
	taskArray[currentGroup].contents.push({text: "New task", col: c});
	saveData();
	updateTaskList();
	anim(taskArray[currentGroup].contents.length - 1);
	enableTaskEditing(taskArray[currentGroup].contents.length - 1, true);
}

function removeTask(id) {
	taskArray[currentGroup].contents.splice(id, 1);
	saveData();
	updateTaskList();
}

function clearTasks() {
	for (let i = 0; i < taskArray[currentGroup].contents.length; i++) {
		if (taskArray[currentGroup].contents[i].col == 2) {
			taskArray[currentGroup].contents.splice(i, 1);
			i--;
		}
	}
	saveData();
	for (let taskDiv of document.getElementsByClassName('task-item done')) {
		taskDiv.classList.add('anim');
	}
	setTimeout(function() {
		updateTaskList();
	}, 200);
}



function updateGroupList() {
	var glist = document.getElementsByClassName("group-list")[0];
	while (glist.firstChild) glist.removeChild(glist.firstChild); // clear list
	
	for (let id in taskArray) {
		let p = document.createElement('p');
		p.textContent = taskArray[id].name;
		p.onclick = function () { changeGroup(id); }

		let d = document.createElement('div'); // container
		let b1 = document.createElement('button');
		let b2 = document.createElement('button');
		b1.innerHTML = `<span class="material-icons">drive_file_rename_outline</span>`;
		b2.innerHTML = `<span class="material-icons">delete_outline</span>`;
		b1.onclick = function() {
			enableGroupEditing(id);
		}
		b2.onclick = function() {
			removeGroup(id);
		}
		d.appendChild(b1);
		d.appendChild(b2);

		let groupDiv = document.createElement('div');
		groupDiv.classList.add('group-item');
		if (id == currentGroup) groupDiv.classList.add('selected');
		groupDiv.id = `group-${id}`;

		groupDiv.appendChild(p); // text first
		groupDiv.appendChild(d); // controls next
		glist.appendChild(groupDiv); // add group to list
	}
}

function enableGroupEditing(n, clear = false) {
	var groupDiv = document.getElementById(`group-${n}`);
	if (groupDiv.firstChild.tagName == 'P') {
		groupDiv.removeChild(groupDiv.firstChild);
		var input = document.createElement('input');
		input.value = clear ? '' : taskArray[n].name;
		input.type = 'text';
		input.maxLength = '32';
		input.addEventListener('keyup', e => {
			if (e.key == 'Enter') {
				disableGroupEditing(input.value.trim().length);
			}
			if (e.key == 'Escape') {
				disableGroupEditing(false);
			}
		});
		groupDiv.insertBefore(input, groupDiv.firstChild);
		input.focus();

		groupDiv.lastChild.children[0].innerHTML = `<span class="material-icons">check</span>`;
		groupDiv.lastChild.children[0].onclick = function() {
			disableGroupEditing(input.value.trim().length);
		}
	}
}

function disableGroupEditing(save) {
	var glist = document.getElementsByClassName("group-list")[0];
	for (let groupDiv of glist.children) {
		if (groupDiv.firstChild.tagName == 'INPUT') {
			let groupId = Number(groupDiv.id.split('-')[1]);

			if (save) {
				taskArray[groupId].name = groupDiv.firstChild.value.trim();
				saveData();
				updateInfo();
			}
			
			var p = document.createElement('p');
			p.textContent = taskArray[groupId].name;
			p.onclick = function () { changeGroup(groupId); }
			
			groupDiv.removeChild(groupDiv.firstChild);
			groupDiv.insertBefore(p, groupDiv.firstChild);

			groupDiv.lastChild.children[0].innerHTML = `<span class="material-icons">drive_file_rename_outline</span>`;
			groupDiv.lastChild.children[0].onclick = function() {
				disableGroupEditing(false);
				enableGroupEditing(groupId);
			}
		}
	}
}

function addGroup() {
	taskArray.push({name: 'New group', contents: []});
	saveData();
	if (taskArray.length == 1) {
		let h = document.getElementsByClassName('header');
		for (let e of h) e.lastElementChild.disabled = false;
	}
	updateGroupList();
	updateTaskList();
	enableGroupEditing(taskArray.length - 1, true);
}

function removeGroup(id) {
	if (taskArray[id].contents.length > 1) {
		if (!confirm(`Removing this group will discard ${taskArray[id].contents.length} tasks.\nProceed?`)) {
			return;
		}
	}

	taskArray.splice(id, 1);
	saveData();
	if (id == currentGroup) {
		if (currentGroup > 0) currentGroup -= 1;
		updateTaskList();
	}
	if (taskArray.length == 0) {
		let h = document.getElementsByClassName('header');
		for (let e of h) e.lastElementChild.disabled = true;
	}
	updateGroupList();
}

function changeGroup(g) {
	currentGroup = g;
	for (let e of document.getElementsByClassName('group-list')[0].children) e.classList.remove('selected');
	var groupDiv = document.getElementById(`group-${g}`);
	groupDiv.classList.add('selected');
	updateTaskList();

	let h = document.getElementsByClassName('header');
	for (let e of h) e.lastElementChild.disabled = false;
}