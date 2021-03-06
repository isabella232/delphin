// External dependencies
import { connect } from 'react-redux';

// Internal dependencies
import { recordTracksEvent } from 'actions/analytics';
import { resetDomain } from 'actions/my-domains';
import DomainAutoConnected from 'components/ui/my-domains/domain-card/domain-auto-connected';

export default connect(
	undefined,
	{
		recordTracksEvent,
		resetDomain,
	}
)( DomainAutoConnected );
