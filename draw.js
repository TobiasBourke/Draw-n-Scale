//Declare Canvas

var scaleType = "ScaleTwoX";

var canvasWidth = 624;
var canvasHeight = 624;

var scaleLevel = 16;

var bufferWidth = canvasWidth / scaleLevel;
var bufferHeight = canvasHeight / scaleLevel;

var currentColour = 0xDEEF12;

var pixelBufferSize = bufferWidth * bufferHeight;

var pixelBuffer = [];

var mouseIsDown = false;

var colourDropper = false,
	flood = false;

for (var i = 0; i < pixelBufferSize; i++) {
	pixelBuffer[i] = 0xFFFFFF;
}

var canvas = document.getElementById('canvas');
canvas.width = canvasWidth;
canvas.height = canvasHeight;

var ctx = canvas.getContext('2d');

//Window load

window.onload = function() {
  draw();
  updateCurrentColour()
  updateTextboxs();
};

//Movment functions
canvas.onmousedown = function(e)
{
	mouseIsDown = true;
	var rect = canvas.getBoundingClientRect();
	
	if(colourDropper)
	{	
		var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
		var data = imageData.data;
		currentColour = getColourCanvas(data,e.pageX - rect.left, e.pageY - rect.top);
		updateColourPicker();
		colourDropper = false;
	}
	else if(flood)
	{
		floodFill(e.pageX - rect.left, e.pageY - rect.top);
		flood = false;
	}
	else
	{
		writeToBuffer(e.pageX - rect.left, e.pageY - rect.top);
		draw();
	}
}

canvas.onmouseup = function(e)
{
	mouseIsDown = false;
}

canvas.onmousemove = function(e)
{	
	var rect = canvas.getBoundingClientRect();
	var x = e.pageX - rect.left;
	var y = e.pageY - rect.top;

	if( x < 0 || x > canvasWidth || y < 0 || y > canvasHeight)
	{	
		mouseIsDown = false;
	}

	if(mouseIsDown){
		
		writeToBuffer(x, y);
		draw();
	}
}

//Draw functions

function writeToBuffer(x, y)
{	
	x = (x - x % scaleLevel) / scaleLevel;
	y = (y - y % scaleLevel) / scaleLevel;
	pixelBuffer[x + y * bufferWidth] = currentColour;
}

function draw()
{
	var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	var data = imageData.data;

	//Scale function here

	switch( scaleType )
	{
		case "ScaleTwoX":
			ScaleTwoX(data);
			break;
		case "NearestNeighbor":
			NearestNeighborComplete(pixelBuffer, pixelBufferSize, data, scaleLevel);
			break;
		default:
			NearestNeighborComplete(pixelBuffer, pixelBufferSize, data, scaleLevel);
			break;
	}

	ctx.putImageData(imageData, 0, 0);
}


function clearBuffer()
{
	for (var i = 0; i < pixelBufferSize; i++) {
		pixelBuffer[i] = 0xFFFFFF;
	}
	draw();
}
//Scaling Algorithms

function ScaleTwoX( data )
{	
	var scaleAmount = 2;

	var remainingScale = scaleLevel / scaleAmount;

	var pixelBufferTemp = [];

	var tempSize = 0;

	for(var i = 0; i < pixelBufferSize; i++){
		var x = i % bufferWidth;
		var y = Math.floor(i/bufferWidth);

		var P = getColourBuffer(x, y);

		var A = getColourBuffer(x, y - 1, P);

		var B = getColourBuffer(x + 1, y, P);

		var C = getColourBuffer(x - 1, y, P);

		var D = getColourBuffer(x, y + 1, P);

		var pixel1 = P,
			pixel2 = P,
			pixel3 = P,
			pixel4 = P;

		if( C==A && C!=D && A!=B )
		{
			pixel1 = A;
		}

		if ( A==B && A!=C & B!=D )
		{
			pixel2=B;
		}
 		if ( B==D && B!=A & D!=C )
 		{
 			pixel4=D;
 		}
 		if ( D==C && D!=B & C!=A )
 		{
 			pixel3=C;
 		}

 		x = x * 2;
 		y = y * 2;

 		writeColourToTemp(pixel1, pixelBufferTemp, x, y);
		writeColourToTemp(pixel2, pixelBufferTemp, x + 1, y);
		writeColourToTemp(pixel3, pixelBufferTemp, x, y + 1);
		writeColourToTemp(pixel4, pixelBufferTemp, x + 1, y + 1);

		tempSize += 4;

	}

	//Scale up remaining amount
	NearestNeighborComplete( pixelBufferTemp, tempSize, data, remainingScale, scaleAmount);

}

function NearestNeighborComplete( tempPixelBuffer, tempSize, data, remainingScale = 1, alreadyScaledBy = 1)
{	
	for(var i = 0; i < tempSize; i++)
	{
		var x = (i % (bufferWidth * alreadyScaledBy) ) * remainingScale;
		var y = Math.floor(i / (bufferWidth * alreadyScaledBy) ) * remainingScale;

		for (var j = 0; j < remainingScale; j++)
		{
			for(var k = 0; k < remainingScale; k++)
			{	
				writeColourTo( tempPixelBuffer[i], data, x + j, y + k);
			}
		}
	}
} 

function writeColourTo(colour, data, x, y)
{
	pos = (x + y * canvasWidth) * 4;
	data[pos    ] = redValue( colour );
	data[pos + 1] = greenValue( colour );
	data[pos + 2] = blueValue( colour );
	data[pos + 3] = 0xFF;
}

function writeColourToTemp(colour, temp, x, y, scale = 2)
{
	pos = (x + y * bufferWidth * scale);
	temp[pos] = colour;
}

function getColourBuffer(x, y, defaultColour = 0xFFFFFF)
{	
	if( x < 0 || x >= bufferWidth || y < 0 || y >= bufferHeight)
	{	
		return defaultColour;
	}

	pos = (x + y * bufferWidth);
	return pixelBuffer[pos];
}

function getColourCanvas(data, x, y, defaultColour = 0xFFFFFF)
{
	if( x < 0 || x >= canvasWidth || y < 0 || y >= canvasHeight)
	{
		return defaultColour;
	}

	pos = (x + y * canvasWidth) * 4;
	return (data[pos] << 16) + (data[pos + 1] << 8) + (data[pos + 2]);
}

//Helper Functions

function redValue( colour )
{
	return (colour & 0xFF0000) >> 16;
}

function greenValue( colour )
{
	return (colour & 0xFF00) >> 8;
}

function blueValue( colour )
{
	return colour & 0xFF;
}

function downloadImage()
{	
	var e = document.getElementById("download");
	var img = canvas.toDataURL("image/png");
	e.href = img;
}

function floodFill(x,y)
{	
	var imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
	var data = imageData.data;
	var targetColour = getColourCanvas(data,x,y);

	x = (x - x % scaleLevel) / scaleLevel;
	y = (y - y % scaleLevel) / scaleLevel;

	var pixelStack = [];

	var centre = x+y*bufferWidth;

	if(targetColour != currentColour)
	{
		pixelStack.push(centre);

		while(pixelStack.length > 0)
		{	

			centre = pixelStack.pop();

			var tempX = centre % bufferWidth;
			var tempY = Math.floor(centre/bufferWidth);

			//Top
			if( !outOfBounds(tempX,tempY-1,bufferWidth,bufferHeight) && getColourBuffer(tempX,tempY-1) == targetColour )
			{
				pixelStack.push(tempX+(tempY-1)*bufferWidth);
			}

			//Left
			if( !outOfBounds(tempX-1,tempY,bufferWidth,bufferHeight) && getColourBuffer(tempX-1,tempY) == targetColour )
			{
				pixelStack.push(tempX-1+tempY*bufferWidth);
			}

			//Right
			if( !outOfBounds(tempX+1,tempY,bufferWidth,bufferHeight) && getColourBuffer(tempX+1,tempY) == targetColour )
			{
				pixelStack.push(tempX+1+tempY*bufferWidth);
			}

			//Bottom
			if( !outOfBounds(tempX,tempY+1,bufferWidth,bufferHeight) && getColourBuffer(tempX,tempY+1) == targetColour )
			{
				pixelStack.push(tempX+(tempY+1)*bufferWidth);
			}

			pixelBuffer[centre] = currentColour;
		}

		draw();
	}

}

function outOfBounds(x, y, width, height)
{
	return ( x < 0 || x >= width || y < 0 || y >=height )
}

//Update functions

function updateScalingAlgo(e)
{
	switch (e.value)
	{
		case "ScaleTwoX":
			scaleType = "ScaleTwoX";
			break;
		case "NearestNeighbor":
			scaleType = "NearestNeighbor";
			break;
		default:
			scaleType = "NearestNeighbor";
			break;
	}

	draw();
}

function updateScalingAmount(e)
{
	scaleLevel = parseInt(e.value);

	bufferWidth = canvasWidth / scaleLevel;
	bufferHeight = canvasHeight / scaleLevel;

	pixelBufferSize = bufferWidth * bufferHeight;

	clearBuffer()

	draw();
}

function updateFileName(e)
{
	if(e.value == "" || /\s/.test(e.value) )
	{
		return false;
	}

	var d = document.getElementById("download");

	d.download = e.value + ".png";
}

//Colour Picker

function updateTextboxs()
{
	var e = document.getElementById("red");
	var s = document.getElementById("redSlider");

	e.value = s.value;

	e = document.getElementById("green");
	s = document.getElementById("greenSlider");

	e.value = s.value;

	e = document.getElementById("blue");
	s = document.getElementById("blueSlider");

	e.value = s.value;

	updateCurrentColour();

}


function updateCurrentColour()
{
	var tempColour = 0;

	var red,
		green,
		blue;

	var e = document.getElementById("redSlider");

	red = parseInt(e.value);

	var e = document.getElementById("greenSlider");

	green = parseInt(e.value);

	e = document.getElementById("blueSlider");

	blue = parseInt(e.value);

	tempColour = (red << 16) + (green << 8) + blue;

	if( tempColour >= 0 && tempColour <= 0xFFFFFF )
	{	
		currentColour = tempColour;
		updateColourWindow(red, green, blue);
	}
}

function updateColourPicker()
{
	var e = document.getElementById("redSlider");

	e.value = redValue(currentColour);

	var e = document.getElementById("greenSlider");

	e.value = greenValue(currentColour);

	e = document.getElementById("blueSlider");

	e.value = blueValue(currentColour);

	updateCurrentColour();
}

function updateColourWindow(red, green, blue)
{
	var e = document.getElementById("colourWindow");

	e.style = "background-color: rgb(" + red + ", " + green + ", " + blue + ")";
}