/**
 * Progressive-enhancement client-side validation + AJAX submit for the
 * [leadflow_form] shortcode. `leadflowFormData` (ajaxUrl/action/nonce) is
 * injected by wp_localize_script() in class-leadflow-shortcode.php.
 *
 * This validation is a UX convenience only (fast feedback, no round trip
 * for an obviously-empty field) - the PHP handler re-validates everything
 * server-side and is the only check that actually matters for security.
 */
( function () {
	'use strict';

	var form = document.getElementById( 'leadflow-form' );
	if ( ! form || typeof leadflowFormData === 'undefined' ) {
		return;
	}

	var errorBox = form.querySelector( '.leadflow-form__errors' );
	var submitButton = form.querySelector( '.leadflow-form__submit' );

	var REQUIRED_FIELDS = [ 'name', 'email', 'phone', 'service', 'budget_range', 'message' ];

	function clearFieldErrors() {
		REQUIRED_FIELDS.forEach( function ( fieldName ) {
			var field = form.elements[ fieldName ];
			if ( field ) {
				field.classList.remove( 'leadflow-field--invalid' );
			}
		} );
		errorBox.innerHTML = '';
		errorBox.classList.remove( 'is-visible' );
	}

	function showErrors( messages ) {
		var list = document.createElement( 'ul' );
		Object.keys( messages ).forEach( function ( fieldName ) {
			var field = form.elements[ fieldName ];
			if ( field ) {
				field.classList.add( 'leadflow-field--invalid' );
			}
			var item = document.createElement( 'li' );
			item.textContent = messages[ fieldName ];
			list.appendChild( item );
		} );
		errorBox.innerHTML = '';
		errorBox.appendChild( list );
		errorBox.classList.add( 'is-visible' );
	}

	/**
	 * Basic client-side checks mirroring the server-side rules (required
	 * fields, email shape, phone digit count). Returns a { field: message }
	 * map, empty if everything looks fine.
	 */
	function validateClientSide( data ) {
		var errors = {};

		if ( ! data.name.trim() ) {
			errors.name = 'Name is required.';
		}
		if ( ! data.email.trim() || data.email.indexOf( '@' ) === -1 ) {
			errors.email = 'A valid email address is required.';
		}
		var phoneDigits = data.phone.replace( /\D/g, '' );
		if ( phoneDigits.length < 7 ) {
			errors.phone = 'A valid phone number is required.';
		}
		if ( ! data.service ) {
			errors.service = 'Please choose a service.';
		}
		if ( ! data.budget_range ) {
			errors.budget_range = 'Please choose a budget range.';
		}
		if ( ! data.message.trim() ) {
			errors.message = 'Message is required.';
		}

		return errors;
	}

	form.addEventListener( 'submit', function ( event ) {
		event.preventDefault();
		clearFieldErrors();

		var formData = new FormData( form );
		var data = {
			name: formData.get( 'name' ) || '',
			email: formData.get( 'email' ) || '',
			phone: formData.get( 'phone' ) || '',
			service: formData.get( 'service' ) || '',
			budget_range: formData.get( 'budget_range' ) || '',
			message: formData.get( 'message' ) || '',
		};

		var clientErrors = validateClientSide( data );
		if ( Object.keys( clientErrors ).length > 0 ) {
			showErrors( clientErrors );
			return;
		}

		submitButton.disabled = true;
		submitButton.textContent = 'Sending...';

		var body = new FormData();
		body.append( 'action', leadflowFormData.action );
		body.append( 'nonce', leadflowFormData.nonce );
		Object.keys( data ).forEach( function ( key ) {
			body.append( key, data[ key ] );
		} );

		fetch( leadflowFormData.ajaxUrl, {
			method: 'POST',
			credentials: 'same-origin',
			body: body,
		} )
			.then( function ( response ) {
				return response.json();
			} )
			.then( function ( result ) {
				if ( result.success ) {
					form.innerHTML = '<p class="leadflow-form__success">' + result.data.message + '</p>';
				} else {
					if ( result.data && result.data.errors ) {
						showErrors( result.data.errors );
					} else {
						showErrors( { name: ( result.data && result.data.message ) || 'Something went wrong. Please try again.' } );
					}
					submitButton.disabled = false;
					submitButton.textContent = 'Send message';
				}
			} )
			.catch( function () {
				showErrors( { name: 'Network error. Please try again.' } );
				submitButton.disabled = false;
				submitButton.textContent = 'Send message';
			} );
	} );
} )();
