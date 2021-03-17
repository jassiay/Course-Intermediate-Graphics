function onSuperSampleButton() {
    //console.log('ON-SuperSample BUTTON!');
    g_AAcode += 1;
    if(g_AAcode > G_AA_MAX) g_AAcode = 1; // 1,2,3,4, 1,2,3,4, 1,2,... etc
    // report it:
    if(g_AAcode==1) {
        if(g_isJitter==0) {
                document.getElementById('AAreport').innerHTML = 
                "1 sample/pixel. No jitter.";
            console.log("1 sample/pixel. No Jitter.");
        } 
        else {
                document.getElementById('AAreport').innerHTML = 
                "1 sample/pixel, but jittered.";
            console.log("1 sample/pixel, but jittered.")
        } 
    }
    else { // g_AAcode !=1
        if(g_isJitter==0) {
                document.getElementById('AAreport').innerHTML = 
                g_AAcode+"x"+g_AAcode+" Supersampling. No jitter.";
            console.log(g_AAcode,"x",g_AAcode,"Supersampling. No Jitter.");
        } 
        else {
                document.getElementById('AAreport').innerHTML = 
                g_AAcode+"x"+g_AAcode+" JITTERED Supersampling";
            console.log(g_AAcode,"x",g_AAcode," JITTERED Supersampling.");
        }
    }
}

function onJitterButton() {
    console.log('ON-JITTER button!!');
    if(g_isJitter ==0) g_isJitter = 1;      // toggle 0,1,0,1,...
    else g_isJitter = 0;

    if(g_AAcode==1) {
        if(g_isJitter==0) {
                document.getElementById('AAreport').innerHTML = 
                "1 sample/pixel. No jitter.";
            console.log("1 sample/pixel. No Jitter.");
        } 
        else {
                document.getElementById('AAreport').innerHTML = 
                "1 sample/pixel, but jittered.";
            console.log("1 sample/pixel, but jittered.")
        } 
    }
    else { // g_AAcode !=0
        if(g_isJitter==0) {
                document.getElementById('AAreport').innerHTML = 
                g_AAcode+"x"+g_AAcode+" Supersampling. No jitter.";
            console.log(g_AAcode,"x",g_AAcode,"Supersampling. No Jitter.");
        } 
        else {
                document.getElementById('AAreport').innerHTML = 
                g_AAcode+"x"+g_AAcode+" JITTERED Supersampling";
            console.log(g_AAcode,"x",g_AAcode," JITTERED Supersampling.");
        }
    }
}
            
function onSceneButton() {
    //=============================================================================
    //console.log('ON-SCENE BUTTON!');
    if(g_SceneNum < 0 || g_SceneNum + 1 >= g_scenes.length) g_SceneNum = 0;
    else g_SceneNum = g_SceneNum +1;
    g_currentScene = g_scenes[g_SceneNum];

    document.getElementById('SceneReport').innerHTML =
                'Show Scene Number ' + (g_SceneNum+1) + ' of 4';

    rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
    rayView.reload();     // re-transfer VBO contents and texture-map contents
    drawAll();
}


function onBrowserResize() {
// Called when user re-sizes their browser window , because our HTML file
// contains:  <body onload="main()" onresize="onBrowserResize()">

    //Make a square canvas/CVV fill the SMALLER of the width/2 or height:
    if(innerWidth > 2*innerHeight) {  // fit to brower-window height
        g_canvasID.width = 2*innerHeight - 20;  // (with 20-pixel margin)
        g_canvasID.height = innerHeight - 20;   // (with 20-pixel margin_
    }
    else {	// fit canvas to browser-window width
        g_canvasID.width = innerWidth - 20;       // (with 20-pixel margin)
        g_canvasID.height = 0.5*innerWidth - 20;  // (with 20-pixel margin)
    }

    drawAll();     // re-draw browser contents using the new size.
}

function onDepthButton(){
	if(g_maxDepth < 0 || g_maxDepth + 1 >= g_maxDepth_MAX) g_maxDepth = 0;
	else g_maxDepth = g_maxDepth +1;

	document.getElementById('DepthReport').innerHTML =
  			'Recursive Depth: ' + g_maxDepth;

  rayView.switchToMe(); // be sure OUR VBO & shaders are in use, then
  rayView.reload();     // re-transfer VBO contents and texture-map contents
  drawAll();
}

function onLightButton1(){
	g_currentScene.lights[0].isOn = !g_currentScene.lights[0].isOn
	var str = ' Light 1 : '
	if(g_currentScene.lights[0].isOn)
		str += 'ON';
	else
		str += 'OFF';
	document.getElementById('light-1').innerHTML = str;
}

function onLightButton2(){
	g_currentScene.lights[1].isOn = !g_currentScene.lights[1].isOn
	var str = ' Light 2 : '
	if(g_currentScene.lights[1].isOn)
		str += 'ON';
	else
		str += 'OFF';
	document.getElementById('light-2').innerHTML = str;
}

function onPositionButton1(){
    var valueX = parseInt(document.getElementById('select-l1-x').value);
    var valueY = parseInt(document.getElementById('select-l1-y').value);
    var valueZ = parseInt(document.getElementById('select-l1-z').value);

    g_currentScene.lights[0].setPos(vec4.fromValues(valueX,valueY,valueZ,1));
    console.log("Light 1 Postion changed to: " + valueX + ", " + valueY + ', ' + valueZ);
}


function onPositionButton2(){
    var valueX = parseInt(document.getElementById('select-l2-x').value);
    var valueY = parseInt(document.getElementById('select-l2-y').value);
    var valueZ = parseInt(document.getElementById('select-l2-z').value);

    g_currentScene.lights[1].setPos(vec4.fromValues(valueX,valueY,valueZ,1));
    console.log("Light 2 Postion changed to: " + valueX + ", " + valueY + ', ' + valueZ);
}