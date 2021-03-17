function CLight(){
	this.isOn = true;
	this.colors = new Colors();
	this.position = vec4.create();
}

function Colors(){
	this.ambi = vec4.create();
	this.diff = vec4.create();
	this.spec = vec4.create();
	this.shiny = 0;
}

Colors.prototype.setValues = function(ambient, diffuse, spec, shiny){
	if(ambient){
		vec4.copy(this.ambi, ambient);
	}
	if(diffuse){
		vec4.copy(this.diff, diffuse);
	}
	if(spec){
		vec4.copy(this.spec, spec);
	}
	if(shiny){
		vec4.copy(shiny, shiny);
	}
}

CLight.prototype.setPos = function (position) {
	vec4.copy(this.position, position);
}