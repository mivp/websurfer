/**
 * @author mrdoob / http://mrdoob.com/
 */

//Modified OBJLoader to take optional texture in constructor
THREE.OBJLoader = function (texture) {this.texture = texture;};

THREE.OBJLoader.prototype = new THREE.Loader();
THREE.OBJLoader.prototype.constructor = THREE.OBJLoader;

THREE.OBJLoader.prototype.load = function ( url, callback, idx ) {

	var that = this;
	var xhr = new XMLHttpRequest();
        xhr.overrideMimeType('text/plain');


	xhr.onreadystatechange = function () {

		if ( xhr.readyState == 4 ) {

			if ( xhr.status == 200 || xhr.status == 0 ) {

				callback( that.parse( xhr.responseText ), idx );

			} else {

				console.error( 'THREE.OBJLoader: Couldn\'t load ' + url + ' (' + xhr.status + ')' );

			}

		}

	};

	xhr.open( "GET", url, true );
	xhr.send( null );

};

THREE.OBJLoader.prototype.parse = function ( data ) {

	function vector( x, y, z ) {

		return new THREE.Vector3( x, y, z );

	}

	function uv( u, v ) {

		return new THREE.UV( u, 1.0 - v );

	}

	function face3( a, b, c, normals ) {

		return new THREE.Face3( a, b, c, normals );

	}

	function face4( a, b, c, d, normals ) {

		return new THREE.Face4( a, b, c, d, normals );

	}

	var group = new THREE.Object3D();

	var vertices = [];
	var normals = [];
	var uvs = [];

	var pattern, result;

	// v float float float

	pattern = /v( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)/g;

	while ( ( result = pattern.exec( data ) ) != null ) {

		// ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

		vertices.push( vector(
			parseFloat( result[ 1 ] ),
			parseFloat( result[ 2 ] ),
			parseFloat( result[ 3 ] )
		) );

	}

    // # fc int float float float float float float float float float [custom way to colour vertices of a facet] 
/*
	    for (var i = 0; i < geometry.faces.length; i++) {
		f = geometry.faces[i];
		for (var j = 0; j < 3; j++) {
		    cl = new THREE.Color(0xffffff);
		    cl.setRGB(0.2 + 0.6 * (i / geometry.faces.length), 1.0, 1.0);
		    f.vertexColors[j] = cl;
		}
	    }
*/

    var has_facet_vertex_colours = false;
    pattern = /# vc( [\d]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)/g;
    while ((result = pattern.exec(data)) != null) {
	face_id = parseInt(result[1]);
	c1 = new THREE.COLOR(0xffffff);
	c1.setRGB(parseFloat(result[2]), parseFloat(result[3]), parseFloat(result[4]));
	geometry.faces[face_id].vertexColors[0] = c1;
	c2 = new THREE.COLOR(0xffffff);
	c2.setRGB(parseFloat(result[2]), parseFloat(result[3]), parseFloat(result[4]));
	geometry.faces[face_id].vertexColors[1] = c2;
	c3 = new THREE.COLOR(0xffffff);
	c3.setRGB(parseFloat(result[2]), parseFloat(result[3]), parseFloat(result[4]));
	geometry.faces[face_id].vertexColors[2] = c3;
	has_facet_vertex_colours = true;
    }

	// vn float float float

	pattern = /vn( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)/g;

	while ( ( result = pattern.exec( data ) ) != null ) {

		// ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

		normals.push( vector(
			parseFloat( result[ 1 ] ),
			parseFloat( result[ 2 ] ),
			parseFloat( result[ 3 ] )
		) );

	}

	// vt float float

	pattern = /vt( [\d|\.|\+|\-|e]+)( [\d|\.|\+|\-|e]+)/g;

	while ( ( result = pattern.exec( data ) ) != null ) {

		// ["vt 0.1 0.2", "0.1", "0.2"]

		uvs.push( uv(
			parseFloat( result[ 1 ] ),
			parseFloat( result[ 2 ] )
		) );

	}

	var data = data.split( '\no ');

	for ( var i = 0, l = data.length; i < l; i ++ ) {

		var object = data[ i ];

		var geometry = new THREE.Geometry();

		geometry.vertices = vertices;

		// f vertex vertex vertex ...

		pattern = /f( [\d]+)( [\d]+)( [\d]+)( [\d]+)?/g;

		while ( ( result = pattern.exec( object ) ) != null ) {

			// ["f 1 2 3", "1", "2", "3", undefined]

			if ( result[ 4 ] === undefined ) {
			
				geometry.faces.push( face3(
					parseInt( result[ 1 ] ) - 1,
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 3 ] ) - 1
				) );

			} else {

				geometry.faces.push( face4(
					parseInt( result[ 1 ] ) - 1,
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 3 ] ) - 1,
					parseInt( result[ 4 ] ) - 1
				) );

			}

		}

		// f vertex/uv vertex/uv vertex/uv ...

		pattern = /f( ([\d]+)\/([\d]+))( ([\d]+)\/([\d]+))( ([\d]+)\/([\d]+))( ([\d]+)\/([\d]+))?/g;

		while ( ( result = pattern.exec( object ) ) != null ) {

			// ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3", undefined, undefined, undefined]

			if ( result[ 10 ] === undefined ) {
			
				geometry.faces.push( face3(
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 5 ] ) - 1,
					parseInt( result[ 8 ] ) - 1
				) );

				geometry.faceVertexUvs[ 0 ].push( [
					uvs[ parseInt( result[ 3 ] ) - 1 ],
					uvs[ parseInt( result[ 6 ] ) - 1 ],
					uvs[ parseInt( result[ 9 ] ) - 1 ]
				] );

			} else {

				geometry.faces.push( face4(
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 5 ] ) - 1,
					parseInt( result[ 8 ] ) - 1,
					parseInt( result[ 11 ] ) - 1
				) );

				geometry.faceVertexUvs[ 0 ].push( [
					uvs[ parseInt( result[ 3 ] ) - 1 ],
					uvs[ parseInt( result[ 6 ] ) - 1 ],
					uvs[ parseInt( result[ 9 ] ) - 1 ],
					uvs[ parseInt( result[ 12 ] ) - 1 ]
				] );

			}

		}

		// f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...

		pattern = /f( ([\d]+)\/([\d]+)\/([\d]+))( ([\d]+)\/([\d]+)\/([\d]+))( ([\d]+)\/([\d]+)\/([\d]+))( ([\d]+)\/([\d]+)\/([\d]+))?/g;

		while ( ( result = pattern.exec( object ) ) != null ) {

			// ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3", undefined, undefined, undefined, undefined]

			if ( result[ 13 ] === undefined ) {
			
				geometry.faces.push( face3(
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 6 ] ) - 1,
					parseInt( result[ 10 ] ) - 1,
					[
						normals[ parseInt( result[ 4 ] ) - 1 ],
						normals[ parseInt( result[ 8 ] ) - 1 ],
						normals[ parseInt( result[ 12 ] ) - 1 ]
					]
				) );

				geometry.faceVertexUvs[ 0 ].push( [
					uvs[ parseInt( result[ 3 ] ) - 1 ],
					uvs[ parseInt( result[ 7 ] ) - 1 ],
					uvs[ parseInt( result[ 11 ] ) - 1 ]
				] );

			} else {

				geometry.faces.push( face4(
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 6 ] ) - 1,
					parseInt( result[ 10 ] ) - 1,
					parseInt( result[ 14 ] ) - 1,
					[
						normals[ parseInt( result[ 4 ] ) - 1 ],
						normals[ parseInt( result[ 8 ] ) - 1 ],
						normals[ parseInt( result[ 12 ] ) - 1 ],
						normals[ parseInt( result[ 16 ] ) - 1 ]
					]
				) );

				geometry.faceVertexUvs[ 0 ].push( [
					uvs[ parseInt( result[ 3 ] ) - 1 ],
					uvs[ parseInt( result[ 7 ] ) - 1 ],
					uvs[ parseInt( result[ 11 ] ) - 1 ],
					uvs[ parseInt( result[ 15 ] ) - 1 ]
				] );

			}


		}

		// f vertex//normal vertex//normal vertex//normal ...

		pattern = /f( ([\d]+)\/\/([\d]+))( ([\d]+)\/\/([\d]+))( ([\d]+)\/\/([\d]+))( ([\d]+)\/\/([\d]+))?/g;

		while ( ( result = pattern.exec( object ) ) != null ) {

			// ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]

			if ( result[ 10 ] === undefined ) {
			
				geometry.faces.push( face3(
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 5 ] ) - 1,
					parseInt( result[ 8 ] ) - 1,
					[
						normals[ parseInt( result[ 3 ] ) - 1 ],
						normals[ parseInt( result[ 6 ] ) - 1 ],
						normals[ parseInt( result[ 9 ] ) - 1 ]
					]
				) );

			} else {

				geometry.faces.push( face4(
					parseInt( result[ 2 ] ) - 1,
					parseInt( result[ 5 ] ) - 1,
					parseInt( result[ 8 ] ) - 1,
					parseInt( result[ 11 ] ) - 1,
					[
						normals[ parseInt( result[ 3 ] ) - 1 ],
						normals[ parseInt( result[ 6 ] ) - 1 ],
						normals[ parseInt( result[ 9 ] ) - 1 ],
						normals[ parseInt( result[ 12 ] ) - 1 ]
					]
				) );

			}

		}

		geometry.computeCentroids();

    //Modified OBJLoader to take optional texture in constructor
	    if (this.texture) {
    		group.add( new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { map: this.texture } )));
	    } else if (has_facet_vertex_colours) {
  		group.add( new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({color: 0xbb5522, shininess: 50, vertexColors: THREE.VertexColors}) ) );
	    } else {
  		group.add( new THREE.Mesh( geometry, new THREE.MeshPhongMaterial({color: 0xbb5522, shininess: 50}) ) );
	    }

	}
	return group;

}
