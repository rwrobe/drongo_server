const express = require( "express" );
const http = require( "http" );
const socketIo = require( "socket.io" );
const axios = require( "axios" );
const PnP = require( "point-in-polygon" );

const port = process.env.PORT || 4001;
const index = require( "./routes/index" );

const app = express();
app.use( index );

const server = http.createServer( app );
const io = socketIo( server ); // < Interesting!

let interval;

io.on( "connection", socket => {
	console.log( "New client connected" );

	if ( interval ) {
		clearInterval( interval );
	}

	interval = setInterval( () => getApiAndEmit( socket ), 2000 );

	socket.on( "disconnect", () => {
		console.log( "Client disconnected" );
	} );
} );

const getApiAndEmit = async socket => {
	try {
		const res = await axios.get(
			"https://opensky-network.org/api/states/all"
		); // Getting the data from DarkSky



		socket.emit( "FromAPI", res.data.states );
	} catch ( error ) {
		console.error( `Error: ${error.code}` );
	}
};

const pareDownToUS = ( states ) => {
	let self = this;
	let pointInPoly = false;
	let flights = [];

	for ( let i = 0; i < states.length; i ++ ) {
		if ( "United States" !== states[i][2] ) {
			continue;
		}

		pointInPoly = PnP( [states[i][6], states[i][5]], self.polygon );

		if ( true === pointInPoly ) {
			flights.push( states[i][1] );
		}
	}

	for ( let i = 0; i < flights.length; i ++ ) {
		if ( '' === flights[i] ) {
			flights.splice( i, 1 );
			i --;
		} else {
			flights[i] = flights[i].trim();
		}
	}

	return flights;
};

server.listen( port, () => console.log( `Listening on port ${port}` ) );