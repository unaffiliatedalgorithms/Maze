/*
Global variables 
*/

var _maze = [];
var _distance = [];
var _path = [];
var _w = 100;
var _h = 75;
var _startx = 0;
var _starty = 0;
var _endx = _w-1;
var _endy = _h-1;
var _max_dist;
var _draw = 0;

// variables which contain sizes of the initial screen. These change the sizes of the squares and the lines between them.
var _emscale;
var _wall = 0.2;





// creating elements listeners on the fly
var _control_names= [];
_control_names.push(["scale","Display Scale",_VIEWFIELD,100]);
_control_names.push(["xcenter","X-Center(width/2?)",_VIEWFIELD,_w/2]);
_control_names.push(["ycenter","Y-Center(height/2?)",_VIEWFIELD,_h/2]);
_control_names.push(["","",_PARAGRAPH]);
_control_names.push(["generate","Generate Maze",_BUTTON]);
_control_names.push(["w","Maze Width",_ENTERFIELD,_w]);
_control_names.push(["h","Maze Height",_ENTERFIELD,_h]);
_control_names.push(["","",_PARAGRAPH]);
_control_names.push(["distance","Distance Map",_BUTTON]);
_control_names.push(["startx","Start (x-value)",_ENTERFIELD,0]);
_control_names.push(["starty","Start (y-value)",_ENTERFIELD,0]);
_control_names.push(["","",_PARAGRAPH]);
_control_names.push(["path","Pathfinder",_BUTTON]);
_control_names.push(["endx","Target (x-value)",_ENTERFIELD,_w-1]);
_control_names.push(["endy","Target (y-value)",_ENTERFIELD,_h-1]);
_control_names.push(["","",_PARAGRAPH]);
_control_names.push(["load","Load",_FILE]);
_control_names.push(["save","Save",_BUTTON]);




function press_generate(){
	fields = ["w","h"];
	get_fields(fields);
	_xcenter = _w/2;
	_ycenter = _h/2;
	_startx = 0;
	_starty = 0;
	_endx = _w-1;
	_endy = _h-1;
	fields = ["xcenter","ycenter","startx","starty","endx","endy"];
	set_fields(fields);
	_distance=[];
	_path=[];
	generate_maze();
	_draw = 0;
	draw_scene();
}

function press_distance(){
	fields = ["startx","starty"];
	get_fields(fields);
	distance_map();
	_draw = 1;
	draw_scene();
}

function press_path(){
	fields = ["startx","starty","endx","endy"];
	get_fields(fields);
	if(_distance.length<1){
		distance_map();
	}
	if(_distance[_startx][_starty]!=0){
		distance_map();
	}
	path_finder();
	_draw = 2;
	draw_scene();
}

function initiate(){
	control_setup(_control_names);
	generate_maze();
	draw_scene();
	window.addEventListener('resize', draw_scene);
}

function press_save() {  
	//start with an emptry csv file string
	var csv = _w.toString()+","+_h.toString()+"\n"; 
	//store the coordinates for each cell.
	// Why do we dislike normal for loops so?
	_maze.forEach(function(column) {
		column.forEach(function(row){
			csv += row.join(',');  
			csv += "\n";  
		});
	});
	// Remove the last line break, as this will create a broken entry when reading from the csv file.
	csv = csv.slice(0,csv.length-1);
	// the string "a" specifies what type of html element will be created (element of tag <a> (hyperlink) in this case).
	// The element needs to be a hyperlink for the download to work.
	var hiddenElement = document.createElement('a'); 
	// store the data into this hidden element
	hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);  
	hiddenElement.target = '_blank';  
	
	//provide the name for the CSV file to be downloaded  
	hiddenElement.download = 'Maze.csv'; 
	// click to download :)
	hiddenElement.click();  
} 

function press_load() {
	// get the file input field from the html document
	var load = document.getElementById("load");
	/* 
	This script is called when a file is selected. We need this if condition to check if a file was actually selected. 
	Otherwise pressing cancel could result in crash. Javascript crashes are not fun.
 	*/
	if (load.files && load.files[0]) {
		// file reader stuff... There was to base off an outside snippet
		// https://developer.mozilla.org/en-US/docs/Web/API/FileReader/onload for reference of what going on here.
		let reader = new FileReader();
		reader.readAsBinaryString(load.files[0]);
		reader.onload = function (e) {
			// text content of the file
			var data = e.target.result;
			// store the data into a cell collection
			_maze = parseData(data);
			// sort for futher use
			_xcenter = _w/2;
			_ycenter = _h/2;
			var _startx = 0;
			var _starty = 0;
			var _startx = _w-1;
			var _starty = _h-1;
			var _end = [_w-1,_h-1];
			fields = ["w","h","xcenter","ycenter","startx","starty","endx","endy"];
			set_fields(fields);
			_distance=[];
			_path=[];
			// and draw
			_draw = 0;
			draw_scene();
		}
	}
}

// parse are text file containing cell coordinates
function parseData(data){
	// target for cell storage
	let csvData = [];
	// line break split to array of the input data string
	let lbreak = data.split("\n");
	let first = lbreak.splice(0,1)[0];
	first = first.split(",");
	_w = parseInt(first[0]);
	_h = parseInt(first[1]);
	/*
	mmhm arrow notations in javascript
	For each line in the file, separate numbers based on the comma
	and store the values as integers into a list.
	*/
	var i = 0;
	lbreak.forEach(res => {
		if(i%_h==0){
			csvData.push([]);
		}
		var n = res.split(",");
		var n2 = [];
		for(var j=0;j<n.length;j+=2){
			n2.push([parseInt(n[j]),parseInt(n[j+1])]);
		}
		csvData[csvData.length-1].push(n2);
		i++;
	});
	// voila, the extracted board
	return csvData;
}

function generate_maze(){
	_maze=[];
	// already visited locations
	var visited = [];
	// iniate empty maze
	for (var i=0;i<_w;i++){
		_maze.push([]);
		visited.push([]);
		for (var j=0;j<_h;j++){
			visited[i].push(false);
			_maze[i].push([]);
		}
	}
	// it doesn't matter where the maze is started, so it's best to start at 0,0
	path = [[0,0]];
	while(path.length>0){
		// current location being investigated
		var c = path[path.length-1];
		// this location now has been visited
		visited[c[0]][c[1]] = true;
		// go through all neighbors and check those which haven't been visited
		var neighbors = [];
		if(c[0]>0&&!visited[c[0]-1][c[1]]){
			neighbors.push([-1,0]);
		}
		if(c[0]<_w-1&&!visited[c[0]+1][c[1]]){
			neighbors.push([1,0]);
		}
		if(c[1]>0&&!visited[c[0]][c[1]-1]){
			neighbors.push([0,-1]);
		}
		if(c[1]<_h-1&&!visited[c[0]][c[1]+1]){
			neighbors.push([0,1]);
		}
		var l = neighbors.length;
		// there are still free neighbors
		if (l>0){
			// choose a random neighbor
			var r = Math.floor(Math.random()*l);
			path.push([c[0]+neighbors[r][0],c[1]+neighbors[r][1]]);
			_maze[c[0]][c[1]].push([neighbors[r][0],neighbors[r][1]]);
			// for bidirectional connectivity
			_maze[c[0]+neighbors[r][0]][c[1]+neighbors[r][1]].push([-neighbors[r][0],-neighbors[r][1]]);
		}
		// If there are no free neighbors we have to backtrack. This means removing the last element from the path.
		else {
			path.pop();
		}
	}
}

function offsets(){
	var main = document.getElementById("main");
	var w = main.width;
	var  h = main.height;
	var ux = w/_w;
	var uy = h/_h;
	var unit = ux;
	if(uy<ux){
		unit = uy;
	}
	unit = unit*_scale/100;
	var minx = 0;
	var miny = 0;
	var startx = -(_w-_xcenter)*unit+w/2;
	var starty = -(_h-_ycenter)*unit+h/2;
	if(startx<0){
		minx = -Math.ceil(startx/unit);
	}
	if(starty<0){
		miny = -Math.ceil(starty/unit);
	}
	return [unit,startx,starty,minx,miny];
}

function empty_maze(){
	// get the canvas element in the html document
	var main = document.getElementById("main");
	// we do this because the canvas width was never explicitly defined in the css or html file
	// If we don't do this the drawing is blurred.
	// this comment will still need to be reviewed for a better explanation.
	main.width = main.clientWidth;
	main.height = main.clientHeight;
	var w = main.width;
	var  h = main.height;
	// we plan on making a 2D image. The other context option would be using WebGL(3d)
	var context = main.getContext('2d');
	// This unit is the size in EM (relative text size) units of a single grid element
	var temp = offsets();
	// clear and previous drawing on the whole canvas
	context.clearRect(0,0,w,h);
	//This is used to avoid blurring of grid lines and similar. Depending if the canvas proportions are even or odd numbers in pixels and might shift the canvas coordinates by 0.5 pixels.
	if(w%2==0){
		context.translate(0.5, 0);
	}
	if(h%2==0){
		context.translate(0, 0.5);
	}
	context.strokeStyle = "rgba(255, 255, 255, 1)";
	context.fillStyle = "rgba(255, 255, 255, 1)";
	// go through labyrinth blocks
	for(var i=temp[3]; i<_w; i++){
		var x = temp[1]+i*temp[0];
		if(x>w){
			break;
		}
		for(var j=temp[4]; j<_h; j++){
			var y = temp[2]+j*temp[0];
			if(y>h){
				break;
			}
			context.beginPath();
			context.fillRect(Math.floor(x), Math.floor(y), Math.ceil(temp[0]+1), Math.ceil(temp[0]+1));
			context.stroke();
		}
	}
	context.strokeStyle = "rgba(0, 0, 0, 1)";
	context.fillStyle = "rgba(0, 0, 0, 1)";
	// hollow out all labyrinth blocks
	var l = temp[0]*_wall;
	var s = temp[0]-2*l;
	for(var i=temp[3]; i<_w; i++){
		var x = temp[1]+i*temp[0];
		if(x>w){
			break;
		}
		for(var j=temp[4]; j<_h; j++){
			var y = temp[2]+j*temp[0];
			if(y>h){
				break;
			}
			context.beginPath();
			context.fillRect(x+l, y+l, s+1, s+1);
			context.stroke();
		}
	}
}
	
function draw_maze(){
	var main = document.getElementById("main");
	// we do this because the canvas width was never explicitly defined in the css or html file
	// If we don't do this the drawing is blurred.
	// this comment will still need to be reviewed for a better explanation.
	var w = main.width;
	var  h = main.height;
	// we plan on making a 2D image. The other context option would be using WebGL(3d)
	var context = main.getContext('2d');
	// This unit is the size in EM (relative text size) units of a single grid element
	var temp = offsets();
	//This is used to avoid blurring of grid lines and similar. Depending if the canvas proportions are even or odd numbers in pixels and might shift the canvas coordinates by 0.5 pixels.
	if(w%2==0){
		context.translate(0.5, 0);
	}
	if(h%2==0){
		context.translate(0, 0.5);
	}
	context.strokeStyle = "rgba(0, 0, 0, 1)";
	context.fillStyle = "rgba(0, 0, 0, 1)";
	// hollow out all labyrinth corridors
	var l = temp[0]*_wall;
	var s = temp[0]-2*l;
	for(var i=temp[3]; i<_w; i++){
		var x = temp[1]+i*temp[0];
		if(x>w){
			break;
		}
		for(var j=temp[4]; j<_h; j++){
			var y = temp[2]+j*temp[0];
			if(y>h){
				break;
			}
			for(var k=0; k<_maze[i][j].length;k++){
				context.beginPath();
				context.fillRect(x+l*(1+_maze[i][j][k][0]), y+l*(1+_maze[i][j][k][1]), s+1, s+1);
				context.stroke();
			}
		}
	}
}

function draw_path(){
	var main = document.getElementById("main");
	// we do this because the canvas width was never explicitly defined in the css or html file
	// If we don't do this the drawing is blurred.
	// this comment will still need to be reviewed for a better explanation.
	var w = main.width;
	var  h = main.height;
	// we plan on making a 2D image. The other context option would be using WebGL(3d)
	var context = main.getContext('2d');
	// This unit is the size in EM (relative text size) units of a single grid element
	var temp = offsets();
	//This is used to avoid blurring of grid lines and similar. Depending if the canvas proportions are even or odd numbers in pixels and might shift the canvas coordinates by 0.5 pixels.
	if(w%2==0){
		context.translate(0.5, 0);
	}
	if(h%2==0){
		context.translate(0, 0.5);
	}
	// hollow out all labyrinth corridors
	var l = temp[0]*_wall;
	var s = temp[0]-2*l;
	for(var i=0; i<_path.length; i++){
		var xi = _path[i][0];
		var yi = _path[i][1];
		var x = temp[1]+xi*temp[0];
		var y = temp[2]+yi*temp[0];
		var r = Math.floor(i/(_path.length-1)*255);
		var b = 255-r;
		var color = "rgba("+r.toString()+",0,"+b.toString()+",1)";
		context.strokeStyle = color;
		context.fillStyle = color;
		context.beginPath();
		context.fillRect(x+l, y+l, s, s);
		context.stroke();
		for(var k=0; k<_maze[xi][yi].length;k++){
			if(i<_path.length-1){
				if((xi+_maze[xi][yi][k][0])==_path[i+1][0]&&(yi+_maze[xi][yi][k][1])==_path[i+1][1]){
					context.beginPath();
					context.fillRect(x+l*(1+_maze[xi][yi][k][0]), y+l*(1+_maze[xi][yi][k][1]), s+1, s+1);
					context.stroke();
				}
			}
			if(i>0){
				if((xi+_maze[xi][yi][k][0])==_path[i-1][0]&&(yi+_maze[xi][yi][k][1])==_path[i-1][1]){
					context.beginPath();
					context.fillRect(x+l*(1+_maze[xi][yi][k][0]), y+l*(1+_maze[xi][yi][k][1]), s+1, s+1);
					context.stroke();
				}
			}
		}
	}
}

function draw_distance(){
	var main = document.getElementById("main");
	// we do this because the canvas width was never explicitly defined in the css or html file
	// If we don't do this the drawing is blurred.
	// this comment will still need to be reviewed for a better explanation.
	var w = main.width;
	var  h = main.height;
	// we plan on making a 2D image. The other context option would be using WebGL(3d)
	var context = main.getContext('2d');
	// This unit is the size in EM (relative text size) units of a single grid element
	var temp = offsets();
	//This is used to avoid blurring of grid lines and similar. Depending if the canvas proportions are even or odd numbers in pixels and might shift the canvas coordinates by 0.5 pixels.
	if(w%2==0){
		context.translate(0.5, 0);
	}
	if(h%2==0){
		context.translate(0, 0.5);
	}
	// hollow out all labyrinth corridors
	var l = temp[0]*_wall;
	var s = temp[0]-2*l;
	for(var i=temp[3]; i<_w; i++){
		var x = temp[1]+i*temp[0];
		if(x>w){
			break;
		}
		for(var j=temp[4]; j<_h; j++){
			var y = temp[2]+j*temp[0];
			if(y>h){
				break;
			}
			var b = Math.floor(_distance[i][j]/_max_dist*255);
			var r = 255-b;
			var color = "rgba("+r.toString()+",0,"+b.toString()+",1)";
			context.strokeStyle = color;
			context.fillStyle = color;
			context.beginPath();
			context.fillRect(x+l, y+l, s, s);
			context.stroke();
			for(var k=0; k<_maze[i][j].length;k++){
				context.strokeStyle = color;
				context.fillStyle = color;
				context.beginPath();
				context.fillRect(x+l*(1+_maze[i][j][k][0]), y+l*(1+_maze[i][j][k][1]), s+1, s+1);
				context.stroke();
			}
		}
	}
}

function distance_map(){
	_distance = [];
	for (var i=0;i<_w;i++){
		_distance.push([]);
		for (var j=0;j<_h;j++){
			_distance[i].push(-1);
		}
	}
	var counter = 0;
	var stack = [[[_startx,_starty],0]];
	while(counter<stack.length){
		var c = stack[counter][0];
		var d = stack[counter][1];
		if(_distance[c[0]][c[1]]<0){
			_distance[c[0]][c[1]] = d;
			var n = _maze[c[0]][c[1]];
			for(var i=0;i<n.length;i++){
				if(_distance[c[0]+n[i][0]][c[1]+n[i][1]]<0){
					stack.push([[c[0]+n[i][0],c[1]+n[i][1]],d+1]);
				}
			}
		}
		_max_dist = d;
		counter++;
	}
}

function path_finder(){
	_path = [];
	_path.push([_endx,_endy]);
	while(_path[_path.length-1][0]!=_startx || _path[_path.length-1][1]!=_starty){
		var c = _path[_path.length-1];
		var n = _maze[c[0]][c[1]];
		var d = _distance[c[0]][c[1]];
		for(var i=0;i<n.length;i++){
			if(_distance[c[0]+n[i][0]][c[1]+n[i][1]]<d){
				_path.push([c[0]+n[i][0],c[1]+n[i][1]]);
			}
		}
	}		
}

function draw_scene(){
	empty_maze();
	draw_maze();
	if(_draw==1) {
		draw_distance();
	}
	else if(_draw==2){
		draw_path();
	}
}