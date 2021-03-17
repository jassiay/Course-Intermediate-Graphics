//=============================================================================
// Allowable values for CGeom.shapeType variable.  Add some of your own!
const RT_GNDPLANE = 0;    // An endless 'ground plane' surface.
const RT_DISK = 1;
const RT_SPHERE = 2;
const RT_BOX = 3;

function CGeom(shapeSelect, shapeMaterial) {
//=============================================================================
	if(shapeSelect == undefined) shapeSelect = RT_GNDPLANE;	// default
	this.shapeType = shapeSelect;
	
	if(shapeMaterial == undefined) shapeMaterial = MT_SOLID;
	this.shapeMaterial = shapeMaterial;
	
	//Transform in the scene buolder (WebGL side)
	this.world2model = mat4.create();	// the matrix used to transform rays from
	                                  // 'world' coord system to 'model' coords;
	                                  // Use this to set shape size, position,
	                                  // orientation, and squash/stretch amount.
	this.inverseMatrix = mat4.create();
	
	this.normalMatrix = mat4.create();
	// Ground-plane 'Line-grid' parameters:
	this.zGrid = 0.0;	// create line-grid on the unbounded plane at z=zGrid
	this.xgap = 1.0;	// line-to-line spacing
	this.ygap = 1.0;
	this.zgap = 1.0;
	this.radius = 1.0;
	this.lineWidth = 0.1;	// fraction of xgap used for grid-line width

	this.textureRad = 1.0;
	this.checkerRad = 5.0;
	
	this.material1 = new Material();
	this.material2 = new Material();
}

CGeom.prototype.traceShape = function(inRay, myHit){
	var originInv = vec4.create(); 
	var dirInv = vec4.create();
	vec4.transformMat4(originInv, inRay.orig, this.inverseMatrix);
	vec4.transformMat4(dirInv, inRay.dir, this.inverseMatrix);
	var rayT = new CRay();
	rayT.dir = dirInv;
	rayT.orig =  originInv;
	
	switch(this.shapeType){
		case RT_GNDPLANE:
			var t0 = (this.zGrid -rayT.orig[2])/rayT.dir[2];  //Change Z grid to 0

			if(t0< g_currentScene.RAY_EPSILON){
				break;
			}
			var hit = new CHit();
			hit.hitPt = vec4.fromValues(	rayT.orig[0] + rayT.dir[0]*t0,
											rayT.orig[1] + rayT.dir[1]*t0,
											this.zGrid, 1.0);
			hit.hitGeom = this;
			hit.t0 = t0;
			var normal = vec4.fromValues(0,0,1,1);
			vec4.transformMat4(hit.surfNorm, normal, this.normalMatrix);
			
			myHit.items.push(hit);
			
		break;
			
		case RT_DISK:
			var t0 = (this.zGrid -rayT.orig[2])/rayT.dir[2];  //Change Z grid to 0
			var r = 0;
			if(t0< g_currentScene.RAY_EPSILON){
				break;
			}
			var hit = new CHit();
			hit.hitPt = vec4.fromValues(	rayT.orig[0] + rayT.dir[0]*t0,
											rayT.orig[1] + rayT.dir[1]*t0,
											this.zGrid, 1.0);
			var r2 = hit.hitPt[0]**2 + hit.hitPt[1]**2;
			if(r2 < this.radius**2){
				hit.hitGeom = this;
				hit.t0 = t0;
				var normal = vec4.fromValues(0,0,1,1);
				vec4.transformMat4(hit.surfNorm, normal, this.normalMatrix);
				
				myHit.items.push(hit);
			}
		break;
		
		case RT_SPHERE:
			var r2s = vec4.create();
			var zero = vec4.fromValues(0,0,0,1);
			vec4.scaleAndAdd(r2s, zero, rayT.orig, -1);
			var L2 = vec4.dot(r2s, r2s);
			
			var tcaS = vec4.dot(r2s, rayT.dir);
			
			if(tcaS < g_currentScene.RAY_EPSILON){
				break;
			}
			var DL2 = vec4.dot(rayT.dir, rayT.dir);
			var tca2 = tcaS**2/DL2;
			var LM2 = L2-tca2;
			
			if(LM2 > this.radius**2){
				break;
			}
			var shortEdge2 = this.radius**2 - LM2;
			
			var hit = new CHit();
			var t = tcaS/DL2 - Math.sqrt(shortEdge2/DL2);
			hit.t0 = t;
			hit.hitGeom = this;
			hit.hitPt = vec4.create();
			vec4.scaleAndAdd(hit.hitPt, rayT.orig, rayT.dir, t);
			vec4.transformMat4(hit.surfNorm, hit.hitPt, this.normalMatrix);
			
			myHit.items.push(hit);
		break;
			
		case RT_BOX:
			for(var ii = 0; ii<3; ii++){
				for(var jj = 0; jj < 2; jj++){
                    var t0 = (jj - rayT.orig[ii]) / rayT.dir[ii];
                    if(t0 < g_currentScene.RAY_EPSILON){
                        continue;
                    }
                    var x = (ii + 1)%3;
                    var y = (ii + 2)%3;
                    var hitPt = vec4.create();
                    vec4.scaleAndAdd(hitPt, rayT.orig, rayT.dir, t0);
                    
                    if(hitPt[x] < 0 || hitPt[x] >1 || hitPt[y] < 0 || hitPt[y] > 1){
                        continue;
                    }
                    var hit = new CHit();
                    
                    hit.t0 = t0;
                    hit.hitGeom = this;
                    hit.hitPt = hitPt;              
                    var normal = vec4.create();
                    normal[ii] = -1; 
                    vec4.transformMat4(hit.surfNorm, normal, this.normalMatrix);

                    myHit.items.push(hit);
				}
			}
		break;
	}
}
