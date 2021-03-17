const MT_SOLID = 0;
const MT_GRID = 1;
const MT_CHECKERBOARD = 2;

//***********CSCENE******************
function CScene(items) {
//=============================================================================
	this.RAY_EPSILON = 1.0E-15;      
	this.items = items;
	this.lights = [];
	this.imgBuf = g_myPic;
	
	for(var i = 0; i< this.items.length; i++){
		mat4.invert(this.items[i].inverseMatrix, this.items[i].world2model);
		mat4.transpose(this.items[i].normalMatrix, this.items[i].inverseMatrix);
	}
}

CScene.prototype.makeRayTracedImage = function() {
	var eyeRay = new CRay();	// the ray we trace from our camera for each pixel
	var myCam = new CCamera();	// the 3D camera that sets eyeRay values
	var rowFrac = 100/this.imgBuf.ySiz;
	var items = g_currentScene.items;
	
	var colr = vec4.create();	// floating-point RGBA color value
	console.log("colr obj:", colr);
	var hit = 0;
	var idx = 0;  // CImgBuf array index(i,j) == (j*this.xSiz + i)*this.pixSiz
	var i,j;      // pixel x,y coordinate (origin at lower left; integer values)
	for(j=0; j< this.imgBuf.ySiz; j++) {       // for the j-th row of pixels.
		for(i=0; i< this.imgBuf.xSiz; i++) {	    // and the i-th pixel on that row,
			colr = GetTracePixel(i,j, myCam, eyeRay);
			
			idx = (j*this.imgBuf.xSiz + i)*this.imgBuf.pixSiz;	// Array index at pixel (i,j) 
			this.imgBuf.fBuf[idx   ] = colr[0];	
			this.imgBuf.fBuf[idx +1] = colr[1];
			this.imgBuf.fBuf[idx +2] = colr[2];
			}
		}

	this.imgBuf.float2int();		// create integer image from floating-point buffer.
}

function GetTracePixel(x, y, cam, eyeRay){
	var totalColor = vec4.create();
	for(j=0; j< g_AAcode; j++) {
		for(i=0; i< g_AAcode; i++){
			if(!g_isJitter){
				var X = x + i/g_AAcode; 
				var Y = y + j/g_AAcode;
			}
			else{
				var X = x + (i+Math.random())/g_AAcode; 
				var Y = y + (j+Math.random())/g_AAcode;
			}
			cam.setEyeRay(eyeRay, X, Y);						
			
			var hitList = new CHitList();
			hitList.items = [];
			
			for(var ii = 0; ii< g_currentScene.items.length; ii++){
				g_currentScene.items[ii].traceShape(eyeRay, hitList);
			}
			var nearHit = new CHit();
			nearHit = hitList.batchAdd(nearHit);
			if(nearHit){
				var colorOut = nearHit.getColor(eyeRay, 0);
				vec4.scaleAndAdd(totalColor, totalColor, colorOut, 1);
			}
			else{
				vec4.scaleAndAdd(totalColor, totalColor, g_clearColor, 1);
			}
		}
	}
	
	vec4.scale(totalColor, totalColor, 1/g_AAcode**2);
	
	return totalColor;
}


//**********************CHIT********************************
function CHit() {
//=============================================================================
// Describes one ray/object intersection point that was found by 'tracing' one
// ray through one shape (through a single CGeom object, held in the
// CScene.item[] array).
// CAREFUL! We don't use isolated CHit objects, but instead gather all the CHit
// objects for one ray in one list held inside a CHitList object.
// (CHit, CHitList classes are consistent with the 'HitInfo' and 'Intersection'
// classes described in FS Hill, pg 746).
	this.hitPt;
	this.hitGeom;

	this.t0;

	this.isEntering = true;

	this.surfNorm = vec4.create();
	this.viewN = vec4.create();
	this.modelHitPt = vec4.create(); // the 'hit point' in model coordinates.
    // *WHY* have modelHitPt? to evaluate procedural textures & materials.
    //      Remember, we define each CGeom objects as simply as possible in its
    // own 'model' coordinate system (e.g. fixed, unit size, axis-aligned, and
    // centered at origin) and each one uses its own worldRay2Model matrix
    // to customize them in world space.  We use that matrix to translate,
    // rotate, scale or otherwise transform the object in world space.
    // This means we must TRANSFORM rays from the camera's 'world' coord. sys.
    // to 'model' coord sys. before we trace the ray.  We find the ray's
    // collision length 't' in model space, but we can use it on the world-
    // space rays to find world-space hit-point as well.
    //      However, some materials and shading methods work best in model
    // coordinates too; for example, if we evaluate procedural textures
    // (grid-planes, checkerboards, 3D woodgrain textures) in the 'model'
    // instead of the 'world' coord system, they'll stay 'glued' to the CGeom
    // object as we move it around in world-space (by changing worldRay2Model
    // matrix), and the object's surface patterns won't change if we 'squeeze' 
    // or 'stretch' it by non-uniform scaling.
}

CHit.prototype.getColor = function(incidentRay, depth){
	outColor = vec3.fromValues(0,0,0);
	
	var material;
	var shape = this.hitGeom;
	switch(shape.shapeMaterial){
		case MT_SOLID:
			material = shape.material1;
			break;
		
		case MT_GRID:
			var x =  this.hitPt[0]*shape.textureRad;
			var y =  this.hitPt[1]*shape.textureRad;
			
			var loc = x / shape.xgap; 
			if(x < 0) loc = -loc;    // keep >0 to form double-width line at yaxis.
			//console.log("loc",loc, "loc%1", loc%1, "lineWidth", this.lineWidth);
			if(loc%1 < shape.lineWidth) {    // hit a line of constant-x?    // yes.
				material = shape.material1;
				break;
			}
			loc = y / shape.ygap;     // how many 'ygaps' from origin?
			if(y < 0) loc = -loc;    // keep >0 to form double-width line at xaxis.
			if(loc%1 < shape.lineWidth) {   // hit a line of constant-y?      // yes.
				material = shape.material1;
				break;
			}
			material = shape.material2;
			
			break;
		
		case MT_CHECKERBOARD:
			var x = this.hitPt[0]*shape.checkerRad;
			var y = this.hitPt[1]*shape.checkerRad;
			var z = this.hitPt[2]*shape.checkerRad;
			
			var tot = Math.floor(x/shape.xgap) + Math.floor(y/shape.ygap) + Math.floor(z/shape.zgap);	
			var y = tot % 2;
			if(y < 0){
				y = -y;
			}

			if(y < 0.5){
				material = shape.material1;
			} else{
				material = shape.material2;
			}
			
			break;
	}
	var outColor = vec4.create();
	var outReflect = vec4.create();
	this.getLight(outColor, outReflect, material, incidentRay);

	var absorb = 0.95;
	
	if(g_maxDepth - depth > 0){
		var hitList = new CHitList();
		hitList.items = [];
		var rRay = new CRay();
			rRay.orig = this.modelHitPt;
			rRay.dir = outReflect;
		
		for(var ii = 0; ii< g_currentScene.items.length; ii++){
			g_currentScene.items[ii].traceShape(rRay, hitList);
		}
		
		var nearHit = new CHit();
		nearHit = hitList.batchAdd(nearHit);
		
		if(nearHit){
			var colorOut = nearHit.getColor(rRay, depth+1);
			var rColor = vec4.create();
			vec4.multiply(rColor, colorOut, material.K_spec);
			vec4.scaleAndAdd(outColor, outColor, rColor, absorb);
		} else{
			var rColor = vec4.create();
			vec4.multiply(rColor, g_clearColor, material.K_spec);
			vec4.scaleAndAdd(outColor, outColor, rColor, absorb);
		}
	}
	return outColor;
}

CHit.prototype.getLight = function(out, outReflected, material, incidentRay){
	vec4.transformMat4(this.modelHitPt, this.hitPt, this.hitGeom.world2model);
	
	for(var i = 0; i < g_currentScene.lights.length; i++){
		if(g_currentScene.lights[i].isOn){
			var StLRay = new CRay();
			StLRay.orig = this.modelHitPt;
			StLRay.dir = vec4.create();
			
			vec4.scaleAndAdd(StLRay.dir, g_currentScene.lights[i].position, StLRay.orig, -1);
			
			var hitList = new CHitList();
			hitList.items = [];
			
			for(var ii = 0; ii< g_currentScene.items.length; ii++){
				g_currentScene.items[ii].traceShape(StLRay, hitList);
			}
			
			var occludingItems = 0;
			for( var ii = 0; ii < hitList.items.length; ii++){
				if(hitList.items[ii].t0 <= 1){
					occludingItems++;
					break;
				}
			}
			
			vec3.normalize(this.surfNorm, this.surfNorm);
			var IDotN = vec4.dot(incidentRay.dir, this.surfNorm);
			vec4.scaleAndAdd(outReflected, incidentRay.dir, this.surfNorm, -2*IDotN);
			vec3.normalize(outReflected, outReflected);
			outReflected[3] = 0;
			
			if(occludingItems > 0){
				var ambientTerm = vec4.create();
				ambientTerm = vec4.multiply(ambientTerm, material.K_ambi, g_currentScene.lights[i].colors.ambi);
				vec4.scaleAndAdd(out, out, ambientTerm, 1);
			}
			else{
				var ambientTerm = vec4.create();
				vec4.multiply(ambientTerm, material.K_ambi, g_currentScene.lights[i].colors.ambi);
				vec4.scaleAndAdd(out, out, ambientTerm, 1);
				
				var diffuseTerm = vec4.create();
				vec4.multiply(diffuseTerm, material.K_diff, g_currentScene.lights[i].colors.diff);
				vec3.normalize(StLRay.dir, StLRay.dir);
				
				var diffScale = Math.max(vec4.dot(this.surfNorm, StLRay.dir),0);
				vec4.scaleAndAdd(out, out, diffuseTerm, diffScale);

				var specTerm = vec4.create();
				vec4.multiply(specTerm, material.K_spec, g_currentScene.lights[i].colors.spec);

				var specScale = Math.max(vec4.dot(outReflected, StLRay.dir),0)**material.K_shiny;
				vec4.scaleAndAdd(out, out, specTerm, specScale);
			}
		}
	}
}	

function CHitList() {
	var items = [];
}

CHitList.prototype.batchAdd = function(outHit){
	var near = 15000;
	var hit  = null;
	
	for(var i = 0; i < this.items.length; i++){		
		if(this.items[i].t0 < near){	
			hit = this.items[i];	
			near = this.items[i].t0;
		}
	}
	outHit = hit;
	return outHit;
}