SOLVER_TYPE = 3;
RUN_MODE = 3;

WIND_DIR = 1;
ROPE_LEVEL = 1;
FIRE_COLOR = 0;
OBSTACLE_LEVEL = 0;

PartSys.prototype.initWind = function(count) {
    this.partCount = count;
	this.age = 0;

    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2dot = new Float32Array(this.partCount * PART_MAXVAR);

    this.windMag = 0.0;
    this.windDelay = 500;

    this.forceCount = 0;
    this.forces = [];
    
    var grav = new CForcer();
    grav.initGrav();
    this.forces = this.forces.concat(grav.attributes);
    this.forceCount++;
    
    var drag = new CForcer();
    drag.initDrag(0.9);
    this.forces = this.forces.concat(drag.attributes);
    this.forceCount++;

    var windforce = new CForcer();
    windforce.initWind(1, -1, 5, 15, 10);
    this.forces = this.forces.concat(windforce.attributes);
    this.forceCount++;

    this.limitCount = 0;
    this.limiters = [];
    
    var boxlimit = new CLimit();
    boxlimit.initBox(0.0, 5.0, -10.0, 5.0, 0.0, 10.0, 0.3);
    this.limiters = this.limiters.concat(boxlimit.attributes);
    this.limitCount++;
    
    console.log("Wind Forces: " + this.forces);
    console.log("Wind Constraints: " + this.limiters);

    var j = 0;
    for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
        this.s1[j + PART_XPOS] =  Math.random();
        this.s1[j + PART_YPOS] =  Math.random();      // with a 0.1 margin
        this.s1[j + PART_ZPOS] =  Math.random();
        this.s1[j + PART_WPOS] =  1.0; 
        this.s1[j + PART_XVEL] =  7.5 * Math.random();//this.INIT_VEL;
        this.s1[j + PART_YVEL] =  7.5 * Math.random();//this.INIT_VEL;
        this.s1[j + PART_ZVEL] =  7.5 * Math.random();
        this.s1[j + PART_R] =  0.0;
        this.s1[j + PART_G] =  0.8;
        this.s1[j + PART_B] =  0.2;
        this.s1[j + PART_MASS] =  0.5 + Math.random() * 0.3;      // mass, in kg.
        this.s1[j + PART_DIAM] =  20.0;      // on-screen diameter, in pixels
        this.s1[j + PART_AGE] = 0.0;
        this.s1[j + PART_RENDMODE] = 0.0;

        this.swap2();
    }
 
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;
    this.shaderLoc = createProgram(gl, PARTSYS_VSHADER, PARTSYS_FSHADER); 
    
    this.setGl();
}


PartSys.prototype.initBoids = function(count) {
    this.partCount = count + 1;  // with one more evastion obstacle particle
	this.age = 0;
    
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2dot = new Float32Array(this.partCount * PART_MAXVAR);
    
    this.boidsCount = count;
    this.forceCount = 0;
    this.forces = [];
    
    var separation = new CForcer();
    separation.initSeparation(0.7);
    this.forces = this.forces.concat(separation.attributes);
    this.forceCount++;
    
    var cohesion = new CForcer();
    cohesion.initCohesion(3.0);
    this.forces = this.forces.concat(cohesion.attributes);
    this.forceCount++;
    
    var alignment = new CForcer();
    alignment.initAlignment(0.9);
    this.forces = this.forces.concat(alignment.attributes);
    this.forceCount++;

    var evasion = new CForcer();
    evasion.initEvasion(0.8);
    this.forces = this.forces.concat(evasion.attributes);
    this.forceCount++;
  
    var drag = new CForcer();
    drag.initDrag(0.8);
    this.forces = this.forces.concat(drag.attributes);
    this.forceCount++;
    
    this.limitCount = 0;
    this.limiters = [];
    
    var cylinder = new CLimit();
    cylinder.initCylinder(5.0, 0.0, 8.0, 0.3);
    this.limiters = this.limiters.concat(cylinder.attributes);
    this.limitCount++;
    
    var anchor = new CLimit();
    anchor.initAnchor(this.partCount - 1, 0, 0, 5);
    this.limiters = this.limiters.concat(anchor.attributes);
    this.limitCount++;

    console.log("Boids Forces: " + this.forces);
    console.log("Boids Constraints: " + this.limiters);

    var j = (this.partCount - 1) * PART_MAXVAR;
    for(var i = this.partCount - 1; i >= 0; i--, j-= PART_MAXVAR) {
        if (i < this.partCount - 1) {
            this.s1[j + PART_XPOS] = Math.random()*5;      // lower-left corner of CVV
            this.s1[j + PART_YPOS] = Math.random()*5;    // with a 0.1 margin
            this.s1[j + PART_ZPOS] =  Math.random()*5; 
            this.s1[j + PART_WPOS] =  1.0;      // position 'w' coordinate;

            this.s1[j + PART_XVEL] =  7.5 * Math.random();//this.INIT_VEL;
            this.s1[j + PART_YVEL] =  7.5 * Math.random();//this.INIT_VEL;
            this.s1[j + PART_ZVEL] =  7.5 * Math.random();
            this.s1[j + PART_R] =  1.0;
            this.s1[j + PART_G] =  1.0;
            this.s1[j + PART_B] =  1.0;
            this.s1[j + PART_MASS] =  1.0;      // mass, in kg.
            this.s1[j + PART_DIAM] =  40;      // on-screen diameter, in pixels
            this.s1[j + PART_AGE] = 0.0;
            this.s1[j + PART_RENDMODE] = 0.0;
        } else {
            this.s1[j + PART_XPOS] = 0;      // lower-left corner of CVV
            this.s1[j + PART_YPOS] = 0;    // with a 0.1 margin
            this.s1[j + PART_ZPOS] =  5; 
            this.s1[j + PART_WPOS] =  1.0;      // position 'w' coordinate;

            this.s1[j + PART_XVEL] =  0;//this.INIT_VEL;
            this.s1[j + PART_YVEL] =  0;//this.INIT_VEL;
            this.s1[j + PART_ZVEL] =  0;
            this.s1[j + PART_R] =  1.0;
            this.s1[j + PART_G] =  0.5;
            this.s1[j + PART_B] =  0.0;
            this.s1[j + PART_MASS] =  1.0;      // mass, in kg.
            this.s1[j + PART_DIAM] =  100;      // on-screen diameter, in pixels
            this.s1[j + PART_AGE] = 0.0;
            this.s1[j + PART_RENDMODE] = 0.0;
        }

        this.swap2();
    }

    this.FSIZE = this.s1.BYTES_PER_ELEMENT;
    this.shaderLoc = createProgram(gl, PARTSYS_VSHADER, PARTSYS_FSHADER); 
    
    this.setGl();
}


PartSys.prototype.initRope = function(count) {
    this.partCount = count;
	this.age = 0;
    
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2dot = new Float32Array(this.partCount * PART_MAXVAR);
    
    this.forceCount = 0;
    this.forces = [];
    
    var grav = new CForcer();
    grav.initGrav();
    this.forces = this.forces.concat(grav.attributes);
    this.forceCount++;

    var drag = new CForcer();
    drag.initDrag(1.8);
    this.forces = this.forces.concat(drag.attributes);
    this.forceCount++;
    
    for(var i = 1 ; i <this.partCount; i++){
      var spring = new CForcer();
      spring.initSpring(200, 0.2, i, i - 1);
      this.forces = this.forces.concat(spring.attributes);
      this.forceCount++;
    }
    
    this.limitCount = 0;
    this.limiters = [];
    
    var anchor = new CLimit();
    anchor.initAnchor(0, 0, -8, 7);
    this.limiters = this.limiters.concat(anchor.attributes);
    this.limitCount++;

    var anchor2 = new CLimit();
    anchor2.initAnchor(11, 0, 3, 7);
    this.limiters = this.limiters.concat(anchor2.attributes);
    this.limitCount++;

    console.log("Rope Forces: " + this.forces);
    console.log("Rope Constraints: " + this.limiters);

    for(var j = 0; j < this.partCount*PART_MAXVAR; j+= PART_MAXVAR) {
        this.s1[j + PART_XPOS] = 0.0;
        this.s1[j + PART_YPOS] = -8 + 1 *(j / PART_MAXVAR);
        this.s1[j + PART_ZPOS] = 7.0; 
        this.s1[j + PART_WPOS] = 1.0;      // position 'w' coordinate;

        this.s1[j + PART_XVEL] = 0.0;//this.INIT_VEL;
        this.s1[j + PART_YVEL] = 0.0;//this.INIT_VEL;
        this.s1[j + PART_ZVEL] = 0.0;
        this.s1[j + PART_R] =  1.0;
        this.s1[j + PART_G] =  0.5;
        this.s1[j + PART_B] =  0.6;
        this.s1[j + PART_MASS] =  1.5;      // mass, in kg.
        this.s1[j + PART_DIAM] =  25.0;      // on-screen diameter, in pixels
        this.s1[j + PART_AGE] = 0.0;
        this.s1[j + PART_RENDMODE] = 0.0;

        this.swap2();
    }

    this.FSIZE = this.s1.BYTES_PER_ELEMENT;
    this.shaderLoc = createProgram(gl, PARTSYS_VSHADER, PARTSYS_FSHADER_2); 

    this.setGl();
}


PartSys.prototype.initFire = function(count) {
    this.partCount = count;
	this.age = 0;
    this.s1 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2 = new Float32Array(this.partCount * PART_MAXVAR);
    this.s1dot = new Float32Array(this.partCount * PART_MAXVAR);
    this.s2dot = new Float32Array(this.partCount * PART_MAXVAR);

    this.lifeTime = 1.2;
    this.startColor = {'R' :  1.0, 'G' : 0.0, 'B' : 0.0};
    this.endColor = {'R' :  1.0, 'G' : 1.0, 'B' : 0.0};

    this.startSize = 30.0;
    this.endSize = 5.0;
    
    this.forceCount = 0;
    this.forces = [];
    
    var drag = new CForcer();
    drag.initDrag(0.3);
    this.forces = this.forces.concat(drag.attributes);
    this.forceCount++;

    this.limitCount = 0;
    this.limiters = [];
    
    var boxlimit = new CLimit();
    boxlimit.initBox(-5.0,5.0,-5.0,5.0, 0.0, 8.0, 0.95);
    this.limiters = this.limiters.concat(boxlimit.attributes);
    this.limitCount++;
    
    var firelimit = new CLimit();
    firelimit.initFire(this.lifeTime, 0.5, 0.0, 0.0, 1.0);
    this.limiters = this.limiters.concat(firelimit.attributes);
    this.limitCount++;
    
    console.log("Fire Forces: " + this.forces);
    console.log("Fire Constraints: " + this.limiters);

    var j = 0;
    for(var i = 0; i < this.partCount; i += 1, j+= PART_MAXVAR) {
        this.s1[j + PART_XPOS] = 0.0;
        this.s1[j + PART_YPOS] =  0.0;      // with a 0.1 margin
        this.s1[j + PART_ZPOS] =  0.0;
        this.s1[j + PART_WPOS] =  1.0;      // position 'w' coordinate;
        this.s1[j + PART_XVEL] =  0.0;//this.INIT_VEL;
        this.s1[j + PART_YVEL] =  0.0;//this.INIT_VEL;
        this.s1[j + PART_ZVEL] =  0.0;
        this.s1[j + PART_R] =  this.startColor.R;
        this.s1[j + PART_G] =  this.startColor.G;
        this.s1[j + PART_B] =  this.startColor.B;
        this.s1[j + PART_MASS] =  1.0;      // mass, in kg.
        this.s1[j + PART_DIAM] =  5.0;      // on-screen diameter, in pixels
        this.s1[j + PART_AGE] = i*this.lifeTime/this.partCount;
        this.s1[j + PART_RENDMODE] = 0.0;

        this.swap2();
    }
  
    this.FSIZE = this.s1.BYTES_PER_ELEMENT;
    this.shaderLoc = createProgram(gl, PARTSYS_VSHADER, PARTSYS_FSHADER_3); 
    
    this.setGl();
}

PartSys.prototype.setGl = function() {
    if (!this.shaderLoc) {
        console.log(this.constructor.name + 
            '.init() failed to create executable Shaders on the GPU. Bye!');
        return;
    }
      
    this.vboID = gl.createBuffer();
    if (!this.vboID) {
        console.log('PartSys.init() Failed to create the VBO object in the GPU');
        return -1;
    }
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vboID);
    gl.bufferData(gl.ARRAY_BUFFER, this.s1, gl.DYNAMIC_DRAW);

    this.a_PositionID = gl.getAttribLocation(this.shaderLoc, 'a_Position');
    if(this.a_PositionID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Position');
        return -1;
    }
  
    gl.vertexAttribPointer(this.a_PositionID, 
        4,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_XPOS * this.FSIZE); // Offset; #bytes from start of buffer to 

    gl.enableVertexAttribArray(this.a_PositionID);
    
    this.a_ColorID = gl.getAttribLocation(this.shaderLoc, 'a_Color');
    if(this.a_Color < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_Color');
        return -1;
    }

    gl.vertexAttribPointer(this.a_ColorID, 
        3,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_R * this.FSIZE); // Offset; #bytes from start of buffer to 

    gl.enableVertexAttribArray(this.a_ColorID);
    
    
    this.a_PointSizeID = gl.getAttribLocation(this.shaderLoc, 'a_PointSize');
    if(this.a_PointSizeID < 0) {
        console.log('PartSys.init() Failed to get the storage location of a_PointSize');
    }
    
    gl.vertexAttribPointer(this.a_PointSizeID, 
        1,  // # of values in this attrib (1,2,3,4) 
        gl.FLOAT, // data type (usually gl.FLOAT)
        false,    // use integer normalizing? (usually false)
        PART_MAXVAR*this.FSIZE,  // Stride: #bytes from 1st stored value to next one
        PART_DIAM * this.FSIZE); // Offset; #bytes from start of buffer to 

    gl.enableVertexAttribArray(this.a_PointSizeID);
    
    this.u_runModeID = gl.getUniformLocation(this.shaderLoc, 'u_runMode');
    if(!this.u_runModeID) {
    console.log('PartSys.init() Failed to get u_runMode variable location');
    return;
    }
    this.u_ModelMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMat');
    if(!this.u_ModelMatLoc) {
        console.log('PartSys.init() Failed to get u_ModelMat variable location');
        return;
    }
    
    this.u_MVPMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_MVPMat');
    if(!this.u_MVPMatLoc) {
        console.log('PartSys.init() Failed to get u_MVPMat variable location');
        return;
    }
    
    this.u_EyePosLoc = gl.getUniformLocation(this.shaderLoc, 'u_EyePos');
    if(!this.u_EyePosLoc) {
        console.log('PartSys.init() Failed to get u_EyePos variable location');
        return;
    }
    
    gl.uniform1i(this.u_runModeID, RUN_MODE);
}