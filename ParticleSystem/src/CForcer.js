const F_GRAV = 0;
const F_DRAG = 1;
const F_SPRING = 2;
const F_WIND = 3;
const F_SEPARATION = 4;
const F_ALIGN = 5;
const F_COHESION = 6;
const F_EVASION = 7;

const F_MAXVAR = 12;

const F_TYPE = 0;
const F_KCONST = 1;
const F_RLEN = 2;
const F_DAMPING = 3;
const F_IND_1 = 4;
const F_IND_2 = 5;
const F_GCONST = 6;
const F_XDIR = 7;
const F_YDIR = 8;
const F_ZDIR = 9;
const F_MAG = 10;
const F_LEN = 11;

class CForcer {
	constructor() {

	}

	initGrav = () => {
		this.attributes = new Array(F_MAXVAR);
	
		this.attributes[F_TYPE] = F_GRAV;
		this.attributes[F_GCONST] = 9.832;
	}

	initDrag = (damping) => {
		this.attributes = new Array(F_MAXVAR);
		
		this.attributes[F_TYPE] = F_DRAG;
		this.attributes[F_DAMPING] = damping;
	}

	initSpring = (k, l, ind1, ind2) => {
		this.attributes = new Array(F_MAXVAR);
		
		this.attributes[F_TYPE] = F_SPRING;
		this.attributes[F_KCONST] = k;
		this.attributes[F_RLEN] = l;
		this.attributes[F_IND_1] = ind1;
		this.attributes[F_IND_2] = ind2;
	}

	initWind = (x, y, z, force, len) => {
		this.attributes = new Array(F_MAXVAR);

		this.attributes[F_TYPE] = F_WIND;
		var dir = Math.sqrt(x*x + y*y + z*z);
		this.attributes[F_XDIR] = x/dir;
		this.attributes[F_YDIR] = y/dir;
		this.attributes[F_ZDIR] = z/dir;
		
		this.attributes[F_MAG] = force;
		this.attributes[F_LEN] = len;
	}

	initCohesion = (intensity) => {
		this.attributes = new Array(F_MAXVAR);
	
		this.attributes[F_TYPE] = F_COHESION;
		this.attributes[F_MAG] = intensity;
	}

	initAlignment = (intensity) => {
		this.attributes = new Array(F_MAXVAR);
	
		this.attributes[F_TYPE] = F_ALIGN;
		this.attributes[F_MAG] = intensity;
	}

	initSeparation = (intensity) => {
		this.attributes = new Array(F_MAXVAR);
	
		this.attributes[F_TYPE] = F_SEPARATION;
		this.attributes[F_MAG] = intensity;
	}

	initEvasion = (intensity) => {
		this.attributes = new Array(F_MAXVAR);
	
		this.attributes[F_TYPE] = F_EVASION;
		this.attributes[F_MAG] = intensity;
	}
}