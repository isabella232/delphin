// External dependencies
import i18n from 'i18n-calypso';
import React, { PropTypes } from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

// Internal dependencies
import styles from './styles.scss';
import Synonym from './synonym';

const Synonyms = ( { target, replace, relatedWords } ) => {
	const showRelatedWords = relatedWords.hasLoadedFromServer && relatedWords.data.length > 0,
		{ isRequesting } = relatedWords;

	return (
		<div className={ styles.synonyms }>
			{ showRelatedWords && (
				<div>
					<h3>
						{ i18n.translate( 'Try one of these instead of {{keyword/}}:', {
							components: {
								context: 'keyword is a word a user entered to which we will display synonyms to follow',
								keyword: <strong>{ target.value }</strong>
							}
						} ) }
					</h3>
					<ul className={ styles.synonymList }>
						{ relatedWords.data.map( word => (
							<Synonym key={ word } synonym={ word } onSynonymClick={ replace } />
						) ) }
					</ul>
				</div>
			) }

			{ ! showRelatedWords && ! isRequesting && (
				<h3>
					{ i18n.translate( 'No related words for %(word)s were found.', {
						args: { word: target.value }
					} ) }
				</h3>
			) }

			{ isRequesting && (
				<h3>{ i18n.translate( 'Loading…' ) }</h3>
			) }
		</div>
	);
};

Synonyms.propTypes = {
	target: PropTypes.shape( { value: PropTypes.string.isRequired, isSelected: PropTypes.bool.isRequired } ).isRequired,
	relatedWords: PropTypes.object.isRequired,
	replace: PropTypes.func.isRequired
};

export default withStyles( styles )( Synonyms );
