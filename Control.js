/*
This is a small set of functions to set up a standardized control interface for javascript simulation programs.
Typically there will a control interface where simulation variables and buttons that can run a stop a simulation.
These functions are advised to be defined in a separate javascript file. Check out some the the website examples

Because of licences (and yada, yada and a miminal degree of properness ;) ) this javascript code (and the related html and css files) are released under the MIT license:

Copyright (c) 2021 Unaffiliated Algorithms

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// These constants are used to set up the html website control interface elements and link in the connected interaction events.
// Button click events
const _BUTTON = 0;
// Field which update corresponding variables immediately 
const _VIEWFIELD = 1;
// Field are used to get updated variables when another function need these variables
// This is a form of  callable getter and setter integrated in the html site
const _ENTERFIELD = 2;
// This is mostly used to load files. The actually loading function usually has to be adapted for each simulation
const _FILE = 3;
// This is used to paragraph for spacing of the control elements on the html site
const _PARAGRAPH = 4;

/* We will receive an array of global variables (which will have a prefixed _ in the javascript code) which will be mapped to 
to the html site along with the display name, the control element type and an initial value
control_names elements have the format ["name","display text","Field type","Value"]
The control panel in the html site MUST have the id 'control'
*/
function control_setup(control_names){
	for(var i=0;i<control_names.length;i++){
		var elem;
		// check the specific functions futher down in the code. The code for creating paragraphs is directly integrated here.
		switch(_control_names[i][2]){
			case _BUTTON:
				buttonfield(control_names[i][0],control_names[i][1]);
				break;
			case _VIEWFIELD:
				viewfield(control_names[i][0],control_names[i][1],control_names[i][3]);
				break;
			case _ENTERFIELD:
				enterfield(control_names[i][0],control_names[i][1],control_names[i][3]);
				break;
			case _FILE:
				filefield(control_names[i][0],control_names[i][1]);
				break;
			case _PARAGRAPH:
				var parent = document.getElementById('control');
				elem = document.createElement('p');
				parent.appendChild(elem);
			default:
				//nope
		}
	}
}

// update the variables in contained as string in field by reading from the html elements
function get_fields(fields){
	for(var i=0;i<fields.length;i++){
		var temp = document.getElementById(fields[i]);
		// add a _ to the global javascript variable name
		window["_"+fields[i]] = parseFloat(temp.value);
	}
}

// set field values according to the current variable values in the program
function set_fields(fields){
	for(var i=0;i<fields.length;i++){
		var temp = document.getElementById(fields[i]);
		temp.value = window["_"+fields[i]];
	}
}

// create an html element for the control variable of interest
// This is for parameters which should update immediately when changed on the html site.
// This creates input fields which are used for number
// This function forces a scene redraw when the variable is changed
function viewfield(name,display,val){
	var txt = document.createTextNode(display);
	var parent = document.getElementById('control');
	parent.appendChild(txt);
	elem = document.createElement('input');
	elem.setAttribute('type','number');
	elem.setAttribute('class','dimensions');
	elem.setAttribute('id',name);
	elem.value = val;
	parent.appendChild(elem);
	window["_"+name]  = val;
	function func(){
		var temp = document.getElementById(name);
		window["_"+name] = parseFloat(temp.value);
		// This function forces a scene redraw when the variable is changed
		draw_scene();
	}
	// Add a enter and a focus listener to the newly created element.
	create_enter_listener(name,func);
	create_focus_listener(name,func);
}

// create an html element for the control variable of interest
// This is for parameters which should update immediately when changed on the html site.
// This creates input fields which are used for number
// This doesn't add any active listener function
function enterfield(name,display,val){
	var txt = document.createTextNode(display);
	var parent = document.getElementById('control');
	parent.appendChild(txt);
	elem = document.createElement('input');
	elem.setAttribute('type','number');
	elem.setAttribute('class','dimensions');
	elem.setAttribute('id',name);
	elem.value = val;
	parent.appendChild(elem);
	window["_"+name]  = val;
}

// create an html button for the control function of interest
// the function called will be related to the html element id name
// with the format 'press_' + element name, as this function will be bound to the button.
function buttonfield(name,display){
	var parent = document.getElementById('control');
	elem = document.createElement('button');
	elem.setAttribute('type','button');
	elem.setAttribute('class','dimensions');
	elem.setAttribute('id',name);
	var txt = document.createTextNode(display);
	elem.appendChild(txt);
	parent.appendChild(elem);
	create_button_listener(name,window['press_'+name]);
}

//The file listener is setup very similarly to the button listener.
function filefield(name,display){
	var parent = document.getElementById('control');
	elem = document.createElement('input');
	elem.setAttribute('type','file');
	elem.setAttribute('class','dimensions');
	elem.setAttribute('id',name);
	var txt = document.createTextNode(display);
	elem.appendChild(txt);
	parent.appendChild(elem);
	create_file_listener(name,window['press_'+name]);
}


// A general purpose function to create listeners for input fields which react to the enter button being pressed in said field.
function create_enter_listener(id,func){
	// find the html element with id="..." 
	// this allows us to look at or change properties of this element.
	temp = document.getElementById(id);
	// we add "something" (a "listener") which reacts when the Enter key is pressed
	// When Enter is pressed, the function func will be executed.
	temp.addEventListener('keydown', function onEvent(e) {
		if (e.key === "Enter") {
			func();
		}
	});
}

// This function is such the mobile website also can have similar functionality to the code above
function create_focus_listener(id,func){
	temp = document.getElementById(id);
	document.getElementById(id).addEventListener("focusout",func);
}

// Similar to the above, except that we can more easier specify that an html button was clicked
// Interesting this would also work for any html element with click functionality
function create_button_listener(id,func){
	document.getElementById(id).addEventListener("click",func);
}

// Once again, this time reacting to the change attributed (this is import for loading files)
function create_file_listener(id,func){
	document.getElementById(id).addEventListener("change",func);
	//document.getElementById(id).onchange = func;
}
