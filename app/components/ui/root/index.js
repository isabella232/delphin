// External dependencies
import i18n from 'lib/i18n';
import { Link } from 'react-router';
import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

// Internal dependencies
import { getPath } from 'routes';
import styles from './styles.scss';

const Root = ( { children } ) => {
	return (
		<div className={ styles.root }>
			<header className={ styles.header }>
				<h1 className={ styles.title }>MagicDomains</h1>
			</header>

			<div className={ styles.content }>
				{ children }
			</div>

			<footer className={ styles.footer }>
				<Link className={ styles.footerLink } to={ getPath( 'search' ) }>{ i18n.translate( 'Search' ) }</Link>
				<Link className={ styles.footerLink } to={ getPath( 'about' ) }>{ i18n.translate( 'About' ) }</Link>
				<Link className={ styles.footerLink } to="https://wordpress.com">{ i18n.translate( 'A WordPress.com service' ) }</Link>
			</footer>
		</div>
	);
};

export default withStyles( styles )( Root );