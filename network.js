/***********************************************************************************/
/********************************    Edges     *************************************/
/***********************************************************************************/
/***********************************************************************************/

var Edge = function(atom1, atom2, strength = 1){
	this.atom1 = atom1
	this.atom2 = atom2
	this.strength = strength
	this.visited = false
}

Edge.prototype.getSecond = function(){
	return this.atom2
}

Edge.prototype.getVisited = function(){
	return this.visited
}

Edge.prototype.setVisited = function(){
	this.visited = true
}

Edge.prototype.resetVisited = function(){
    this.visited = false
}

/***********************************************************************************/
/********************************    Node     *************************************/
/***********************************************************************************/
/***********************************************************************************/
/** parameters should have position etc...*/

var Node = function(atom, aid, name,
	props = {mass: 1, position:new THREE.Vector3(0, 0, 0),
		 			  velocity:new THREE.Vector3(0, 0, 0), 
		              acceleration: new THREE.Vector3(0, 0, 0), 
		              force:new THREE.Vector3(0, 0, 0)},  
    edges = []){
	this.atom = atom
	this.atom.position.x = props.position.x
	this.atom.position.y = props.position.y
	this.atom.position.z = props.position.z
	this.aid = aid
	this.position = props.position
	this.velocity = props.velocity
	this.acceleration = props.acceleration
    this.edges = edges;
    this.mass = props.mass;
    this.name = name;
}

// 
Node.prototype.updateForce = function(force){
    this.force = force
}

Node.prototype.computeForce = function(network = null){
    var newForce = new THREE.Vector3(0, 0, 0)
    var thisCopy = new THREE.Vector3(this.position.x, this.position.y, this.position.z)

	this.edges.forEach(function(e, i){	
		var dist = thisCopy.distanceTo(e.atom2.position)
		dist = dist < 1 ? 1 : dist
		var forceTmp = thisCopy.sub(e.atom2.position)
		forceTmp.normalize()
		forceTmp.multiplyScalar(settings.hookeConstant * (e.strength - dist))
		newForce.add(forceTmp)
	})
	this.force = newForce
}

Node.prototype.updateVelocity = function(t){ // using its current velocity
	var c = new THREE.Vector3(this.acceleration.x, this.acceleration.y, this.acceleration.z);
    this.velocity.add(c.multiplyScalar(t))
}


Node.prototype.updateAcceleration = function(){ // using its current force
	var forceCopy = new THREE.Vector3(this.force.x, this.force.y, this.force.z)
    this.acceleration = forceCopy.divideScalar(this.mass)
    		 	
}

Node.prototype.updatePosition = function(t){
	 var c1 = new THREE.Vector3(this.velocity.x, this.velocity.y, this.velocity.z), 
	 c2 = new THREE.Vector3(this.acceleration.x, this.acceleration.y, this.acceleration.z);
	 this.position.add(c1.multiplyScalar(t));
     this.position.add(c2.multiplyScalar(0.5 * t * t));
}

Node.prototype.setVelocity = function(velocity){
	this.velocity = velocity
}

Node.prototype.setPosition = function(position){
	this.position = position
}

Node.prototype.getVisited = function(){
	return this.visited
}

Node.prototype.setVisited = function(){
	this.visited = true
}

Node.prototype.setVisited = function(node){
	this.edges.forEach(function(edge){
       if(edge.atom2.aid == node.aid){
            edge.setVisited()
            node.edges.forEach(function(another){
            	if(another.atom2.aid == this.aid){
                	another.edge.setVisited()
            	}
            })
        }
    })
}

Node.prototype.resetVisited = function(){
    this.visited = false
}

Node.prototype.addNeighbor = function(node, strength){
	if(this.hasThisNeighbor(node) == false){
        this.edges.push(new Edge(this, node, strength))
        node.edges.push(new Edge(node, this, strength))
    }
}

Node.prototype.hasThisNeighbor = function(node){
	 this.edges.forEach(function(edge){
        if(edge.getSecond().aid == node.aid){
        	return true
        }
    })
	 return false
}

Node.prototype.getNeighbors = function(){
    var neighbors = []
    this.edges.forEach(function(edge){
        neighbors.push(edge.getSecond())
    })
    return neighbors
}

/***********************************************************************************/
/********************************    Network   *************************************/
/***********************************************************************************/
/***********************************************************************************/
var Network = function(root){
    this.nodeList = []
	this.nodeList.push(root)
}

Network.prototype.addNode = function(node){
	this.nodeList.forEach(function(thisNode){
        if(thisNode.aid == node.aid){
        	return
        }
	})
	this.nodeList.push(node)
}

Network.prototype.getNodeList = function(){
	return this.nodeList
}

Network.prototype.getNode = function(aid){
	var result
		this.nodeList.forEach(function(node){
        if(node.aid == +aid){
        	result = node
        }
	})
		return result
}

Network.prototype.resetVisited = function(){
	this.nodeList.forEach(function(node){
          node.resetVisited();
	})
}

Network.prototype.getEnergy = function(){
    var energy = 0;
	this.nodeList.forEach(function(node){
        var thisCopy = new THREE.Vector3(node.position.x, node.position.y, node.position.z)
        node.edges.forEach(function(e, i){ 
            var dist = thisCopy.distanceTo(e.atom2.position)
            energy += 0.5 * settings.hookeConstant * (e.strength - dist) * (e.strength - dist) / (settings.unitScale*settings.unitScale);
        })
    })
    return energy
}

Network.prototype.recomputeForceAcc = function(){
	this.nodeList.forEach(function(n, i){
		n.computeForce()
		n.updateAcceleration()
	})
}
Network.prototype.updateNodes = function(){
	this.nodeList.forEach(function(n, i){
			n.updatePosition(settings.timeStep)
			n.updateVelocity(settings.timeStep)
	})
}

/**********************************************************************************/
/******************************    Build Network   *********************************/
/************************************************************************************/
/***********************************************************************************/

/******************************    Constants   *********************************/
// unit scale: 2000 units -> ~7 angstroms
settings = {unitScale : 285,
hookeConstant : 0.03, // in amu/s^2 ---- not actually correct, need to figure out why so unstable
timeStep : 0.2,
opacityThreshold : 0.1,
opacityThresholdScale : 0.1 * 10000,
}

/******************************    Hydrogen	   *********************************/
var HHDistance = 0.74; // equilibrium bond distance in angstroms
var HMass = 1; // mass in amu
var HRadius = 0.25; // empirical radius in angstroms
var HColor = 0x008080;

/******************************    Water	   *********************************/
var HODistance = 0.96;
var ORadius = 0.60;
var OColor = 0xffffff;

/******************************    Oxygen	   *********************************/
var OODistance = 1.48;
var OMass = 16;

/******************************     Water     *********************************/
var atomGeo1 = new THREE.SphereGeometry( settings.unitScale * HRadius, 100, 100 );
var atomGeo2 = new THREE.SphereGeometry( settings.unitScale * HRadius, 100, 100 );
var atomGeo3 = new THREE.SphereGeometry( settings.unitScale * ORadius, 100, 100 );

var materialWhite1 = new THREE.MeshLambertMaterial( {color: OColor} )
var materialWhite2 = new THREE.MeshLambertMaterial( {color: OColor} )
var materialGray = new THREE.MeshLambertMaterial( {color: 0x555555} )
var materialCyan = new THREE.MeshLambertMaterial( {color: HColor} )

var atom1 = new THREE.Mesh(atomGeo1, materialWhite1);
var atom2 = new THREE.Mesh(atomGeo2, materialWhite2);
var atom3 = new THREE.Mesh(atomGeo3, materialCyan);

var node1 = new Node(atom1, 1, "H",
					{mass: HMass, 
					 position:new THREE.Vector3(150, 10, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})
var node2 = new Node(atom2, 2, "H", 
					{mass: HMass, 
					 position:new THREE.Vector3(-150, 10, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})
var node3 = new Node(atom3, 3, "O",
					{mass: OMass, 
					 position:new THREE.Vector3(0, 100, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})

node3.addNeighbor(node1, HODistance * settings.unitScale)
node3.addNeighbor(node2, HODistance * settings.unitScale)

var H2O = new Network(node3);
H2O.addNode(node1)
H2O.addNode(node2)

/******************************    Hydrogen   *********************************/
var atomGeo1 = new THREE.SphereGeometry( settings.unitScale * HRadius, 100, 100 );
var atomGeo2 = new THREE.SphereGeometry( settings.unitScale * HRadius, 100, 100 );

var material1 = new THREE.MeshLambertMaterial( {color: HColor} )
var material2 = new THREE.MeshLambertMaterial( {color: HColor} )

var atom1 = new THREE.Mesh(atomGeo1, material1);
var atom2 = new THREE.Mesh(atomGeo2, material2);

var node1 = new Node(atom1, 1, "H", 
					{mass: HMass, 
					 position:new THREE.Vector3(- (HHDistance * settings.unitScale)/2, 0, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})
var node2 = new Node(atom2, 2, "H",
					{mass: HMass, 
					 position:new THREE.Vector3((HHDistance * settings.unitScale)/2, 0, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})

node1.addNeighbor(node2, HHDistance * settings.unitScale)

var H2 = new Network(node1);
H2.addNode(node2)

/******************************    Oxygen   *********************************/
var atomGeo1 = new THREE.SphereGeometry( 150, 100, 100 );
var atomGeo2 = new THREE.SphereGeometry( 150, 100, 100 );

var materialWhite1 = new THREE.MeshLambertMaterial( {color: 0xffffff} )
var materialWhite2 = new THREE.MeshLambertMaterial( {color: 0xffffff} )

var atom1 = new THREE.Mesh(atomGeo1, materialWhite1);
var atom2 = new THREE.Mesh(atomGeo2, materialWhite2);

var node1 = new Node(atom1, 1, "O",
					{mass: OMass, 
					 position:new THREE.Vector3(-(OODistance * settings.unitScale)/2, 0, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})

var node2 = new Node(atom2, 2, "O",
					{mass: OMass, 
					 position:new THREE.Vector3((OODistance * settings.unitScale)/2, 0, 0),
					 velocity:new THREE.Vector3(0, 0, 0), 
		             acceleration: new THREE.Vector3(0, 0, 0), 
		             force:new THREE.Vector3(0, 0, 0)})


node1.addNeighbor(node2, OODistance * settings.unitScale)

var O2 = new Network(node1);
O2.addNode(node2)

/******************************    Systems   *********************************/
var systems = {"H2O": H2O, "H2": H2, "O2": O2}
