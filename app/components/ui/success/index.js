// External dependencies
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import React from 'react';

// Internal dependencies
import getPath from 'routes';

const Success = React.createClass( {
	componentWillMount() {
		if ( ! this.props.transaction ) {
			this.props.redirect( getPath( 'search' ) );
		}
	},

	render() {
		if ( ! this.props.transaction ) {
			return null;
		}

		const {
			domain,
			username,
			email,
			blogId,
			password
		} = this.props.transaction;

		return (
			<div style={ { textAlign: 'center' } }>
				<h2>You registered { domain }!!!</h2>
				<h3>we're so happy</h3>
				<h4>your username is { username }</h4>
				<h5>your email address is { email }</h5>
				<h6>your blog's ID is { blogId }</h6>
				<p>sssshshshshsshhhh your password is { password } ssshhshshhshhs</p>
			</div>
		);
	}
} );

export default connect(
	state => {
		return {
			transaction: state.checkout && state.checkout.transaction
		};
	},
	dispatch => {
		return {
			redirect: url => {
				dispatch( push( url ) );
			}
		};
	}
)( Success );