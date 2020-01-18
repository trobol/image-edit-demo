const input = document.getElementById('image');
const box = document.getElementById('box');
const canvas = document.getElementById('canvas');



const rect = { left: { x: 0, y0: 0 }, right: { x: 100, y: 100 } };
const imageSize = { x: 200, y: 200 };

const undoStack = [];

const image = new Image();
image.onload = function () {
	imageSize.x = image.width;
	imageSize.y = image.height;
	rect.right.x = imageSize.x;
	rect.right.y = imageSize.y;
	rect.left.x = 0;
	rect.left.y = 0;
	draw();
	URL.revokeObjectURL(image.src);
}

input.onchange = (e) => {
	image.src = URL.createObjectURL(input.files[0]);
}

var crop = false;
function draw() {
	const width = rect.right.x - rect.left.x;
	const height = rect.right.y - rect.left.y;
	canvas.width = width;
	canvas.height = height;

	box.style.left = rect.left.x + 'px';
	box.style.top = rect.left.y + 'px';
	box.style.width = width + 'px';
	box.style.height = height + 'px';

	var ctx = canvas.getContext('2d');
	if (crop)
		ctx.drawImage(image, rect.left.x, rect.left.y, width, height, 0, 0, width, height);
	else
		ctx.drawImage(image, 0, 0, width, height);
}

function saveCanvas() {
	canvas.toBlob(blob => {
		const a = document.createElement('a');
		document.body.appendChild(a);
		const url = window.URL.createObjectURL(blob);
		a.href = url;
		a.download = "canvas.png";
		a.click();
		setTimeout(() => {
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
		}, 0)

	})
}

function applyChange() {
	canvas.toBlob(blob => {
		image.src = window.URL.createObjectURL(blob);
	});
	undoStack.length = 0;
}
const cropButton = document.getElementById('crop');
const resizeButton = document.getElementById('resize');

cropButton.onclick = e => {
	cropButton.disabled = true;
	resizeButton.disabled = false;
	crop = true;
	applyChange();
}
resizeButton.onclick = e => {
	resizeButton.disabled = true;
	cropButton.disabled = false;
	crop = false;
	applyChange();
}


document.getElementById('undo').onclick = undo;
document.getElementById('apply').onclick = applyChange;


//BOX STUFF

Math.clamp = function (a, min, max) {
	return Math.min(Math.max(a, min), max);
};

function undo() {
	const action = undoStack.pop();
	Object.assign(rect.right, action.right);
	Object.assign(rect.left, action.left);
	draw();
}

//undo
document.addEventListener("keydown", e => {
	var evtobj = e || window.event;
	if (evtobj.keyCode == 90 && evtobj.ctrlKey) {
		undo();
	}
});


function handleMoveEvent(vector) {
	return e => {
		undoStack.push({ right: { ...rect.right }, left: { ...rect.left } });
		var startX = e.clientX;
		var startY = e.clientY;
		const handleMove = e => {
			e.preventDefault();
			vector.x -= startX - e.clientX;
			vector.y -= startY - e.clientY;
			vector.x = Math.clamp(vector.x, 0, imageSize.x);
			vector.y = Math.clamp(vector.y, 0, imageSize.y);
			startX = e.clientX;
			startY = e.clientY;
			draw();
		}

		document.addEventListener("mousemove", handleMove);

		const endDrag = () => {

			document.removeEventListener('mousemove', handleMove);
			document.removeEventListener('mouseup', endDrag);
		}
		document.addEventListener("mouseup", endDrag);
	}
}
document.getElementById('bottomRight').onmousedown = handleMoveEvent(rect.right);

document.getElementById('topLeft').onmousedown = handleMoveEvent(rect.left);