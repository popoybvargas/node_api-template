/**
 * 
 * @param {object} requestBodyObject 
 * @param  {...string} allowedFields rest params
 */
exports.filterObj = ( requestBodyObject, ...allowedFields ) =>
{
	const newObj = {};
	Object.keys( requestBodyObject ).forEach( el =>
	{
		if ( allowedFields.includes( el ) ) { newObj[ el ] = requestBodyObject[ el ]; }
	});

	return newObj;
};