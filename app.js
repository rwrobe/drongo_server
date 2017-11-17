const express = require( "express" );
const http = require( "http" );
const socketIo = require( "socket.io" );
const axios = require( "axios" );

const port = process.env.PORT || 4001;
const index = require( "./routes/index" );

const app = express();
app.use( index );

const server = http.createServer( app );
const io = socketIo( server ); // < Interesting!

let flightsAPI = "https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=38.94,38.88,-77.05,-76.07&faa=1&mlat=1&flarm=1&adsb=1&gnd=0&air=1&vehicles=1&estimated=1&maxage=14400&gliders=1&stats=1";
let flightInfoAPI = "https://data-live.flightradar24.com/clickhandler/?version=1.5&flight=";

let interval;
let myPolygon = [
	[
		38.80,
		- 77.00,
	],
	[
		38.80,
		- 77.05,
	],
	[
		38.85,
		- 77.05,
	],
	[
		38.85,
		- 77.00,
	]
];

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
			flightsAPI
		);

		let proximate_flights = pareDownToUS( res.data );

		socket.emit( "FromAPI", proximate_flights );
	} catch ( error ) {
		console.error( `Error: ${error.code}` );
	}
};

const pareDownToUS = ( states ) => {
	let pointInPoly = false;
	let flights = [];

	delete states.full_count;
	delete states.version;
	delete states.stats;

	for ( var key in states ) {
		if ( states.hasOwnProperty( key ) ) {
			flights.push( states[key][0] );
			getFlightInfo( states[key][0] );
		}
	}

	return flights;
};

const getFlightInfo = ( flight_number ) => {
	console.log( flight_number );

	axios
		.get( flightInfoAPI + flight_number )
		.then( function ( res ) {
			console.log( res );
		} )
		.catch( function ( err ) {
			console.log( err );
		} )
};

server.listen( port, () => console.log( `Listening on port ${port}` ) );