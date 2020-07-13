const multer = require( 'multer' );
const sharp = require( 'sharp' );

const User = require( '../models/userModel' );
const catchAsync = require( '../utils/catchAsync' );
const AppError = require( '../utils/appError' );
const factory = require( './handlerFactory' );
const utils = require( '../utils/index' );

const multerStorage = multer.memoryStorage();

const multerFilter = ( req, file, callback ) =>
{
	if ( file.mimetype.startsWith( 'image' ) ) { callback( null, true ); }
	else { callback( new AppError( 'Not an image! Please upload an image only!', 400 ), false ); }
};

const upload = multer(
{
	storage: multerStorage,
	fileFilter: multerFilter
});

exports.uploadUserPhoto = upload.single( 'photo' );

exports.resizeUserPhoto = catchAsync( async ( req, res, next ) =>
{
	if ( ! req.file ) { return next(); }

	req.file.filename = `${req.currentUser.name.split( ' ' )[ 0 ].toLowerCase()}-${Date.now()}.jpeg`;

	await sharp( req.file.buffer ).resize( 500, 500 ).toFormat( 'jpeg' ).jpeg( { quality: 90 } )
		.toFile( `public/img/users/${req.file.filename}` );

	next();
});

/**
 * Sets ID of currently logged in user as an endpoint parameter
 * @param {object} req 
 * @param {object} res 
 * @param {function} next to proceed to next middleware
 */
exports.getMe = ( req, res, next ) =>
{
	req.params.id = req.currentUser.id;
	next();
};

exports.updateMe = catchAsync( async ( req, res, next ) =>
{
	// create error if user POSTs password data
	if ( req.body.password || req.body.passwordConfirm )
	{
		return next( new AppError( 'To update your passsword, please use the /update-my-password endpoint!', 400 ) );
	}
	
	// rest parameters for fields that are allowed to be updated
	const filteredRequestBody = utils.filterObj( req.body, 'name', 'email' );

	if ( req.file )  { filteredRequestBody.photo = req.file.filename; } 

	const updatedUser = await User.findByIdAndUpdate( req.currentUser.id, filteredRequestBody, { new: true, runValidators: true } );

	res.status( 200 ).json(
	{
		status: 'success',
		requestedAt: req.requestTime,
		data: { user: updatedUser }
	});
});

exports.deleteMe = catchAsync( async ( req, res, next ) =>
{
	await User.findByIdAndUpdate( req.currentUser.id, { active: false } );
	res.status( 204 ).json(
	{
		status: 'success',
		requestedAt: req.requestTime,
		data: null
	});
});

exports.getAllUsers = factory.getAll( User );
exports.getUser = factory.getOne( User );
exports.updateUser = factory.updateOne( User );	// Do NOT update passwords with this!
exports.deleteUser = factory.deleteOne( User );