// External dependencies
import classNames from 'classnames';
import React, { PropTypes } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

// Internal dependencies
import styles from './styles.scss';
import FieldArea from 'components/ui/form/field-area';
import SubmitArea from 'components/ui/form/submit-area';
import Footer from 'components/ui/form/footer';
import { withErrorFocuser } from 'components/ui/form/error-focuser';

const Form = withErrorFocuser( withStyles( styles )( ( { children, onSubmit, className, autoComplete } ) => (
	<form onSubmit={ onSubmit } className={ classNames( styles.form, className ) } noValidate autoComplete={ autoComplete }>
		{ children }
	</form>
) ) );

Form.FieldArea = FieldArea;
Form.SubmitArea = SubmitArea;
Form.Footer = Footer;

Form.propTypes = {
	children: PropTypes.oneOfType( [
		PropTypes.arrayOf( React.PropTypes.node ),
		PropTypes.node
	] ).isRequired,
	className: PropTypes.string,
	errors: PropTypes.object,
	onSubmit: PropTypes.func
};

export default Form;
