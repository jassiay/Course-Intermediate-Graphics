const L_BOX = 0;
const L_CYLINDER = 1;
const L_ANCHOR = 2;
const L_FIRETYPE = 3;

const L_MAXVAR = 12;

const L_TYPE = 0;
const L_X_MIN = 1;
const L_X_MAX = 2;
const L_Y_MIN = 3;
const L_Y_MAX = 4;
const L_Z_MIN = 5;
const L_Z_MAX = 6;
const L_RESTI = 7;
const L_LTIME = 8;
const L_LAUNCH = 9;
const L_IND = 10;
const L_RAD = 11;

class CLimit {
	constructor() {

	}

	initBox = (xMin, xMax, yMin, yMax, zMin, zMax, resti) => {
		this.attributes = new Array(L_MAXVAR);
	
		this.attributes[L_TYPE] = L_BOX;
		
		this.attributes[L_X_MIN] = xMin;
		this.attributes[L_X_MAX] = xMax;
		this.attributes[L_Y_MIN] = yMin;
		this.attributes[L_Y_MAX] = yMax;
		this.attributes[L_Z_MIN] = zMin;
		this.attributes[L_Z_MAX] = zMax;
		this.attributes[L_RESTI] = resti;
	}

	initCylinder = (radius, zMin, zMax, resti) => {
		this.attributes = new Array(L_MAXVAR);
	
		this.attributes[L_TYPE] = L_CYLINDER;
		
		this.attributes[L_RAD] = radius;
		this.attributes[L_Z_MIN] = zMin;
		this.attributes[L_Z_MAX] = zMax;
		this.attributes[L_RESTI] = resti;
	}

	initAnchor = (ind, x, y, z) => {
		this.attributes = new Array(L_MAXVAR);
	
		this.attributes[L_TYPE] = L_ANCHOR;
		this.attributes[L_X_MIN] = x;
		this.attributes[L_Y_MIN] = y;
		this.attributes[L_Z_MIN] = z;
		this.attributes[L_IND] = ind;
	}

	initFire = (lifetime, speed, xMin, yMin, zMin) => {
		this.attributes = new Array(L_MAXVAR);
	
		this.attributes[L_TYPE] = L_FIRETYPE;
		
		this.attributes[L_LTIME] = lifetime;
		this.attributes[L_LAUNCH] = speed;
		this.attributes[L_X_MIN] = xMin;
		this.attributes[L_Y_MIN] = yMin;
		this.attributes[L_Z_MIN] = zMin;
	}
}