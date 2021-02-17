const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_WPOS     = 3;            // (why include w? for matrix transforms; 
                                    // for vector/point distinction
const PART_XVEL     = 4;  //  velocity -- ALWAYS a vector: x,y,z; no w. (w==0)    
const PART_YVEL     = 5;
const PART_ZVEL     = 6;
const PART_X_FTOT   = 7;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 8;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 9;        
const PART_R        =10;  // color : red,green,blue, alpha (opacity); 0<=RGBA<=1.0
const PART_G        =11;  
const PART_B        =12;
const PART_MASS     =13;  // mass   
const PART_DIAM 	=14;	// on-screen diameter (in pixels)
const PART_RENDMODE =15;	// on-screen appearance (square, round, or soft-round)
const PART_AGE      =16;  // # of frame-times since creation/initialization
const PART_CHARGE   =17;  // for electrostatic repulsion/attraction
const PART_MAXVAR   =18;  // Size of array in CPart uses to store its values.

const SOLV_EULER       = 0;       // Euler integration: forward,explicit,...
const SOLV_MIDPOINT    = 1;       // Midpoint Method (see Pixar Tutorial)
const SOLV_RUNGEKUTTA  = 2;
const SOLV_IMPLICIT_EULER  = 3;      // 'Backwind' or Implicit Euler
const SOLV_IMPLICIT_MIDPOINT  = 4;

const NU_EPSILON  = 10E-15;

function PartSys() {
}

PartSys.prototype.dotFinder = function(dest, src) {
	var invMass;  // inverse mass
    var j = 0;  // i==particle number; j==array index for i-th particle
    for (var i = 0; i < this.partCount; i += 1, j += PART_MAXVAR) {
        dest[j + PART_XPOS] = src[j + PART_XVEL];   // position derivative = velocity
        dest[j + PART_YPOS] = src[j + PART_YVEL];
        dest[j + PART_ZPOS] = src[j + PART_ZVEL];
        dest[j + PART_WPOS] = 0.0;                  // presume 'w' fixed at 1.0
        // Use 'src' current force-accumulator's values (set by PartSys.applyForces())
        // to find acceleration.  As multiply is FAR faster than divide, do this:
        invMass = 1.0 / src[j + PART_MASS];   // F=ma, so a = F/m, or a = F(1/m);
        dest[j + PART_XVEL] = src[j + PART_X_FTOT] * invMass;
        dest[j + PART_YVEL] = src[j + PART_Y_FTOT] * invMass;
        dest[j + PART_ZVEL] = src[j + PART_Z_FTOT] * invMass;
        dest[j + PART_X_FTOT] = 0.0;  // we don't know how force changes with time;
        dest[j + PART_Y_FTOT] = 0.0;  // presume it stays constant during timestep.
        dest[j + PART_Z_FTOT] = 0.0;
        dest[j + PART_R] = 0.0;       // presume color doesn't change with time.
        dest[j + PART_G] = 0.0;
        dest[j + PART_B] = 0.0;
        dest[j + PART_MASS] = 0.0;    // presume mass doesn't change with time.
        dest[j + PART_DIAM] = 0.0;    // presume these don't change either...   
        dest[j + PART_RENDMODE] = 0.0;
        dest[j + PART_AGE] = 1.0;
    }
}

PartSys.prototype.render = function(ModelMat, MVPMat, Eye, clothMode) {
	this.age += (g_timeStep*0.001);
	gl.useProgram(this.shaderLoc);

	//a) Re-bind Buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);
	if(clothMode == 1){
		this.makeCloth();
		gl.bufferSubData( gl.ARRAY_BUFFER, 0, this.vbo);
	}
	else{
		gl.bufferSubData( gl.ARRAY_BUFFER, 0, this.s1); // Float32Array data source.
	}

	//b) Re-assign attribute pointers
	gl.vertexAttribPointer(this.a_PositionID,  4, gl.FLOAT,  false, PART_MAXVAR*this.FSIZE, PART_XPOS * this.FSIZE); 
	gl.vertexAttribPointer(this.a_ColorID,  3, gl.FLOAT,  false, PART_MAXVAR*this.FSIZE, PART_R * this.FSIZE); 
	gl.vertexAttribPointer(this.a_PointSizeID,  1, gl.FLOAT,  false, PART_MAXVAR*this.FSIZE, PART_DIAM * this.FSIZE); 
	
	//c) enable the newly-reassigned attributes
	gl.enableVertexAttribArray(this.a_PositionID);
	gl.enableVertexAttribArray(this.a_ColorID);
	gl.enableVertexAttribArray(this.a_PointSizeID);
	
	gl.uniform1i(this.u_runModeID, RUN_MODE);
	gl.uniformMatrix4fv(this.u_ModelMatLoc,	false, ModelMat.elements);	
	gl.uniformMatrix4fv(this.u_MVPMatLoc,	false, MVPMat.elements);
	
	gl.uniform3f(this.u_EyePosLoc,	Eye.elements[0], Eye.elements[1], Eye.elements[2]);
	
	
	if(clothMode == 1){
		gl.drawArrays(gl.TRIANGLE_STRIPS, 0, 2*this.partPerRow); 
	}
	else{
		gl.drawArrays(gl.POINTS, 0, this.partCount); 
	}
}

PartSys.prototype.solver = function() {
	switch(SOLVER_TYPE) {
	case SOLV_EULER:
		var timeStep = (g_timeStep*0.001);
		for(var n = 0; n<this.partCount*PART_MAXVAR; n++){
			this.s2[n] = this.s1[n]+ this.s1dot[n] * timeStep;
		}

	break;

	case SOLV_MIDPOINT:
		var timeStep = (g_timeStep*0.001);
		var sMid = this.s1;
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			sMid[j + PART_XPOS] = this.s1[j + PART_XPOS] + this.s1dot[j + PART_XPOS] * (timeStep / 2);
			sMid[j + PART_YPOS] = this.s1[j + PART_YPOS] + this.s1dot[j + PART_YPOS] * (timeStep / 2);
			sMid[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + this.s1dot[j + PART_ZPOS] * (timeStep / 2);
			sMid[j + PART_XVEL] = this.s1[j + PART_XVEL] + this.s1dot[j + PART_XVEL] * (timeStep / 2);
			sMid[j + PART_YVEL] = this.s1[j + PART_YVEL] + this.s1dot[j + PART_YVEL] * (timeStep / 2);
			sMid[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + this.s1dot[j + PART_ZVEL] * (timeStep / 2);
		}

		// using unassigned s2dot as sMidDot
		this.applyForces(sMid, this.forces);
		this.dotFinder(this.s2dot, sMid);

		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			this.s2[j + PART_XPOS] = this.s1[j + PART_XPOS] + this.s2dot[j + PART_XPOS] * timeStep;
			this.s2[j + PART_YPOS] = this.s1[j + PART_YPOS] + this.s2dot[j + PART_YPOS] * timeStep;
			this.s2[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + this.s2dot[j + PART_ZPOS] * timeStep;
			this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL] + this.s2dot[j + PART_XVEL] * timeStep;
			this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL] + this.s2dot[j + PART_YVEL] * timeStep;
			this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + this.s2dot[j + PART_ZVEL] * timeStep;
			this.s2[j + PART_AGE] += timeStep;
		}

	break;
		
	case SOLV_RUNGEKUTTA:
		var timeStep = (g_timeStep*0.001);
		var sK2 = this.s1;
		
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			sK2[j + PART_XPOS] = this.s1[j + PART_XPOS] + this.s1dot[j + PART_XPOS] * (timeStep / 2);
			sK2[j + PART_YPOS] = this.s1[j + PART_YPOS] + this.s1dot[j + PART_YPOS] * (timeStep / 2);
			sK2[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + this.s1dot[j + PART_ZPOS] * (timeStep / 2);
			sK2[j + PART_XVEL] = this.s1[j + PART_XVEL] + this.s1dot[j + PART_XVEL] * (timeStep / 2);
			sK2[j + PART_YVEL] = this.s1[j + PART_YVEL] + this.s1dot[j + PART_YVEL] * (timeStep / 2);
			sK2[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + this.s1dot[j + PART_ZVEL] * (timeStep / 2);
		}

		// using unassigned s2dot as sK2Dot
		this.applyForces(sK2, this.forces);
		this.dotFinder(this.s2dot, sK2);

		var sK3 = this.s1;
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			sK3[j + PART_XPOS] = this.s1[j + PART_XPOS] + this.s2dot[j + PART_XPOS] * (timeStep / 2);
			sK3[j + PART_YPOS] = this.s1[j + PART_YPOS] + this.s2dot[j + PART_YPOS] * (timeStep / 2);
			sK3[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + this.s2dot[j + PART_ZPOS] * (timeStep / 2);
			sK3[j + PART_XVEL] = this.s1[j + PART_XVEL] + this.s2dot[j + PART_XVEL] * (timeStep / 2);
			sK3[j + PART_YVEL] = this.s1[j + PART_YVEL] + this.s2dot[j + PART_YVEL] * (timeStep / 2);
			sK3[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + this.s2dot[j + PART_ZVEL] * (timeStep / 2);
		}

		var sK3Dot = new Float32Array(this.partCount * PART_MAXVAR);
		this.applyForces(sK3, this.forces);
		this.dotFinder(sK3Dot, sK3);

		var sK4 = this.s1;
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			sK4[j + PART_XPOS] = this.s1[j + PART_XPOS] + sK3Dot[j + PART_XPOS] * timeStep;
			sK4[j + PART_YPOS] = this.s1[j + PART_YPOS] + sK3Dot[j + PART_YPOS] * timeStep;
			sK4[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + sK3Dot[j + PART_ZPOS] * timeStep;
			sK4[j + PART_XVEL] = this.s1[j + PART_XVEL] + sK3Dot[j + PART_XVEL] * timeStep;
			sK4[j + PART_YVEL] = this.s1[j + PART_YVEL] + sK3Dot[j + PART_YVEL] * timeStep;
			sK4[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + sK3Dot[j + PART_ZVEL] * timeStep;
		}

		var sK4Dot = new Float32Array(this.partCount * PART_MAXVAR);
		this.applyForces(sK4, this.forces);
		this.dotFinder(sK4Dot, sK4);

		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			this.s2[j + PART_XPOS] = this.s1[j + PART_XPOS]
				+(this.s1dot[j + PART_XPOS] + 2*this.s2dot[j + PART_XPOS] + 2*sK3Dot[j + PART_XPOS]+sK4Dot[j + PART_XPOS]) * timeStep/6;
			this.s2[j + PART_YPOS] = this.s1[j + PART_YPOS]
				+(this.s1dot[j + PART_YPOS] + 2*this.s2dot[j + PART_YPOS] + 2*sK3Dot[j + PART_YPOS]+sK4Dot[j + PART_YPOS]) * timeStep/6;
			this.s2[j + PART_ZPOS] = this.s1[j + PART_ZPOS]
				+(this.s1dot[j + PART_ZPOS] + 2*this.s2dot[j + PART_ZPOS] + 2*sK3Dot[j + PART_ZPOS]+sK4Dot[j + PART_ZPOS]) * timeStep/6;
			this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL]
				+(this.s1dot[j + PART_XVEL] + 2*this.s2dot[j + PART_XVEL] + 2*sK3Dot[j + PART_XVEL]+sK4Dot[j + PART_XVEL]) * timeStep/6;
			this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL]
				+(this.s1dot[j + PART_YVEL] + 2*this.s2dot[j + PART_YVEL] + 2*sK3Dot[j + PART_YVEL]+sK4Dot[j + PART_YVEL]) * timeStep/6;
			this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL]
				+(this.s1dot[j + PART_ZVEL] + 2*this.s2dot[j + PART_ZVEL] + 2*sK3Dot[j + PART_ZVEL]+sK4Dot[j + PART_ZVEL]) * timeStep/6;
			this.s2[j + PART_AGE] += timeStep;
		}
		
	break;

	case SOLV_IMPLICIT_EULER:
		var timeStep = (g_timeStep*0.001);
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			this.s2[j + PART_XPOS] = this.s1[j + PART_XPOS] + this.s1dot[j + PART_XPOS] * timeStep;
			this.s2[j + PART_YPOS] = this.s1[j + PART_YPOS] + this.s1dot[j + PART_YPOS] * timeStep;
			this.s2[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + this.s1dot[j + PART_ZPOS] * timeStep;
			this.s2[j + PART_XVEL] = this.s1[j + PART_XVEL] + this.s1dot[j + PART_XVEL] * timeStep;
			this.s2[j + PART_YVEL] = this.s1[j + PART_YVEL] + this.s1dot[j + PART_YVEL] * timeStep;
			this.s2[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + this.s1dot[j + PART_ZVEL] * timeStep;
		}
		
		this.applyForces(this.s2, this.forces);
		this.dotFinder(this.s2dot, this.s2);
		var s3 = new Float32Array(this.partCount * PART_MAXVAR);
		var diff = new Float32Array(this.partCount * PART_MAXVAR);

		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			s3[j + PART_XPOS] = this.s2[j + PART_XPOS] - this.s2dot[j + PART_XPOS] * timeStep;
			s3[j + PART_YPOS] = this.s2[j + PART_YPOS] - this.s2dot[j + PART_YPOS] * timeStep;
			s3[j + PART_ZPOS] = this.s2[j + PART_ZPOS] - this.s2dot[j + PART_ZPOS] * timeStep;
			s3[j + PART_XVEL] = this.s2[j + PART_XVEL] - this.s2dot[j + PART_XVEL] * timeStep;
			s3[j + PART_YVEL] = this.s2[j + PART_YVEL] - this.s2dot[j + PART_YVEL] * timeStep;
			s3[j + PART_ZVEL] = this.s2[j + PART_ZVEL] - this.s2dot[j + PART_ZVEL] * timeStep;

			diff[j + PART_XPOS] = this.s1[j + PART_XPOS] - s3[j + PART_XPOS];
			diff[j + PART_YPOS] = this.s1[j + PART_YPOS] - s3[j + PART_YPOS];
			diff[j + PART_ZPOS] = this.s1[j + PART_ZPOS] - s3[j + PART_ZPOS];
			diff[j + PART_XVEL] = this.s1[j + PART_XVEL] - s3[j + PART_XVEL];
			diff[j + PART_YVEL] = this.s1[j + PART_YVEL] - s3[j + PART_YVEL];
			diff[j + PART_ZVEL] = this.s1[j + PART_ZVEL] - s3[j + PART_ZVEL];
		}
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			this.s2[j + PART_XPOS] += diff[j + PART_XPOS] / 2;
			this.s2[j + PART_YPOS] += diff[j + PART_YPOS] / 2;
			this.s2[j + PART_ZPOS] += diff[j + PART_ZPOS] / 2;
			this.s2[j + PART_XVEL] += diff[j + PART_XVEL] / 2;
			this.s2[j + PART_YVEL] += diff[j + PART_YVEL] / 2;
			this.s2[j + PART_ZVEL] += diff[j + PART_ZVEL] / 2; 
			this.s2[j + PART_AGE] += timeStep;
		}
	break;

	case SOLV_IMPLICIT_MIDPOINT:
		var timeStep = (g_timeStep*0.001);
		var sMid = this.s1;
		
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			sMid[j + PART_XPOS] = this.s1[j + PART_XPOS] + this.s1dot[j + PART_XPOS] * (timeStep / 2);
			sMid[j + PART_YPOS] = this.s1[j + PART_YPOS] + this.s1dot[j + PART_YPOS] * (timeStep / 2);
			sMid[j + PART_ZPOS] = this.s1[j + PART_ZPOS] + this.s1dot[j + PART_ZPOS] * (timeStep / 2);
			sMid[j + PART_XVEL] = this.s1[j + PART_XVEL] + this.s1dot[j + PART_XVEL] * (timeStep / 2);
			sMid[j + PART_YVEL] = this.s1[j + PART_YVEL] + this.s1dot[j + PART_YVEL] * (timeStep / 2);
			sMid[j + PART_ZVEL] = this.s1[j + PART_ZVEL] + this.s1dot[j + PART_ZVEL] * (timeStep / 2);
		}

		this.applyForces(sMid, this.forces);
		this.dotFinder(this.s2dot, sMid);
		var s3 = new Float32Array(this.partCount * PART_MAXVAR);
		var diff = new Float32Array(this.partCount * PART_MAXVAR);

		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			s3[j + PART_XPOS] = this.s2[j + PART_XPOS] - this.s2dot[j + PART_XPOS] * timeStep;
			s3[j + PART_YPOS] = this.s2[j + PART_YPOS] - this.s2dot[j + PART_YPOS] * timeStep;
			s3[j + PART_ZPOS] = this.s2[j + PART_ZPOS] - this.s2dot[j + PART_ZPOS] * timeStep;
			s3[j + PART_XVEL] = this.s2[j + PART_XVEL] - this.s2dot[j + PART_XVEL] * timeStep;
			s3[j + PART_YVEL] = this.s2[j + PART_YVEL] - this.s2dot[j + PART_YVEL] * timeStep;
			s3[j + PART_ZVEL] = this.s2[j + PART_ZVEL] - this.s2dot[j + PART_ZVEL] * timeStep;

			diff[j + PART_XPOS] = this.s1[j + PART_XPOS] - s3[j + PART_XPOS];
			diff[j + PART_YPOS] = this.s1[j + PART_YPOS] - s3[j + PART_YPOS];
			diff[j + PART_ZPOS] = this.s1[j + PART_ZPOS] - s3[j + PART_ZPOS];
			diff[j + PART_XVEL] = this.s1[j + PART_XVEL] - s3[j + PART_XVEL];
			diff[j + PART_YVEL] = this.s1[j + PART_YVEL] - s3[j + PART_YVEL];
			diff[j + PART_ZVEL] = this.s1[j + PART_ZVEL] - s3[j + PART_ZVEL];
		}
		var j = 0;
		for (var j = 0; j<this.partCount*PART_MAXVAR; j += PART_MAXVAR) {
			this.s2[j + PART_XPOS] += diff[j + PART_XPOS] / 2;
			this.s2[j + PART_YPOS] += diff[j + PART_YPOS] / 2;
			this.s2[j + PART_ZPOS] += diff[j + PART_ZPOS] / 2;
			this.s2[j + PART_XVEL] += diff[j + PART_XVEL] / 2;
			this.s2[j + PART_YVEL] += diff[j + PART_YVEL] / 2;
			this.s2[j + PART_ZVEL] += diff[j + PART_ZVEL] / 2; 
			this.s2[j + PART_AGE] += timeStep;
		}
	break;
		
	default:
		console.log('?!?! unknown solver: ' + SOLVER_TYPE);
		break;
	}
	return;
}

PartSys.prototype.doConstraint = function() {
	for(j = 0; j < this.limitCount*L_MAXVAR; j+= L_MAXVAR){
	switch(this.limiters[j + L_TYPE]){	
		case L_BOX:
			var minX = this.limiters[j + L_X_MIN]; 
			var maxX = this.limiters[j + L_X_MAX]; 
			var minY = this.limiters[j + L_Y_MIN]; 
			var maxY = this.limiters[j + L_Y_MAX]; 
			var minZ = this.limiters[j + L_Z_MIN]; 
			var maxZ = this.limiters[j + L_Z_MAX]; 
			var resti = this.limiters[j + L_RESTI];
							
			for(var i = 0; i < this.partCount*PART_MAXVAR; i+= PART_MAXVAR) {
				if( this.s2[PART_XPOS + i] < minX && this.s2[PART_XVEL + i] < 0.0 ) {
					
					this.s2[PART_XPOS + i] = minX;					
					this.s2[PART_XVEL + i] = this.s1[PART_XVEL + i];
					if(  this.s2[PART_XVEL + i] < 0.0) 
						this.s2[PART_XVEL + i] = -resti * this.s2[PART_XVEL + i]; 
					else 
						this.s2[PART_XVEL + i] =  resti * this.s2[PART_XVEL + i];	
				}
				else if (this.s2[PART_XPOS + i] >  maxX && this.s2[PART_XVEL + i] > 0.0) {
					this.s2[PART_XPOS + i] = maxX;					
					this.s2[PART_XVEL + i] = this.s1[PART_XVEL];
					if(this.s2[PART_XVEL + i] > 0.0) 
						this.s2[PART_XVEL + i] = -resti * this.s2[PART_XVEL + i]; 
					else 
						this.s2[PART_XVEL + i] =  resti * this.s2[PART_XVEL + i];	
				}
				if( this.s2[PART_YPOS + i] < minY && this.s2[PART_YVEL + i] < 0.0) {
					this.s2[PART_YPOS + i] = minY;					
					this.s2[PART_YVEL + i] = this.s1[PART_YVEL + i];

					if(this.s2[PART_YVEL + i] < 0.0) 
						this.s2[PART_YVEL + i] = -resti * this.s2[PART_YVEL + i]; 
					else 
						this.s2[PART_YVEL + i] =  resti * this.s2[PART_YVEL + i];	
						 
				}
				else if( this.s2[PART_YPOS + i] > maxY && this.s2[PART_YVEL + i] > 0.0) { 		
					this.s2[PART_YPOS + i] = maxY;					
					this.s2[PART_YVEL + i] = this.s1[PART_YVEL + i];

					if(this.s2[PART_YVEL + i] > 0.0) 
						this.s2[PART_YVEL + i] = -resti * this.s2[PART_YVEL + i]; 
					else 
						this.s2[PART_YVEL + i] =  resti * this.s2[PART_YVEL + i];	
				}
				if( this.s2[PART_ZPOS + i] < minZ && this.s2[PART_ZVEL + i] < 0.0) {
					this.s2[PART_ZPOS + i] = minZ;					
					this.s2[PART_ZVEL + i] = this.s1[PART_ZVEL + i];

					if(this.s2[PART_ZVEL + i] < 0.0) 
						this.s2[PART_ZVEL + i] = -resti * this.s2[PART_ZVEL + i]; 
					else 
						this.s2[PART_ZVEL + i] =  resti * this.s2[PART_ZVEL + i];	
						 
				}
				else if( this.s2[PART_ZPOS + i] > maxZ && this.s2[PART_ZVEL + i] > 0.0) { 		
					this.s2[PART_ZPOS + i] = maxZ;					
					this.s2[PART_ZVEL + i] = this.s1[PART_ZVEL + i];
					if(this.s2[PART_ZVEL + i] > 0.0) 
						this.s2[PART_ZVEL + i] = -resti * this.s2[PART_ZVEL + i]; 
					else 
						this.s2[PART_ZVEL + i] =  resti * this.s2[PART_ZVEL + i];	
				}
			}
			
			break;
		
		case L_ANCHOR:
			var i = this.limiters[j + L_IND]*PART_MAXVAR; 
			
			this.s2[PART_XPOS + i] = this.limiters[j + L_X_MIN];
			this.s2[PART_YPOS + i] = this.limiters[j + L_Y_MIN];
			this.s2[PART_ZPOS + i] = this.limiters[j + L_Z_MIN];
			
			this.s2[PART_XVEL + i] = 0;
			this.s2[PART_YVEL + i] = 0;
			this.s2[PART_ZVEL + i] = 0;
		
			break; 
		
		case L_FIRETYPE:
			for(var i = 0; i < this.partCount*PART_MAXVAR; i+= PART_MAXVAR) {
				var stepR = (this.startColor.R - this.endColor.R)/this.lifeTime;
				var stepG = (this.startColor.G - this.endColor.G)/this.lifeTime;
				var stepB = (this.startColor.B - this.endColor.B)/this.lifeTime;
				var stepSize = (this.startSize - this.endSize)/this.lifeTime;
				
				this.s2[PART_R + i] -= stepR *(g_timeStep*0.001);
				this.s2[PART_G + i] -= stepG*(g_timeStep*0.001);
				this.s2[PART_B + i] -= stepB*(g_timeStep*0.001);
				this.s2[PART_DIAM + i] -=  stepSize* (g_timeStep*0.001);
				
				if(this.s2[PART_AGE + i] >= this.limiters[L_LTIME + j]){
					this.s2[PART_XPOS + i] = this.limiters[L_X_MIN + j] + (Math.random() * 0.1);
					this.s2[PART_YPOS + i] = this.limiters[L_Y_MIN + j] + (Math.random() * 0.1);
					this.s2[PART_ZPOS + i] = this.limiters[L_Z_MIN + j] + (Math.random());
					this.s2[PART_XVEL + i] = this.limiters[L_LAUNCH + j]*(3*(Math.random()-0.5));
					this.s2[PART_YVEL + i] = this.limiters[L_LAUNCH + j]*(3*(Math.random()-0.5));
					this.s2[PART_ZVEL + i] = this.limiters[L_LAUNCH + j]*(Math.random() + 5);				
					this.s2[PART_AGE + i] = 0.3;				
					this.s2[PART_R + i] = this.startColor.R;
					this.s2[PART_G + i] = this.startColor.G;
					this.s2[PART_B + i] = this.startColor.B;
					this.s2[PART_DIAM + i] = this.startSize;
				}
			}
			break;
			
		case L_CYLINDER:
			for(var i = 0; i<this.partCount*PART_MAXVAR; i+=PART_MAXVAR){
				var maxZ = this.limiters[j + L_Z_MAX];
				var minZ = this.limiters[j + L_Z_MIN];
				var resti = this.limiters[j + L_RESTI];
				if( this.s2[PART_ZPOS + i] < minZ && this.s2[PART_ZVEL + i] < 0.0) {
					this.s2[PART_ZPOS + i] = minZ;					
					this.s2[PART_ZVEL + i] = this.s1[PART_ZVEL + i];

					if(this.s2[PART_ZVEL + i] < 0.0) 
						this.s2[PART_ZVEL + i] = -resti * this.s2[PART_ZVEL + i]; 
					else 
						this.s2[PART_ZVEL + i] =  resti * this.s2[PART_ZVEL + i];	
						
				}
				else if( this.s2[PART_ZPOS + i] > maxZ && this.s2[PART_ZVEL + i] > 0.0) { 		
					this.s2[PART_ZPOS + i] = maxZ;					
					this.s2[PART_ZVEL + i] = this.s1[PART_ZVEL + i];

					if(this.s2[PART_ZVEL + i] > 0.0) 
						this.s2[PART_ZVEL + i] = -resti * this.s2[PART_ZVEL + i]; 
					else 
						this.s2[PART_ZVEL + i] =  resti * this.s2[PART_ZVEL + i];	
				}
				
				
				var r = Math.sqrt(Math.pow(this.s2[PART_XPOS + i],2) + Math.pow(this.s2[PART_YPOS + i], 2));
				var v = Math.sqrt(Math.pow(this.s2[PART_XVEL + i],2) + Math.pow(this.s2[PART_YVEL + i], 2));
				var RDotV = this.s2[PART_XPOS + i]*this.s2[PART_XVEL + i] + this.s2[PART_YPOS + i]*this.s2[PART_YVEL + i];
				var R = this.limiters[j + L_RAD];
				
				if(r > R && RDotV > 0){
					this.s2[PART_XVEL + i] = -this.s2[PART_XPOS + i]*v*resti/r;
					this.s2[PART_YVEL + i] = -this.s2[PART_YPOS + i]*v*resti/r;
					
					this.s2[PART_XPOS + i] = this.s2[PART_XPOS + i]*R/r;
					this.s2[PART_YPOS + i] = this.s2[PART_YPOS + i]*R/r;
				}
			}
			break;
		default:
			console.log('Unknown CLIMIT type!');
		}
	}
}


PartSys.prototype.applyForces = function(s, fList) {
	var j = 0;
		for(j = 0; j < this.partCount*PART_MAXVAR; j += PART_MAXVAR){
			s[PART_X_FTOT + j] = 0;
			s[PART_Y_FTOT + j] = 0;
			s[PART_Z_FTOT + j] = 0;
			
	}
	
	var i = 0;
	for(i = 0; i < this.forceCount*F_MAXVAR; i+= F_MAXVAR){
		switch(fList[i + F_TYPE]){
			case F_GRAV:
				var j = 0;
				for(j = 0; j < this.partCount*PART_MAXVAR; j += PART_MAXVAR){
					var downVec = new Vector3([0,0,-1]);
					s[PART_X_FTOT + j] += downVec.elements[0]*s[j + PART_MASS]*fList[i + F_GCONST];
					s[PART_Y_FTOT + j] += downVec.elements[1]*s[j + PART_MASS]*fList[i + F_GCONST];
					s[PART_Z_FTOT + j] += downVec.elements[2]*s[j + PART_MASS]*fList[i + F_GCONST];
				}
				
			break;
			
			case F_DRAG:
				var j = 0;
				for(j = 0; j < this.partCount*PART_MAXVAR; j += PART_MAXVAR){
					s[PART_X_FTOT + j] -= s[PART_XVEL + j]*fList[i + F_DAMPING];
					s[PART_Y_FTOT + j] -= s[PART_YVEL + j]*fList[i + F_DAMPING];
					s[PART_Z_FTOT + j] -= s[PART_ZVEL + j]*fList[i + F_DAMPING];
				}
				
			break;

			case F_SPRING:
				var e1 = (fList[i+F_IND_1])*PART_MAXVAR;
				var e2 = (fList[i+F_IND_2])*PART_MAXVAR;
				var xDiff = s[PART_XPOS + e2] -  s[PART_XPOS + e1];
				var yDiff = s[PART_YPOS + e2] -  s[PART_YPOS + e1];
				var zDiff = s[PART_ZPOS + e2] -  s[PART_ZPOS + e1];
				var length = Math.sqrt(xDiff*xDiff + yDiff*yDiff + zDiff*zDiff);

				if(length == 0){ 
					length = 0.00001
				}
				
				xDiff /= length;
				yDiff /= length;
				zDiff /= length;
				
				var intensity = (length - fList[i + F_RLEN]) * fList[i + F_KCONST];
				s[PART_X_FTOT + e1] += xDiff*intensity;
				s[PART_Y_FTOT + e1] += yDiff*intensity;
				s[PART_Z_FTOT + e1] += zDiff*intensity;

				s[PART_X_FTOT + e2] -= xDiff*intensity;
				s[PART_Y_FTOT + e2] -= yDiff*intensity;
				s[PART_Z_FTOT + e2] -= zDiff*intensity;
			break;
			
				
			case F_WIND:
				var j=0;
				
				if(this.age + this.windDelay > fList[i + F_LEN]){
					this.windDelay = -1 * this.age;
					this.windMag = fList[i + F_MAG];
				}
				
				var sigma  = 0.75;
				var t = this.age + this.windDelay;
				var b = fList[i + F_LEN]/2;
				var intensity = this.windMag/sigma*Math.exp(-Math.pow(t-b, 2)/(2*Math.pow(sigma,2)));
				
				for(j = 0; j < this.partCount*PART_MAXVAR; j += PART_MAXVAR){
					s[PART_X_FTOT + j] += 8*Math.random()*(Math.random() < 0.5 ? -1 : 1)*intensity*fList[i + F_XDIR]*s[j + PART_MASS];
					s[PART_Y_FTOT + j] += WIND_DIR * intensity*fList[i + F_YDIR]*s[j + PART_MASS];
					s[PART_Z_FTOT + j] += (0.7+0.5*Math.random())*intensity*fList[i + F_ZDIR]*s[j + PART_MASS];
				}
			break;
				
			case F_SEPARATION:
				for(var p = 0; p<this.boidsCount*PART_MAXVAR; p+=PART_MAXVAR){
					for(var j = 0 ; j<this.boidsCount*PART_MAXVAR; j+=PART_MAXVAR){
						if (j!= p) {
							var xDiff = s[PART_XPOS + j] - s[PART_XPOS + p];
							var yDiff = s[PART_YPOS + j] - s[PART_YPOS + p];
							var zDiff = s[PART_ZPOS + j] - s[PART_ZPOS + p];
							
							var distance = Math.pow(xDiff,2) + Math.pow(yDiff,2) + Math.pow(zDiff,2);
							if(distance < 0.01){
								distance = 0.01;
							}
							
							xDiff /= Math.sqrt(distance);
							yDiff /= Math.sqrt(distance);
							zDiff /= Math.sqrt(distance);
							
							s[PART_X_FTOT + p] -= (fList[F_MAG + i]/distance)*xDiff;
							s[PART_Y_FTOT + p] -= (fList[F_MAG + i]/distance)*yDiff;
							s[PART_Z_FTOT + p] -= (fList[F_MAG + i]/distance)*zDiff;
							
							s[PART_X_FTOT + j] += (fList[F_MAG + i]/distance)*xDiff;
							s[PART_Y_FTOT + j] += (fList[F_MAG + i]/distance)*yDiff;
							s[PART_Z_FTOT + j] += (fList[F_MAG + i]/distance)*zDiff;
						}
					}
				}
			
			break;
			
			case F_COHESION:
				var xCen = 0;
				var yCen = 0;
				var zCen = 0;
				
				for(var j = 0; j<this.boidsCount*PART_MAXVAR; j+=PART_MAXVAR){
					xCen += s[PART_XPOS + j];
					yCen += s[PART_YPOS + j];
					zCen += s[PART_ZPOS + j];
				}
				
				xCen /= this.boidsCount;
				yCen /= this.boidsCount;
				zCen /= this.boidsCount;
				
				for(var j = 0; j<this.boidsCount*PART_MAXVAR; j+=PART_MAXVAR){	
					var xDiff = s[PART_XPOS + j] - xCen;
					var yDiff = s[PART_YPOS + j] - yCen;
					var zDiff = s[PART_ZPOS + j] - zCen;
					
					var distance = Math.pow(xDiff,2) + Math.pow(yDiff,2) + Math.pow(zDiff,2);
					if(distance < 0.01){
						distance = 0.01;
					}
						
					xDiff = xDiff/Math.sqrt(distance);
					yDiff = yDiff/Math.sqrt(distance);
					zDiff = zDiff/Math.sqrt(distance);
					
					s[PART_X_FTOT + j] -= (fList[F_MAG + i])*xDiff;
					s[PART_Y_FTOT + j] -= (fList[F_MAG + i])*yDiff;
					s[PART_Z_FTOT + j] -= (fList[F_MAG + i])*zDiff;
				}
			
			break;
			
			case F_ALIGN:
				var xVe = 0;
				var yVe = 0;
				var zVe = 0;
				for(var j = 0; j<this.boidsCount*PART_MAXVAR; j+=PART_MAXVAR){	
					xVe += s[PART_XVEL + j];
					yVe += s[PART_YVEL + j];
					zVe += s[PART_ZVEL + j];
				
				}
				xVe /= this.boidsCount;
				yVe /= this.boidsCount;
				zVe /= this.boidsCount;
				
				for(var j = 0; j<this.boidsCount*PART_MAXVAR; j+=PART_MAXVAR){
					var xDiff = s[PART_XVEL + j] - xVe;
					var yDiff = s[PART_YVEL + j] - yVe;
					var zDiff = s[PART_ZVEL + j] - zVe;

					s[PART_X_FTOT + j] += (fList[F_MAG + i])*xDiff;
					s[PART_Y_FTOT + j] += (fList[F_MAG + i])*yDiff;
					s[PART_Z_FTOT + j] += (fList[F_MAG + i])*zDiff;
				}                      
			
			break;

			case F_EVASION:
				for(var j = 0 ; j<this.boidsCount*PART_MAXVAR; j+=PART_MAXVAR){
					var xDiff = s[PART_XPOS + j] - s[PART_XPOS + this.boidsCount*PART_MAXVAR];
					var yDiff = s[PART_YPOS + j] - s[PART_YPOS + this.boidsCount*PART_MAXVAR];
					var zDiff = s[PART_ZPOS + j] - s[PART_ZPOS + this.boidsCount*PART_MAXVAR];
					
					var distance = Math.pow(xDiff,2) + Math.pow(yDiff,2) + Math.pow(zDiff,2);
					if(distance < 0.01){
						distance = 0.01;
					}
					
					xDiff /= Math.sqrt(distance);
					yDiff /= Math.sqrt(distance);
					zDiff /= Math.sqrt(distance);
					
					s[PART_X_FTOT + j] -= (fList[F_MAG + i] * -1)*xDiff;
					s[PART_Y_FTOT + j] -= (fList[F_MAG + i] * -1)*yDiff;
					s[PART_Z_FTOT + j] -= (fList[F_MAG + i] * -1)*zDiff;
				}    
			
			break;
		
			default:
				console.log("CForcer type not recognised!");
		}
		
		
	}
}

PartSys.prototype.swap = function() {
	this.s1.set(this.s2);
}

PartSys.prototype.swap2 = function() {
	this.s2.set(this.s1);
}
