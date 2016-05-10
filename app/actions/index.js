// External dependencies
import debugFactory from 'debug';
import request from 'superagent';
import WPCOM from 'wpcom';
const debug = debugFactory( 'delphin:actions' );

// Internal dependencies
import { addNotice } from 'actions/notices';
import { removeBearerCookie, saveTokenInBearerCookie } from 'client/bearer-cookie';
import {
	CONNECT_USER,
	CONNECT_USER_COMPLETE,
	CONNECT_USER_FAIL,
	CONNECT_USER_WARNING,
	CREATE_SITE_COMPLETE,
	CREATE_TRANSACTION_COMPLETE,
	FETCH_USER,
	FETCH_USER_COMPLETE,
	FETCH_USER_FAIL,
	REMOVE_USER,
	VERIFY_USER,
	VERIFY_USER_COMPLETE,
	VERIFY_USER_FAIL
} from 'reducers/action-types';
import paygateLoader from 'lib/paygate-loader';

let wpcomAPI = WPCOM();

export function removeUser() {
	return { type: REMOVE_USER };
}

/**
 * Connects a user to a new or existing accout by sending a confirmation code to the specified email.
 *
 * @param {string} email address of the user
 * @param {string} intention of the user - login or signup
 * @param {function} [callback] optional callback to call upon success
 * @returns {function} the corresponding action thunk
 */
export function connectUser( email, intention, callback ) {
	return dispatch => {
		dispatch( {
			type: CONNECT_USER,
			email,
			intention
		} );

		return new Promise( ( resolve, reject ) => {
			let url = '/users/email';
			if ( intention === 'signup' ) {
				url += '/new';
			}

			request.post( url ).send( { email } ).end( ( error, response ) => {
				const data = JSON.parse( response.text );

				if ( error ) {
					dispatch( { type: CONNECT_USER_FAIL } );

					return reject( { email: data.message } );
				}

				if ( data.warning ) {
					dispatch( {
						notice: data.message,
						type: CONNECT_USER_WARNING
					} );
				}

				dispatch( {
					email,
					twoFactorAuthenticationEnabled: data.two_factor_authentication_enabled,
					type: CONNECT_USER_COMPLETE
				} );

				callback && callback();

				resolve();
			} );
		} );
	};
}

/**
 * Fetches the user profile with the specified access token.
 *
 * @param {string} bearerToken - access token
 * @returns {function} the corresponding action thunk
 */
export function fetchUser( bearerToken ) {
	return dispatch => {
		dispatch( {
			type: FETCH_USER
		} );

		const wpcom = WPCOM( bearerToken );
		const me = wpcom.me();

		me.get( ( error, results ) => {
			if ( error ) {
				dispatch( { type: FETCH_USER_FAIL } );

				removeBearerCookie();

				return;
			}

			dispatch( { type: FETCH_USER_COMPLETE, bearerToken, email: results.email } );
		} );
	};
}

/**
 * Logs the user out and deletes any bearer cookie.
 *
 * @returns {function} the corresponding action thunk
 */
export function logoutUser() {
	return dispatch => {
		dispatch( {
			type: REMOVE_USER
		} );

		removeBearerCookie();
	};
}

export function verifyUser( email, code, twoFactorAuthenticationCode ) {
	return dispatch => {
		dispatch( { type: VERIFY_USER } );

		return new Promise( ( resolve, reject ) => {
			const payload = { email, code, two_factor_authentication_code: twoFactorAuthenticationCode };

			request.post( '/users/email/verification' ).send( payload ).end( ( error, response ) => {
				const data = JSON.parse( response.text );

				if ( error ) {
					dispatch( {
						type: VERIFY_USER_FAIL
					} );

					if ( data.error === 'invalid_verification_code' ) {
						return reject( { code: data.message } );
					}

					if ( data.error === 'invalid_2FA_code' ) {
						return reject( { twoFactorAuthenticationCode: data.message } );
					}

					// If the error isn't invalid_verification_code or invalid_2FA_code
					// Then add it as a global notice
					dispatch( addNotice( {
						message: data.message,
						status: 'error'
					} ) );

					return reject();
				}

				const bearerToken = response.body.token.access_token;

				// Reinitialize WPCOM so that future requests will be authenticated
				wpcomAPI = WPCOM( bearerToken );

				saveTokenInBearerCookie( bearerToken );

				dispatch( { type: VERIFY_USER_COMPLETE, bearerToken } );

				resolve();
			} );
		} );
	};
}

export function createSite( user, form ) {
	return dispatch => {
		const payload = {
			bearer_token: user.data.bearerToken,
			blog_name: form.domain,
			blog_title: form.domain,
			lang_id: 1,
			locale: 'en',
			validate: false,
			find_available_url: true
		};

		request.post( '/sites/new' ).send( payload ).end( ( error, results ) => {
			const data = JSON.parse( results.text );

			if ( error ) {
				return dispatch( addNotice( {
					message: data.message,
					status: 'error'
				} ) );
			}

			dispatch( createSiteComplete( Object.assign( {}, form, { blogId: data.blog_details.blogid } ) ) );
		} );
	};
}

export function createSiteComplete( form ) {
	return {
		type: CREATE_SITE_COMPLETE,
		domain: form.domain,
		blogId: form.blogId
	};
}

function getPaygateParameters( cardDetails ) {
	return {
		name: cardDetails.name,
		number: cardDetails.number,
		cvc: cardDetails.cvv,
		zip: cardDetails['postal-code'],
		country: cardDetails.country,
		exp_month: cardDetails['expiration-date'].substring( 0, 2 ),
		exp_year: '20' + cardDetails['expiration-date'].substring( 3, 5 )
	};
}

function createPaygateToken( requestType, cardDetails, callback ) {
	wpcomAPI.req.get( '/me/paygate-configuration', { request_type: requestType }, function( error, configuration ) {
		if ( error ) {
			callback( error );
			return;
		}

		paygateLoader.ready( configuration.js_url, function( innerError, Paygate ) {
			if ( innerError ) {
				callback( innerError );
				return;
			}

			Paygate.setProcessor( configuration.processor );
			Paygate.setApiUrl( configuration.api_url );
			Paygate.setPublicKey( configuration.public_key );
			Paygate.setEnvironment( configuration.environment );

			const parameters = getPaygateParameters( cardDetails );
			Paygate.createToken( parameters, onSuccess, onFailure );
		} );
	} );

	function onSuccess( data ) {
		if ( data.is_error ) {
			return callback( new Error( 'Paygate Response Error: ' + data.error_msg ) );
		}

		callback( null, data.token );
	}

	function onFailure() {
		callback( new Error( 'Paygate Request Error' ) );
	}
}

export function createTransaction( user, form ) {
	const cardDetails = {
		bearer_token: user.data.bearerToken,
		name: form.name,
		number: form['credit-card-number'],
		cvv: form.cvv,
		'expiration-date': form['expiration-date'],
		'postal-code': form['postal-code']
	};

	return dispatch => {
		createPaygateToken( 'new_purchase', cardDetails, function( error, response ) {
			const payload = {
				bearer_token: user.data.bearerToken,
				payment_key: response,
				payment_method: 'WPCOM_Billing_MoneyPress_Paygate',
				locale: 'en',
				cart: {
					blog_id: form.blogId,
					currency: 'GBP',
					temporary: 1,
					extra: {},
					products: [
						{
							product_id: 6,
							meta: form.domain,
							volume: 1,
							free_trial: false
						}
					]
				},
				domain_details: {
					first_name: 'Wesley',
					last_name: 'Snipes',
					address_1: 'The Tomb of Dracula road',
					city: 'Boston',
					state: 'MA',
					postal_code: '02110',
					country_code: 'US',
					email: 'wesley@snipes.com',
					phone: '666-666-666'
				}
			};

			wpcomAPI.req.post( '/me/transactions', payload, ( apiError, apiResults ) => {
				if ( apiError ) {
					return dispatch( addNotice( {
						message: apiError.message,
						status: 'error'
					} ) );
				}

				debug( apiResults );

				dispatch( createTransactionComplete( form ) );
			} );
		} );
	};
}

export function createTransactionComplete( form ) {
	return {
		type: CREATE_TRANSACTION_COMPLETE,
		form
	};
}
